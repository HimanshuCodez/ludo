import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import QRCode from 'qrcode';
import bodyParser from 'body-parser';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';

// Firebase configuration
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

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());


 




// Get Wallet Balance
app.get('/wallet/:userId', async (req, res) => {
  const { userId } = req.params;
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  const balance = userSnap.exists() ? userSnap.data().depositChips || 0 : 0;
  res.status(200).json({ balance });
});

let challenges = [];
let matches = [];

io.on('connection', (socket) => {
  console.log('✅ Socket connected:', socket.id);

  socket.on('fetchWalletBalance', async (userId) => {
    console.log(`[Server] Fetching balance for user ${userId}`);
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    const balance = userSnap.exists() ? userSnap.data().depositChips || 0 : 0;
    console.log(`[Server] Balance for ${userId} is ${balance}`);
    if (balance >= 0) { // Ensure valid balance before emitting
      socket.emit('walletUpdated', { balance });
    } else {
      console.log(`[Server] Invalid balance for ${userId}, using 0`);
      socket.emit('walletUpdated', { balance: 0 });
    }
  });

  socket.emit('updateChallenges', getClientChallenges(socket.id));
  socket.emit('updateMatches', getClientMatches());

  socket.on('challenge:create', async (data, ack) => {
    const { amount, userId } = data;
    if (isNaN(amount) || amount <= 0) {
      socket.emit('error', { message: 'Invalid challenge amount.' });
      if (ack) ack(false);
      return;
    }

    if (challenges.find((c) => c.createdBy === socket.id)) {
      socket.emit('error', { message: 'You already have an active challenge.' });
      if (ack) ack(false);
      return;
    }

    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    const balance = userSnap.exists() ? userSnap.data().depositChips || 0 : 0;
    if (balance < amount) {
      socket.emit('error', { message: 'Low balance! Please add cash to create a challenge.' });
      if (ack) ack(false);
      return;
    }

    const name = (userSnap.exists() ? userSnap.data().name : `Player_${socket.id.substring(0, 4)}`);
    const challenge = {
      id: `challenge-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      amount,
      createdBy: socket.id,
      userId,
    };

    challenges.push(challenge);
    socket.emit('yourChallengeId', challenge.id);
    updateAllQueues();
    console.log(`[Server] Challenge created: ${challenge.id} by ${name} for ₹${amount}`);
    if (ack) ack(true);
  });

  socket.on('challenge:accept', async (data, ack) => {
    const { challengeId, userId } = data;
    const challenge = challenges.find((c) => c.id === challengeId);
    if (!challenge) {
      socket.emit('error', { message: 'Challenge not found.' });
      if (ack) ack(false);
      return;
    }
    if (challenge.createdBy === socket.id) {
      socket.emit('error', { message: 'Cannot accept your own challenge.' });
      if (ack) ack(false);
      return;
    }

    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    const balance = userSnap.exists() ? userSnap.data().depositChips || 0 : 0;
    if (balance < challenge.amount) {
      socket.emit('error', { message: 'Low balance! Please add cash to accept this challenge.' });
      if (ack) ack(false);
      return;
    }

    challenges = challenges.filter((c) => c.id !== challengeId);

    const userRefCreator = doc(db, 'users', challenge.userId);
    const userSnapCreator = await getDoc(userRefCreator);
    const playerBName = userSnap.exists() ? userSnap.data().name : `Player_${socket.id.substring(0, 4)}`;
    const playerAName = userSnapCreator.exists() ? userSnapCreator.data().name : challenge.name;

    const matchId = `match-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const match = {
      id: matchId,
      playerA: { id: challenge.createdBy, name: playerAName, userId: challenge.userId },
      playerB: { id: socket.id, name: playerBName, userId },
      amount: challenge.amount,
      generatedRoomCode: '',
      roomCodeProvider: null,
      playerResults: {},
    };

    matches.push(match);

    const matchRef = doc(collection(db, 'matches'));
    await setDoc(matchRef, match);

    updateAllQueues();

    io.to(challenge.createdBy).emit('matchConfirmed', { roomId: match.id });
    io.to(socket.id).emit('matchConfirmed', { roomId: match.id });
    console.log(`[Server] Match created: ${match.id}`);
    if (ack) ack(true);
  });

  socket.on('joinRoom', async ({ roomId, userName }) => {
    const match = matches.find((m) => m.id === roomId);
    if (!match) {
      socket.emit('roomNotFound', { message: 'Room not found.' });
      return;
    }

    socket.join(roomId);
    const roomData = {
      players: [match.playerA, match.playerB].filter((p) => p && p.id),
      generatedRoomCode: match.generatedRoomCode,
      roomCodeProvider: match.roomCodeProvider,
    };

    io.to(roomId).emit('roomStateUpdate', roomData);
    if (match.generatedRoomCode) {
      socket.emit('userProvidedRoomCode', match.generatedRoomCode);
    }
  });

  socket.on('userProvidedRoomCode', async ({ roomId, code }) => {
    const match = matches.find((m) => m.id === roomId);
    if (!match) {
      socket.emit('error', { message: 'Room not found.' });
      return;
    }

    if (!/^\d{8}$/.test(code)) {
      socket.emit('error', { message: 'Invalid room code. Must be an 8-digit number.' });
      return;
    }

    if (match.generatedRoomCode && match.roomCodeProvider !== socket.id) {
      socket.emit('error', { message: 'Room code already provided.' });
      return;
    }

    match.generatedRoomCode = code;
    match.roomCodeProvider = socket.id;

    const matchRef = doc(collection(db, 'matches'), match.id);
    await setDoc(matchRef, match, { merge: true });

    io.to(roomId).emit('userProvidedRoomCode', code);
    io.to(roomId).emit('roomStateUpdate', {
      players: [match.playerA, match.playerB].filter((p) => p && p.id),
      generatedRoomCode: code,
      roomCodeProvider: socket.id,
    });
  });

  socket.on('submitGameResult', async ({ roomId, result }) => {
    const match = matches.find((m) => m.id === roomId);
    if (!match) {
      socket.emit('error', { message: 'Room not found.' });
      return;
    }

    match.playerResults[socket.id] = result;

    const matchRef = doc(collection(db, 'matches'), match.id);
    await setDoc(matchRef, match, { merge: true });

    io.to(roomId).emit('gameResultUpdate', match.playerResults);
    console.log(`[Server] Game result submitted by ${socket.id} for room ${roomId}: ${result}`);
  });

  socket.on('disconnect', async () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);
    challenges = challenges.filter((c) => c.createdBy !== socket.id);
    matches = matches.filter((m) => m.playerA.id !== socket.id && m.playerB.id !== socket.id);

    const matchesSnapshot = await getDocs(collection(db, 'matches'));
    matchesSnapshot.forEach(async (docSnap) => {
      const match = docSnap.data();
      if (match.playerA.id === socket.id || match.playerB.id === socket.id) {
        await deleteDoc(doc(db, 'matches', docSnap.id));
      }
    });

    updateAllQueues();
  });

  function updateAllQueues() {
    io.emit('updateChallenges', getClientChallenges());
    io.emit('updateMatches', getClientMatches());
  }

  function getClientChallenges(requestorId = null) {
    return challenges.map((ch) => ({
      ...ch,
      own: requestorId ? ch.createdBy === requestorId : undefined,
    }));
  }

  function getClientMatches() {
    return matches.map((m) => ({
      id: m.id,
      playerA: m.playerA,
      playerB: m.playerB,
      amount: m.amount,
    }));
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log('🚀 Server running on port', PORT);
});