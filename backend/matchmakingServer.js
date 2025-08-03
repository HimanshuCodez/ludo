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

const generateQR = async (upiString) => {
  try {
    return await QRCode.toDataURL(upiString);
  } catch (err) {
    console.error('[Server] QR Generation Error:', err);
    throw err;
  }
};

// Deposit Chips
app.post('/depositChips', async (req, res) => {
  const { userId, amount } = req.body;
  if (!userId || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Invalid user ID or amount' });
  }

  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    return res.status(404).json({ error: 'User not found' });
  }

  const currentBalance = userSnap.data().depositChips || 0;
  const newBalance = currentBalance + parseInt(amount);
  await updateDoc(userRef, { depositChips: newBalance });

  io.to(userId).emit('walletUpdated', { balance: newBalance });
  console.log(`[Server] Deposited ₹${amount} for ${userId}, new balance: ${newBalance}`);
  res.status(200).json({ message: 'Chips deposited', balance: newBalance });
});

// Generate QR Code and Payment Request
app.post('/QR', async (req, res) => {
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
    screenshotUrl: null,
    createdAt: Date.now(),
    expiresAt: Date.now() + 5 * 60 * 1000,
  };

  const paymentRef = doc(collection(db, 'payments'));
  await setDoc(paymentRef, paymentRequest);
  io.to(userId).emit('paymentRequestCreated', paymentRequest);

  res.status(200).json({ qr, transactionId, expiresAt: paymentRequest.expiresAt });
});

// Upload Payment Screenshot to Firebase Storage
app.post('/uploadScreenshot', async (req, res) => {
  const { transactionId, userId, screenshotBase64 } = req.body;
  if (!screenshotBase64 || !transactionId || !userId) {
    return res.status(400).json({ error: 'Missing screenshot, transactionId, or userId' });
  }

  const paymentRef = doc(db, 'payments', transactionId);
  const paymentSnap = await getDoc(paymentRef);
  const paymentData = paymentSnap.data();

  if (!paymentData || paymentData.status !== 'pending') {
    return res.status(400).json({ error: 'Invalid or expired payment request' });
  }

  if (paymentData.expiresAt < Date.now()) {
    await updateDoc(paymentRef, { status: 'expired' });
    return res.status(400).json({ error: 'Payment request expired' });
  }

  const storageRef = ref(storage, `screenshots/${transactionId}`);
  await uploadString(storageRef, screenshotBase64.split(',')[1], 'base64');
  const screenshotUrl = await getDownloadURL(storageRef);

  await updateDoc(paymentRef, {
    screenshotUrl,
    status: 'awaiting_verification',
  });

  io.to(userId).emit('screenshotUploaded', { transactionId, status: 'awaiting_verification' });
  res.status(200).json({ message: 'Screenshot uploaded, awaiting admin verification' });
});

// Admin Endpoint to Verify Payment
app.post('/admin/verifyPayment', async (req, res) => {
  const { transactionId, isApproved } = req.body;
  const paymentRef = doc(db, 'payments', transactionId);
  const paymentSnap = await getDoc(paymentRef);
  const paymentData = paymentSnap.data();

  if (!paymentData || paymentData.status !== 'awaiting_verification') {
    return res.status(400).json({ error: 'Invalid or already processed payment request' });
  }

  if (isApproved) {
    paymentData.status = 'completed';
    const userRef = doc(db, 'users', paymentData.userId);
    const userSnap = await getDoc(userRef);
    const currentBalance = userSnap.data().depositChips || 0;
    const newBalance = currentBalance + paymentData.amount;
    await updateDoc(userRef, { depositChips: newBalance });
    await setDoc(paymentRef, paymentData);

    io.to(paymentData.userId).emit('paymentValidated', {
      transactionId,
      amount: paymentData.amount,
      walletBalance: newBalance,
    });

    res.status(200).json({ message: 'Payment approved', walletBalance: newBalance });
  } else {
    paymentData.status = 'rejected';
    await setDoc(paymentRef, paymentData);
    io.to(paymentData.userId).emit('paymentRejected', { transactionId, message: 'Payment rejected by admin' });
    res.status(200).json({ message: 'Payment rejected' });
  }
});

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
    socket.emit('walletUpdated', { balance });
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