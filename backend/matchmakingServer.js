
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import QRCode from 'qrcode';
import bodyParser from 'body-parser';
import { initializeApp } from 'firebase/app';


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

// Set up multer for screenshot uploads
const storage = multer.diskStorage({
  destination: './Uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Create uploads directory
fs.mkdir('./Uploads/', { recursive: true }).catch(console.error);

const MATCHES_FILE_PATH = path.join(__dirname, 'matches.json');
const PAYMENTS_FILE_PATH = path.join(__dirname, 'payments.json');
const WALLETS_FILE_PATH = path.join(__dirname, 'wallets.json');

let challenges = [];
let matches = [];
let paymentRequests = [];
let wallets = {};

// Load data from files
async function loadData() {
  try {
    const matchesData = await fs.readFile(MATCHES_FILE_PATH, 'utf8');
    matches = JSON.parse(matchesData);
  } catch (err) {
    matches = [];
  }
  try {
    const paymentsData = await fs.readFile(PAYMENTS_FILE_PATH, 'utf8');
    paymentRequests = JSON.parse(paymentsData);
  } catch (err) {
    paymentRequests = [];
  }
  try {
    const walletsData = await fs.readFile(WALLETS_FILE_PATH, 'utf8');
    wallets = JSON.parse(walletsData);
  } catch (err) {
    wallets = {};
  }
  console.log('[Server] Data loaded');
}

async function saveData(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`[Server] Error saving to ${filePath}:`, err.message);
  }
}

loadData();

// Initialize dummy chips for testing
app.post('/initializeDummyChips', async (req, res) => {
  const { userId, chips } = req.body;
  if (!userId || isNaN(chips) || chips < 0) {
    return res.status(400).json({ error: 'Invalid user ID or chip amount' });
  }
  wallets[userId] = (wallets[userId] || 0) + parseInt(chips);
  await saveData(WALLETS_FILE_PATH, wallets);
  io.to(userId).emit('walletUpdated', { balance: wallets[userId] });
  res.status(200).json({ message: 'Dummy chips added', balance: wallets[userId] });
});

// QR Code Generation
const generateQR = async (upiString) => {
  try {
    return await QRCode.toDataURL(upiString);
  } catch (err) {
    console.error('[Server] QR Generation Error:', err);
    throw err;
  }
};

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
    screenshot: null,
    createdAt: Date.now(),
    expiresAt: Date.now() + 5 * 60 * 1000,
  };

  paymentRequests.push(paymentRequest);
  await saveData(PAYMENTS_FILE_PATH, paymentRequests);

  io.to(userId).emit('paymentRequestCreated', paymentRequest);

  res.status(200).json({ qr, transactionId, expiresAt: paymentRequest.expiresAt });
});

// Upload Payment Screenshot
app.post('/uploadScreenshot', upload.single('screenshot'), async (req, res) => {
  const { transactionId, userId } = req.body;
  const paymentRequest = paymentRequests.find((p) => p.transactionId === transactionId && p.userId === userId);

  if (!paymentRequest || paymentRequest.status !== 'pending') {
    return res.status(400).json({ error: 'Invalid or expired payment request' });
  }

  if (paymentRequest.expiresAt < Date.now()) {
    paymentRequest.status = 'expired';
    await saveData(PAYMENTS_FILE_PATH, paymentRequests);
    return res.status(400).json({ error: 'Payment request expired' });
  }

  paymentRequest.screenshot = req.file.path;
  paymentRequest.status = 'awaiting_verification';
  await saveData(PAYMENTS_FILE_PATH, paymentRequests);

  io.to(userId).emit('screenshotUploaded', { transactionId, status: 'awaiting_verification' });

  res.status(200).json({ message: 'Screenshot uploaded, awaiting admin verification' });
});

// Admin Endpoint to Verify Payment
app.post('/admin/verifyPayment', async (req, res) => {
  const { transactionId, isApproved } = req.body;
  const paymentRequest = paymentRequests.find((p) => p.transactionId === transactionId);

  if (!paymentRequest || paymentRequest.status !== 'awaiting_verification') {
    return res.status(400).json({ error: 'Invalid or already processed payment request' });
  }

  if (isApproved) {
    paymentRequest.status = 'completed';
    wallets[paymentRequest.userId] = (wallets[paymentRequest.userId] || 0) + paymentRequest.amount;
    await saveData(WALLETS_FILE_PATH, wallets);
    await saveData(PAYMENTS_FILE_PATH, paymentRequests);

    io.to(paymentRequest.userId).emit('paymentValidated', {
      transactionId,
      amount: paymentRequest.amount,
      walletBalance: wallets[paymentRequest.userId],
    });

    res.status(200).json({ message: 'Payment approved', walletBalance: wallets[paymentRequest.userId] });
  } else {
    paymentRequest.status = 'rejected';
    await saveData(PAYMENTS_FILE_PATH, paymentRequests);
    io.to(paymentRequest.userId).emit('paymentRejected', { transactionId, message: 'Payment rejected by admin' });
    res.status(200).json({ message: 'Payment rejected' });
  }
});

// Get Wallet Balance
app.get('/wallet/:userId', (req, res) => {
  const { userId } = req.params;
  const balance = wallets[userId] || 0;
  res.status(200).json({ balance });
});

// Socket.IO Logic (with wallet balance check)
io.on('connection', (socket) => {
  console.log('✅ Socket connected:', socket.id);

  socket.emit('updateChallenges', getClientChallenges(socket.id));
  socket.emit('updateMatches', getClientMatches());
  socket.emit('walletUpdated', { balance: wallets[socket.id] || 0 });

  // socket.on('challenge:create', async (data, ack) => {
  //   const balance = wallets[socket.id] || 0;
  //   const amount = parseInt(data.amount);

  //   if (balance < amount) {
  //     socket.emit('error', { message: 'Insufficient wallet balance.' });
  //     if (ack) ack(false);
  //     return;
  //   }

  //   if (challenges.find((c) => c.createdBy === socket.id)) {
  //     socket.emit('error', { message: 'You already have an active challenge.' });
  //     if (ack) ack(false);
  //     return;
  //   }

  //   if (isNaN(amount) || amount <= 0) {
  //     socket.emit('error', { message: 'Invalid challenge amount.' });
  //     if (ack) ack(false);
  //     return;
  //   }

  //   const name = data.name || `Player_${socket.id.substring(0, 4)}`;
  //   const challenge = {
  //     id: `challenge-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  //     name,
  //     amount,
  //     createdBy: socket.id,
  //   };

  //   challenges.push(challenge);
  //   socket.emit('yourChallengeId', challenge.id);
  //   updateAllQueues();
  //   console.log(`[Server] Challenge created: ${challenge.id} by ${name} for ₹${amount}`);
  //   if (ack) ack(true);
  // });
socket.on('challenge:create', async (data, ack) => {
  const amount = parseInt(data.amount);

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

  const name = data.name || `Player_${socket.id.substring(0, 4)}`;
  const challenge = {
    id: `challenge-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    amount,
    createdBy: socket.id,
  };

  challenges.push(challenge);
  socket.emit('yourChallengeId', challenge.id);
  updateAllQueues();
  console.log(`[Server] Challenge created: ${challenge.id} by ${name} for ₹${amount}`);
  if (ack) ack(true);
});

  // socket.on('challenge:accept', async (data, ack) => {
  //   const challenge = challenges.find((c) => c.id === data.challengeId);
  //   if (!challenge) {
  //     socket.emit('error', { message: 'Challenge not found.' });
  //     if (ack) ack(false);
  //     return;
  //   }
  //   if (challenge.createdBy === socket.id) {
  //     socket.emit('error', { message: 'Cannot accept your own challenge.' });
  //     if (ack) ack(false);
  //     return;
  //   }

  //   const balance = wallets[socket.id] || 0;
  //   if (balance < challenge.amount) {
  //     socket.emit('error', { message: 'Insufficient wallet balance.' });
  //     if (ack) ack(false);
  //     return;
  //   }

  //   challenges = challenges.filter((c) => c.id !== data.challengeId);

  //   const playerBName = data.name || `Player_${socket.id.substring(0, 4)}`;
  //   const matchId = `match-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  //   const match = {
  //     id: matchId,
  //     playerA: { id: challenge.createdBy, name: challenge.name },
  //     playerB: { id: socket.id, name: playerBName },
  //     amount: challenge.amount,
  //     generatedRoomCode: '',
  //     roomCodeProvider: null,
  //     playerResults: {},
  //   };

  //   matches.push(match);
  //   await saveData(MATCHES_FILE_PATH, matches);
  //   updateAllQueues();

  //   io.to(challenge.createdBy).emit('matchConfirmed', { roomId: match.id });
  //   io.to(socket.id).emit('matchConfirmed', { roomId: match.id });
  //   console.log(`[Server] Match created: ${match.id}`);
  //   if (ack) ack(true);
  // });
socket.on('challenge:accept', async (data, ack) => {
  const challenge = challenges.find((c) => c.id === data.challengeId);
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

  challenges = challenges.filter((c) => c.id !== data.challengeId);

  const playerBName = data.name || `Player_${socket.id.substring(0, 4)}`;
  const matchId = `match-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const match = {
    id: matchId,
    playerA: { id: challenge.createdBy, name: challenge.name },
    playerB: { id: socket.id, name: playerBName },
    amount: challenge.amount,
    generatedRoomCode: '',
    roomCodeProvider: null,
    playerResults: {},
  };

  matches.push(match);
  await saveData(MATCHES_FILE_PATH, matches);
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
    await saveData(MATCHES_FILE_PATH, matches);

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
    await saveData(MATCHES_FILE_PATH, matches);
    io.to(roomId).emit('gameResultUpdate', match.playerResults);
    console.log(`[Server] Game result submitted by ${socket.id} for room ${roomId}: ${result}`);
  });

  socket.on('disconnect', async () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);
    challenges = challenges.filter((c) => c.createdBy !== socket.id);
    matches = matches.filter((m) => m.playerA.id !== socket.id && m.playerB.id !== socket.id);
    await saveData(MATCHES_FILE_PATH, matches);
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