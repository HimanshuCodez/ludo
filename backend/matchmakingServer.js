const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

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
    }
});

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Ludo Challenge Pool Server is Running!');
});

let challenges = [];
let matches = [];

const MATCHES_FILE_PATH = path.join(__dirname, 'matches.json');

if (!fs.existsSync(MATCHES_FILE_PATH)) {
    fs.writeFileSync(MATCHES_FILE_PATH, JSON.stringify([]));
}

function saveMatchesToFile() {
    fs.writeFileSync(MATCHES_FILE_PATH, JSON.stringify(matches, null, 2));
}

function loadMatchesFromFile() {
    try {
        const data = fs.readFileSync(MATCHES_FILE_PATH, 'utf8');
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

    socket.on('challenge:accept', (data, ack) => {
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

        const match = {
            id: "match-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
            playerA: { id: challenge.createdBy, name: challenge.name },
            playerB: { id: socket.id, name: playerBName },
            amount: challenge.amount,
            generatedRoomCode: "",
            roomCodeProvider: null,
            playerResults: {},
        };

        matches.push(match);
        saveMatchesToFile();
        updateAllQueues();

        io.to(challenge.createdBy).emit('matchFound', { roomId: match.id });
        io.to(socket.id).emit('matchFound', { roomId: match.id });
        console.log(`[Server] Match created: ${match.id} between ${match.playerA.name} and ${match.playerB.name} for ₹${match.amount}`);

        if (ack) ack(true);
    });

    socket.on('joinRoom', ({ roomId, userName }) => {
        const match = matches.find(m => m.id === roomId);
        if (!match) {
            console.log(`[❌ Server] Room NOT FOUND for ID: ${roomId}`);
            socket.emit('roomNotFound', { message: 'Room not found.' });
            return;
        }

        console.log(`[Server] ${userName} (socket: ${socket.id}) joined room: ${roomId}`);
        socket.join(roomId);

        const socketsInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
        console.log(`[Server] Sockets in room ${roomId}:`, socketsInRoom);

        const roomData = {
            players: [match.playerA, match.playerB],
            generatedRoomCode: match.generatedRoomCode,
            roomCodeProvider: match.roomCodeProvider,
        };

        io.to(roomId).emit('roomStateUpdate', roomData);
        if (match.generatedRoomCode) {
            socket.emit('userProvidedRoomCode', match.generatedRoomCode);
            console.log(`[Server] Sent existing room code ${match.generatedRoomCode} to ${userName} in room ${roomId}`);
        }
    });

    socket.on('userProvidedRoomCode', ({ roomId, code }) => {
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

        const socketsInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
        console.log(`[Server] Sockets in room ${roomId} before emitting code ${code}:`, socketsInRoom);

        if (socketsInRoom.length < 2 && retryCount[roomId] < 3) {
            console.log(`[Server] Only ${socketsInRoom.length} socket(s) in room ${roomId}. Retrying...`);
            retryCount[roomId] = (retryCount[roomId] || 0) + 1;
            setTimeout(() => {
                socket.emit('userProvidedRoomCode', { roomId, code });
            }, 1000 * retryCount[roomId]);
            return;
        }

        match.generatedRoomCode = code;
        match.roomCodeProvider = socket.id;
        saveMatchesToFile();

        io.to(roomId).emit('userProvidedRoomCode', code);
        io.to(roomId).emit('roomStateUpdate', {
            players: [match.playerA, match.playerB],
            generatedRoomCode: code,
            roomCodeProvider: socket.id,
        });
        console.log(`[Server] Room code ${code} provided by socket ${socket.id} for room ${roomId}`);
    });

    socket.on('submitGameResult', ({ roomId, result }) => {
        const match = matches.find(m => m.id === roomId);
        if (!match) {
            socket.emit('error', { message: 'Room not found.' });
            return;
        }

        match.playerResults[socket.id] = result;
        saveMatchesToFile();
        io.to(roomId).emit('gameResultUpdate', match.playerResults);
        console.log(`[Server] Game result submitted by ${socket.id} for room ${roomId}: ${result}`);
    });

    socket.on('disconnect', () => {
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
        saveMatchesToFile();
        updateAllQueues();
    });
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

const retryCount = {};

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log("🚀 Server running on port", PORT);
});