import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import admin from "./firebaseAdmin.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "https://ludo-zeta-self.vercel.app",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(cors());
app.use(express.json());

let challenges = [];
let matches = [];
const MATCHES_FILE_PATH = path.join(__dirname, 'matches.json');

async function saveMatchesToFile() {
  try {
    await fs.writeFile(MATCHES_FILE_PATH, JSON.stringify(matches, null, 2));
    console.log(`[Server] Matches saved to file: ${matches.length} matches`);
  } catch (err) {
    console.error(`[Server] Error saving matches: ${err.message}`);
  }
}

async function loadMatchesFromFile() {
  try {
    const data = await fs.readFile(MATCHES_FILE_PATH, 'utf8');
    matches = JSON.parse(data);
    console.log(`[Server] Loaded ${matches.length} matches from file.`);
  } catch (err) {
    console.log('[Server] Error loading matches file:', err.message);
    matches = [];
  }
}

async function saveMatchToFirestore(match) {
    try {
        const db = admin.firestore();
        await db.collection('matches').doc(match.id).set(match);
        console.log(`[Server] Match ${match.id} saved to Firestore.`);
    } catch (error) {
        console.error(`[Server] Error saving match to Firestore:`, error);
    }
}

async function deductFunds(uid1, uid2, amount) {
    if (!uid1 || !uid2) {
        console.error(`[Server] Error deducting funds: Invalid UID provided.`);
        return false;
    }
    const db = admin.firestore();
    const user1Ref = db.collection('users').doc(uid1);
    const user2Ref = db.collection('users').doc(uid2);
  
    try {
      await db.runTransaction(async (transaction) => {
        const user1Doc = await transaction.get(user1Ref);
        const user2Doc = await transaction.get(user2Ref);
  
        if (!user1Doc.exists || !user2Doc.exists) {
          throw new Error('One or both users not found');
        }
  
        const user1Data = user1Doc.data();
        const user2Data = user2Doc.data();
  
        const newBalance1 = (user1Data.depositChips || 0) - amount;
        const newBalance2 = (user2Data.depositChips || 0) - amount;
  
        if (newBalance1 < 0 || newBalance2 < 0) {
          throw new Error('Insufficient funds for one or both users.');
        }
  
        transaction.update(user1Ref, { depositChips: newBalance1 });
        transaction.update(user2Ref, { depositChips: newBalance2 });
      });
      console.log(`[Server] Successfully deducted ${amount} from users ${uid1} and ${uid2}`);
      return true;
    } catch (error) {
      console.error(`[Server] Error in Firestore transaction for users ${uid1}, ${uid2}:`, error);
      console.error(`[Server] Error deducting funds: ${error.message}`);
      return false;
    }
  }

loadMatchesFromFile();

io.on('connection', (socket) => {
  console.log('✅ Socket connected:', socket.id);

  socket.emit('updateChallenges', getClientChallenges(socket.id));
  socket.emit('updateMatches', getClientMatches());

  socket.on('challenge:create', async (data, ack) => {
    if (challenges.find(c => c.createdBy === socket.id)) {
      socket.emit('error', { message: 'You already have an active challenge.' });
      if (ack) ack(false);
      return;
    }

    const amount = parseInt(data.amount);
    const { uid, name } = data;

    if (isNaN(amount) || amount <= 0) {
      socket.emit('error', { message: 'Invalid challenge amount.' });
      if (ack) ack(false);
      return;
    }

    const challenge = {
      id: "challenge-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      amount,
      createdBy: socket.id,
      uid,
      name,
    };

    challenges.push(challenge);
    socket.emit('yourChallengeId', challenge.id);
    updateAllQueues();
    console.log(`[Server] Challenge created: ${challenge.id} by ${name} for ₹${amount}`);
    if (ack) ack(true);
  });

  socket.on('challenge:accept', async (data, ack) => {
    const challenge = challenges.find(c => c.id === data.challengeId);
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

    const fundsDeducted = await deductFunds(challenge.uid, data.uid, challenge.amount);
    if (!fundsDeducted) {
        socket.emit('error', { message: 'Failed to process transaction. Please check balances.' });
        if (ack) ack(false);
        return;
    }

    challenges = challenges.filter(c => c.id !== data.challengeId);

    const matchId = "match-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);

    const match = {
      id: matchId,
      playerA: { id: challenge.createdBy, name: challenge.name, uid: challenge.uid },
      playerB: { id: socket.id, name: data.name, uid: data.uid },
      amount: challenge.amount,
      generatedRoomCode: "",
      roomCodeProvider: null,
      playerResults: {},
      status: 'active',
    };

    matches.push(match);
    console.log(`[Server] Match created: ${match.id} between ${match.playerA.name} and ${match.playerB.name} for ₹${match.amount}`);
    
    await saveMatchToFirestore(match);
    await saveMatchesToFile();
    updateAllQueues();

    io.to(challenge.createdBy).emit('matchConfirmed', { roomId: match.id });
    io.to(socket.id).emit('matchConfirmed', { roomId: match.id });
    console.log(`[Server] Emitted matchConfirmed for room ${match.id}`);
    if (ack) ack(true);
  });

  socket.on('joinRoom', async ({ roomId, userName }) => {
    const match = matches.find(m => m.id === roomId);
    if (!match) {
      console.log(`[❌ Server] Room NOT FOUND for ID: ${roomId}`);
      socket.emit('roomNotFound', { message: 'Room not found.' });
      return;
    }

    console.log(`[Server] ${userName} (socket: ${socket.id}) joined room: ${roomId}`);
    socket.join(roomId);

    const roomData = {
      players: [match.playerA, match.playerB].filter(p => p && p.id),
      amount: match.amount,
      generatedRoomCode: match.generatedRoomCode,
      roomCodeProvider: match.roomCodeProvider,
    };

    io.to(roomId).emit('roomStateUpdate', roomData);
    if (match.generatedRoomCode) {
      socket.emit('userProvidedRoomCode', match.generatedRoomCode);
      console.log(`[Server] Sent existing room code ${match.generatedRoomCode} to ${userName} in room ${roomId}`);
    }
  });

  socket.on('userProvidedRoomCode', async ({ roomId, code }) => {
    const match = matches.find(m => m.id === roomId);
    if (!match) {
      socket.emit('error', { message: 'Room not found.' });
      return;
    }

    if (!/^\d{8}$/.test(code)) {
      socket.emit('error', { message: 'Invalid room code. Must be an 8-digit number.' });
      return;
    }

    if (match.generatedRoomCode && match.roomCodeProvider !== socket.id) {
      socket.emit('error', { message: 'Room code already provided by another player.' });
      return;
    }

    match.generatedRoomCode = code;
    match.roomCodeProvider = socket.id;
    await saveMatchToFirestore(match);
    await saveMatchesToFile();

    io.to(roomId).emit('userProvidedRoomCode', code);
    io.to(roomId).emit('roomStateUpdate', {
      players: [match.playerA, match.playerB].filter(p => p && p.id),
      amount: match.amount,
      generatedRoomCode: code,
      roomCodeProvider: socket.id,
    });
    console.log(`[Server] Room code ${code} provided by socket ${socket.id} for room ${roomId}`);
  });

  socket.on('submitGameResult', async ({ roomId, result, proofUrl }) => {
    const match = matches.find(m => m.id === roomId);
    if (!match) {
      socket.emit('error', { message: 'Room not found.' });
      return;
    }

    const player = match.playerA.id === socket.id ? match.playerA : match.playerB;
    if (player && player.uid) {
        try {
            const userRef = admin.firestore().collection('users').doc(player.uid);
            await userRef.update({
                lastGameProofUrl: proofUrl,
                lastGameResult: result,
                lastMatchId: roomId,
                lastMatchAmount: match.amount,
                winStatus: 'Pending',
            });
            console.log(`[Server] Updated game result proof for user ${player.uid}`);
        } catch (error) {
            console.error(`[Server] Error updating user doc with game proof:`, error);
            socket.emit('error', { message: 'Error submitting result. Please try again.' });
            return;
        }
    }

    match.playerResults[socket.id] = { result, proofUrl };
    await saveMatchToFirestore(match);
    await saveMatchesToFile();
    io.to(roomId).emit('gameResultUpdate', match.playerResults);
    console.log(`[Server] Game result submitted by ${socket.id} for room ${roomId}: ${result}`);
  });

  socket.on('disconnect', async () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);

    challenges = challenges.filter(c => c.createdBy !== socket.id);

    const leftMatches = matches.filter(m => m.playerA.id === socket.id || m.playerB.id === socket.id);
    if (leftMatches.length) {
      leftMatches.forEach(m => {
        const opponentId = m.playerA.id === socket.id ? m.playerB.id : m.playerA.id;
        io.to(opponentId).emit('gameEnd', { message: 'Opponent left the match.' });
        io.to(opponentId).emit('playerLeft', {
          socketId: socket.id,
          name: m.playerA.id === socket.id ? m.playerA.name : m.playerB.name,
        });
      });
    }

    matches = matches.filter(m => m.playerA.id !== socket.id && m.playerB.id !== socket.id);
    await saveMatchesToFile();
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
server.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
