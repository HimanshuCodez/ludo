import express from "express";
import mongoose from "mongoose";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

import path from "path";
import fs from 'fs/promises';

import { fileURLToPath } from 'url';
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



// Routes



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

loadMatchesFromFile();

io.on('connection', (socket) => {
  console.log('✅ Socket connected:', socket.id);

  socket.emit('updateChallenges', getClientChallenges(socket.id));
  socket.emit('updateMatches', getClientMatches());

  socket.on('challenge:create', (data, ack) => {
    if (challenges.find(c => c.createdBy === socket.id)) {
      socket.emit('error', { message: 'You already have an active challenge.' });
      if (ack) ack(false);
      return;
    }

    const name = data.name || `Player_${socket.id.substring(0, 4)}`;
    const amount = parseInt(data.amount);

    if (isNaN(amount) || amount <= 0) {
      socket.emit('error', { message: 'Invalid challenge amount.' });
      if (ack) ack(false);
      return;
    }

    const challenge = {
      id: "challenge-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
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

    challenges = challenges.filter(c => c.id !== data.challengeId);

    const playerBName = data.name || `Player_${socket.id.substring(0, 4)}`;
    const matchId = "match-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);

    const match = {
      id: matchId,
      playerA: { id: challenge.createdBy, name: challenge.name },
      playerB: { id: socket.id, name: playerBName },
      amount: challenge.amount,
      generatedRoomCode: "",
      roomCodeProvider: null,
      playerResults: {},
    };

    matches.push(match);
    console.log(`[Server] Match created: ${match.id} between ${match.playerA.name} and ${match.playerB.name} for ₹${match.amount}`);
    console.log(`[Server] Matches array:`, matches.map(m => m.id));

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
      console.log(`[Server] Current matches:`, matches.map(m => m.id));
      socket.emit('roomNotFound', { message: 'Room not found.' });
      return;
    }

    console.log(`[Server] ${userName} (socket: ${socket.id}) joined room: ${roomId}`);
    socket.join(roomId);

    const socketsInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
    console.log(`[Server] Sockets in room ${roomId}:`, socketsInRoom);

    const roomData = {
      players: [match.playerA, match.playerB].filter(p => p && p.id),
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
      console.log(`[❌ Server] Room not found for userProvidedRoomCode: ${roomId}`);
      return;
    }

    if (!/^\d{8}$/.test(code)) {
      socket.emit('error', { message: 'Invalid room code. Must be an 8-digit number.' });
      console.log(`[❌ Server] Invalid room code ${code} for room ${roomId}`);
      return;
    }

    if (match.generatedRoomCode && match.roomCodeProvider !== socket.id) {
      socket.emit('error', { message: 'Room code already provided by another player.' });
      console.log(`[❌ Server] Room code already provided for room ${roomId}`);
      return;
    }

    const socketsInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
    console.log(`[Server] Sockets in room ${roomId} before emitting code ${code}:`, socketsInRoom);

    match.generatedRoomCode = code;
    match.roomCodeProvider = socket.id;
    await saveMatchesToFile();

    io.to(roomId).emit('userProvidedRoomCode', code);
    io.to(roomId).emit('roomStateUpdate', {
      players: [match.playerA, match.playerB].filter(p => p && p.id),
      generatedRoomCode: code,
      roomCodeProvider: socket.id,
    });
    console.log(`[Server] Room code ${code} provided by socket ${socket.id} for room ${roomId}`);
  });

  socket.on('submitGameResult', async ({ roomId, result }) => {
    const match = matches.find(m => m.id === roomId);
    if (!match) {
      socket.emit('error', { message: 'Room not found.' });
      console.log(`[❌ Server] Room not found for submitGameResult: ${roomId}`);
      return;
    }

    match.playerResults[socket.id] = result;
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