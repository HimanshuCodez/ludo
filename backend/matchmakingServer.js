import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import QRCode from 'qrcode';
import bodyParser from 'body-parser';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import admin from 'firebase-admin';
import fs from 'fs/promises';
import path from 'path';

const firebaseConfig = {
  apiKey: "AIzaSyB_6u0qyrPrITSOjRsdL4czCB4kZBJlviw",
  authDomain: "life-ludo-d89c0.firebaseapp.com",
  projectId: "life-ludo-d89c0",
  storageBucket: "life-ludo-d89c0.firebasestorage.app",
  messagingSenderId: "165762355659",
  appId: "1:165762355659:web:fcf3f6e912b4c2ad04e64e",
  measurementId: "G-PYZ7195T91",
};

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['https://ludo-zeta-self.vercel.app', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

const serviceAccount = require('./serviceAccountKey.json'); // Add your service account key
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

const generateQR = async (upiString) => {
  try {
    return await QRCode.toDataURL(upiString);
  } catch (err) {
    console.error('[Server] QR Generation Error:', err);
    throw err;
  }
};

app.post('/QR', async (req, res) => {
  try {
    const amount = parseInt(req.body.Amount);
    const userId = req.body.userId;
    if (!userId || isNaN(amount) || amount < 50 || amount > 100000) {
      return res.status(400).json({ error: 'Invalid user ID or amount (50-100000)' });
    }

    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const upiString = `upi://pay?pa=7378160677-2@axl&pn=Irfan&am=${amount}&cu=INR&tr=${transactionId}`;
    const qr = await generateQR(upiString);

    const paymentRequest = {
      transactionId,
      userId,
      amount,
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000,
    };

    const paymentRef = doc(db, 'payments', transactionId);
    await setDoc(paymentRef, paymentRequest);
    io.to(userId).emit('paymentRequestCreated', paymentRequest);

    res.status(200).json({ qr, transactionId, expiresAt: paymentRequest.expiresAt });
  } catch (error) {
    console.error('[Server] QR Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/wallet/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    const balance = userSnap.exists() ? userSnap.data().depositChips || 0 : 0;
    res.status(200).json({ balance });
  } catch (error) {
    console.error('[Server] Wallet Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

let challenges = [];
let matches = [];

io.on('connection', (socket) => {
  console.log('✅ Socket connected:', socket.id);

  socket.on('fetchWalletBalance', async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      const balance = userSnap.exists() ? userSnap.data().depositChips || 0 : 0;
      socket.emit('walletUpdated', { balance });
    } catch (error) {
      console.error('[Server] Fetch Balance Error:', error);
      socket.emit('walletUpdated', { balance: 0 });
    }
  });

  socket.emit('updateChallenges', getClientChallenges(socket.id));
  socket.emit('updateMatches', getClientMatches());

  socket.on('challenge:create', async (data, ack) => {
    try {
      const { amount, userId } = data;
      if (isNaN(amount) || amount <= 0) {
        socket.emit('error', { message: 'Invalid amount' });
        if (ack) ack(false);
        return;
      }

      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      const balance = userSnap.exists() ? userSnap.data().depositChips || 0 : 0;
      if (balance < amount) {
        socket.emit('error', { message: 'Insufficient balance' });
        if (ack) ack(false);
        return;
      }

      const challenge = {
        id: `challenge-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: userSnap.exists() ? userSnap.data().name : `Player_${socket.id.slice(0, 4)}`,
        amount,
        createdBy: socket.id,
        userId,
      };
      challenges.push(challenge);
      socket.emit('yourChallengeId', challenge.id);
      updateAllQueues();
      if (ack) ack(true);
    } catch (error) {
      console.error('[Server] Create Challenge Error:', error);
      socket.emit('error', { message: 'Failed to create challenge' });
      if (ack) ack(false);
    }
  });

  socket.on('challenge:accept', async (data, ack) => {
    try {
      const { challengeId, userId: acceptorId } = data;
      const challenge = challenges.find(c => c.id === challengeId);
      if (!challenge) {
        socket.emit('error', { message: 'Challenge not found' });
        if (ack) ack(false);
        return;
      }
      if (challenge.createdBy === socket.id) {
        socket.emit('error', { message: 'Cannot accept your own challenge' });
        if (ack) ack(false);
        return;
      }

      const acceptorRef = doc(db, 'users', acceptorId);
      const acceptorSnap = await getDoc(acceptorRef);
      const acceptorBalance = acceptorSnap.exists() ? acceptorSnap.data().depositChips || 0 : 0;
      if (acceptorBalance < challenge.amount) {
        socket.emit('error', { message: 'Insufficient balance to accept' });
        if (ack) ack(false);
        return;
      }

      challenges = challenges.filter(c => c.id !== challengeId);

      const creatorRef = doc(db, 'users', challenge.userId);
      const creatorSnap = await getDoc(creatorRef);
      const matchId = `match-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const match = {
        id: matchId,
        playerA: { id: challenge.createdBy, name: creatorSnap.exists() ? creatorSnap.data().name : challenge.name, userId: challenge.userId },
        playerB: { id: socket.id, name: acceptorSnap.exists() ? acceptorSnap.data().name : `Player_${socket.id.slice(0, 4)}`, userId: acceptorId },
        amount: challenge.amount,
        status: 'waiting',
        playersJoined: 0,
      };

      matches.push(match);
      const matchRef = doc(db, 'matches', matchId);
      await setDoc(matchRef, match);

      // Automatically join both players to the room
      io.to(challenge.createdBy).emit('matchConfirmed', { roomId: matchId });
      io.to(socket.id).emit('matchConfirmed', { roomId: matchId });
      io.to(challenge.createdBy).emit('joinRoom', { roomId: matchId, userName: match.playerA.name });
      io.to(socket.id).emit('joinRoom', { roomId: matchId, userName: match.playerB.name });

      updateAllQueues();
      if (ack) ack(true);
    } catch (error) {
      console.error('[Server] Accept Challenge Error:', error);
      socket.emit('error', { message: 'Failed to accept challenge' });
      if (ack) ack(false);
    }
  });

  socket.on('joinRoom', (data) => {
    const { roomId, userName } = data;
    const match = matches.find(m => m.id === roomId);
    if (match) {
      socket.join(roomId);
      match.playersJoined += 1;
      const matchRef = doc(db, 'matches', roomId);
      setDoc(matchRef, match, { merge: true });

      const roomData = {
        players: [match.playerA, match.playerB].filter(p => p && p.id),
        status: match.status,
      };
      io.to(roomId).emit('roomStateUpdate', roomData);

      if (match.playersJoined === 2 && match.status === 'waiting') {
        match.status = 'inProgress';
        setDoc(matchRef, match, { merge: true });
        io.to(roomId).emit('gameStart');
      }
    } else {
      socket.emit('roomNotFound', { message: 'Room not found' });
    }
  });

  socket.on('disconnect', async () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);
    challenges = challenges.filter(c => c.createdBy !== socket.id);
    matches = matches.filter(m => m.playerA.id !== socket.id && m.playerB.id !== socket.id);
    const matchRefs = await getDocs(collection(db, 'matches'));
    matchRefs.forEach(async ref => {
      const match = ref.data();
      if (match.playerA.id === socket.id || match.playerB.id === socket.id) {
        await deleteDoc(doc(db, 'matches', ref.id));
      }
    });
    updateAllQueues();
  });

  function updateAllQueues() {
    io.emit('updateChallenges', getClientChallenges());
    io.emit('updateMatches', getClientMatches());
  }

  function getClientChallenges(requestorId = null) {
    return challenges.map(ch => ({
      ...ch,
      own: requestorId ? ch.createdBy === requestorId : undefined,
    }));
  }

  function getClientMatches() {
    return matches.map(m => ({
      id: m.id,
      playerA: m.playerA,
      playerB: m.playerB,
      amount: m.amount,
    }));
  }
});
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log('🚀 Server running on port', PORT));