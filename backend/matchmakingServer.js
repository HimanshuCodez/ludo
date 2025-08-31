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
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

let challenges = [];
let matches = [];
const MATCHES_FILE_PATH = path.join(__dirname, 'matches.json');

async function saveMatchesToFile() {
  try {
    await fs.writeFile(MATCHES_FILE_PATH, JSON.stringify(matches, null, 2));
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
    console.log('[Server] No existing matches file found. Starting fresh.');
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
        return { success: false, message: 'Invalid user identifier. A user may not be logged in.' };
    }
    const db = admin.firestore();
    const user1Ref = db.collection('users').doc(uid1);
    const user2Ref = db.collection('users').doc(uid2);

    try {
        await db.runTransaction(async (transaction) => {
            const user1Doc = await transaction.get(user1Ref);
            const user2Doc = await transaction.get(user2Ref);

            if (!user1Doc.exists || !user2Doc.exists) {
                throw new Error('One or both users not found in the database.');
            }

            const user1Data = user1Doc.data();
            const user2Data = user2Doc.data();

            // --- Process User 1 ---
            const totalBalance1 = (user1Data.depositChips || 0) + (user1Data.winningChips || 0);
            if (totalBalance1 < amount) {
                throw new Error(`Insufficient funds for ${user1Data.name}.`);
            }
            let remainingToDeduct1 = amount;
            let newWinningChips1 = user1Data.winningChips || 0;
            let newDepositChips1 = user1Data.depositChips || 0;

            // Prioritize deducting from deposit chips first
            const fromDeposit1 = Math.min(newDepositChips1, remainingToDeduct1);
            newDepositChips1 -= fromDeposit1;
            remainingToDeduct1 -= fromDeposit1;

            // Deduct the rest from winning chips if necessary
            if (remainingToDeduct1 > 0) {
                newWinningChips1 -= remainingToDeduct1;
            }

            // --- Process User 2 ---
            const totalBalance2 = (user2Data.depositChips || 0) + (user2Data.winningChips || 0);
            if (totalBalance2 < amount) {
                throw new Error(`Insufficient funds for ${user2Data.name}.`);
            }
            let remainingToDeduct2 = amount;
            let newWinningChips2 = user2Data.winningChips || 0;
            let newDepositChips2 = user2Data.depositChips || 0;

            // Prioritize deducting from deposit chips first
            const fromDeposit2 = Math.min(newDepositChips2, remainingToDeduct2);
            newDepositChips2 -= fromDeposit2;
            remainingToDeduct2 -= fromDeposit2;

            // Deduct the rest from winning chips if necessary
            if (remainingToDeduct2 > 0) {
                newWinningChips2 -= remainingToDeduct2;
            }

            transaction.update(user1Ref, { depositChips: newDepositChips1, winningChips: newWinningChips1 });
            transaction.update(user2Ref, { depositChips: newDepositChips2, winningChips: newWinningChips2 });
        });
        console.log(`[Server] Successfully deducted ${amount} from users ${uid1} and ${uid2}`);
        return { success: true };
    } catch (error) {
        console.error(`[Server] Error in Firestore transaction for users ${uid1}, ${uid2}:`, error);
        return { success: false, message: error.message || 'A database error occurred.' };
    }
}

async function refundFunds(uid1, uid2, amount) {
    if (!uid1 || !uid2) {
        console.error('[Server] Invalid user identifier for refund.');
        return { success: false, message: 'Invalid user identifier for refund.' };
    }
    const db = admin.firestore();
    const user1Ref = db.collection('users').doc(uid1);
    const user2Ref = db.collection('users').doc(uid2);

    try {
        await db.runTransaction(async (transaction) => {
            const user1Doc = await transaction.get(user1Ref);
            const user2Doc = await transaction.get(user2Ref);

            if (!user1Doc.exists || !user2Doc.exists) {
                throw new Error('One or both users not found for refund.');
            }

            const user1Data = user1Doc.data();
            const newDepositChips1 = (user1Data.depositChips || 0) + amount;

            const user2Data = user2Doc.data();
            const newDepositChips2 = (user2Data.depositChips || 0) + amount;

            transaction.update(user1Ref, { depositChips: newDepositChips1 });
            transaction.update(user2Ref, { depositChips: newDepositChips2 });
        });
        console.log(`[Server] Successfully refunded ${amount} to users ${uid1} and ${uid2}`);
        return { success: true };
    } catch (error) {
        console.error(`[Server] Error in Firestore transaction for refund to users ${uid1}, ${uid2}:`, error);
        return { success: false, message: error.message || 'A database error occurred during refund.' };
    }
}

async function awardWinnings(winnerUid, amount) {
    const db = admin.firestore();
    const winnerRef = db.collection('users').doc(winnerUid);

    const totalAmount = amount ;
    const commission = totalAmount * 0.05;
    const winnerPayout = totalAmount - commission;

    try {
        await db.runTransaction(async (transaction) => {
            const winnerDoc = await transaction.get(winnerRef);
            if (!winnerDoc.exists) {
                throw new Error(`Winner user ${winnerUid} not found.`);
            }
            const winnerData = winnerDoc.data();
            const newWinningChips = (winnerData.winningChips || 0) + winnerPayout;
            transaction.update(winnerRef, { winningChips: newWinningChips });
        });

        console.log(`[Server] Awarded ${winnerPayout} to winner ${winnerUid}.`);
        return { success: true, payout: winnerPayout };
    } catch (error) {
        console.error(`[Server] Error awarding winnings to ${winnerUid}:`, error);
        return { success: false, message: error.message };
    }
}

loadMatchesFromFile();

io.on('connection', (socket) => {
  console.log('✅ Socket connected:', socket.id);

  socket.emit('updateChallenges', getClientChallenges(socket.id));
  socket.emit('updateMatches', getClientMatches());

  socket.on('challenge:create', async (data, ack) => {
    if (!data.uid) {
        socket.emit('error', { message: 'You must be logged in to create a challenge.' });
        if (ack) ack(false);
        return;
    }
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

    if (amount % 50 !== 0) {
      socket.emit('error', { message: 'Bet amount must be in multiples of 50.' });
      if (ack) ack(false);
      return;
    }

    try {
        const userRef = admin.firestore().collection('users').doc(uid);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            throw new Error('User not found.');
        }
        const userData = userDoc.data();
        const totalBalance = (userData.depositChips || 0) + (userData.winningChips || 0);
        if (totalBalance < amount) {
            throw new Error('Insufficient balance to create this challenge.');
        }
    } catch (error) {
        socket.emit('error', { message: error.message || 'Failed to verify user balance.' });
        if (ack) ack(false);
        return;
    }

    const challenge = {
      id: `challenge-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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
      if (ack) ack(false); return;
    }
    if (challenge.createdBy === socket.id) {
      socket.emit('error', { message: 'Cannot accept your own challenge.' });
      if (ack) ack(false); return;
    }
    if (!data.uid) {
        socket.emit('error', { message: 'You must be logged in to accept a challenge.' });
        if (ack) ack(false); return;
    }

    const deductionResult = await deductFunds(challenge.uid, data.uid, challenge.amount);
    if (!deductionResult.success) {
        socket.emit('error', { message: `Transaction Failed: ${deductionResult.message}` });
        if (ack) ack(false); return;
    }

    challenges = challenges.filter(c => c.id !== data.challengeId);

    const matchId = `match-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
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
    if (ack) ack(true);
  });

  socket.on('joinRoom', async ({ roomId, userName, uid }) => {
    const match = matches.find(m => m.id === roomId);
    if (!match) {
      socket.emit('roomNotFound', { message: 'Room not found.' });
      return;
    }

    let idChanged = false;
    // Update socket.id on join/reconnect to handle reconnections
    if (match.playerA.uid === uid) {
        if (match.playerA.id !== socket.id) {
            console.log(`[Server] Player A (${match.playerA.name}) reconnected with new socket ID: ${socket.id}`);
            match.playerA.id = socket.id;
            idChanged = true;
        }
    } else if (match.playerB.uid === uid) {
        if (match.playerB.id !== socket.id) {
            console.log(`[Server] Player B (${match.playerB.name}) reconnected with new socket ID: ${socket.id}`);
            match.playerB.id = socket.id;
            idChanged = true;
        }
    }

    socket.join(roomId);
    const roomData = {
      players: [match.playerA, match.playerB].filter(p => p && p.id),
      amount: match.amount,
      generatedRoomCode: match.generatedRoomCode,
      roomCodeProvider: match.roomCodeProvider,
    };

    io.to(roomId).emit('roomStateUpdate', roomData);

    if (idChanged) {
      await saveMatchToFirestore(match);
      await saveMatchesToFile();
    }
  });

  socket.on('userProvidedRoomCode', async ({ roomId, code }) => {
    const match = matches.find(m => m.id === roomId);
    if (!match) return socket.emit('error', { message: 'Room not found.' });

    if (!/^\d{8}$/.test(code)) {
      return socket.emit('error', { message: 'Invalid room code. Must be an 8-digit number.' });
    }

    if (match.generatedRoomCode && match.roomCodeProvider !== socket.id) {
      return socket.emit('error', { message: 'Room code already provided by another player.' });
    }

    match.generatedRoomCode = code;
    match.roomCodeProvider = socket.id;
    await saveMatchToFirestore(match);
    await saveMatchesToFile();

    io.to(roomId).emit('userProvidedRoomCode', code);
    io.to(roomId).emit('roomStateUpdate', { ...match });
  });

  socket.on('submitGameResult', async ({ roomId, result, proofUrl }) => {
    const match = matches.find(m => m.id === roomId);
    if (!match) return socket.emit('error', { message: 'Room not found.' });

    const player = match.playerA.id === socket.id ? match.playerA : match.playerB;
    if (player && player.uid) {
        try {
            const userRef = admin.firestore().collection('users').doc(player.uid);
            await userRef.update({
                lastGameProofUrl: proofUrl,
                lastGameResult: result,
                lastMatchId: roomId,
                winStatus: 'Pending',
            });
            match.status = 'pending'; // Update match status
            console.log(`[Server] Updated game result proof for user ${player.uid}`);
        } catch (error) {
            console.error(`[Server] Error updating user doc with game proof:`, error);
            return socket.emit('error', { message: 'Error submitting result. Please try again.' });
        }
    }

    match.playerResults[socket.id] = { result, proofUrl };
    await saveMatchToFirestore(match);
    await saveMatchesToFile();
    io.to(roomId).emit('gameResultUpdate', match.playerResults);
  });

  socket.on('match:iLost', async ({ roomId }) => {
    const match = matches.find(m => m.id === roomId);
    if (!match) return socket.emit('error', { message: 'Match not found.' });

    // Prevent duplicate processing
    if (match.status !== 'active') {
        return console.log(`[Server] Match ${roomId} is not active, ignoring iLost event.`);
    }

    const loser = match.playerA.id === socket.id ? match.playerA : match.playerB;
    const winner = match.playerA.id === socket.id ? match.playerB : match.playerA;

    if (!loser || !winner) return socket.emit('error', { message: 'Could not identify players in the match.' });

    // Award winnings to the winner
    const awardResult = await awardWinnings(winner.uid, match.amount);

    if (awardResult.success) {
        match.status = 'completed';
        match.winner = winner.uid;
        match.loser = loser.uid;
        await saveMatchToFirestore(match);
        await saveMatchesToFile();

        // Notify both players
        io.to(loser.id).emit('matchResultConfirmed', { result: 'lost' });
        io.to(winner.id).emit('matchResultConfirmed', { result: 'won', payout: awardResult.payout });
        
        updateAllQueues();
        console.log(`[Server] Match ${roomId} completed. Winner: ${winner.name}, Loser: ${loser.name}`);
    } else {
        socket.emit('error', { message: `Failed to process match result: ${awardResult.message}` });
    }
  });

  socket.on('match:updateStatus', async ({ roomId, status }) => {
    const match = matches.find(m => m.id === roomId);
    if (match) {
      try {
        match.status = status; // Update in-memory state

        // Update Firestore document safely
        const db = admin.firestore();
        await db.collection('matches').doc(roomId).update({ status: status });
        
        await saveMatchesToFile(); // Persist in-memory state to JSON
        console.log(`[Server] Match ${roomId} status updated to ${status}`);
        updateAllQueues(); // Notify clients
      } catch (error) {
        console.error(`[Server] Error updating match status in Firestore:`, error);
        // Optional: notify the client that the update failed
        socket.emit('error', { message: 'Failed to update match status.' });
      }
    }
  });

  socket.on('match:cancel', async ({ roomId, reason }) => {
    console.log(`[Server] Received 'match:cancel' for room ${roomId} from ${socket.id}. Reason: ${reason}`);
    const match = matches.find(m => m.id === roomId);

    if (!match) {
      console.error(`[Server] 'match:cancel' failed: Match with ID ${roomId} not found.`);
      return socket.emit('error', { message: 'Match not found.' });
    }
    
    console.log(`[Server] Match found:`, JSON.stringify(match, null, 2));
    console.log(`[Server] Checking conditions: match.status is '${match.status}', match.generatedRoomCode is '${match.generatedRoomCode}'`);

    if (match.status !== 'active') {
        console.log(`[Server] 'match:cancel' rejected. Match status is not 'active'. Status: ${match.status}`);
        return socket.emit('error', { message: `Cannot cancel. Match status is not active (${match.status}).` });
    }

    // Determine if the canceling player is playerA or playerB
    const cancelingPlayer = match.playerA.id === socket.id ? match.playerA : match.playerB;
    if (!cancelingPlayer) {
        console.error(`[Server] 'match:cancel' failed: Canceling player not found in match.`);
        return socket.emit('error', { message: 'Canceling player not found.' });
    }

    if (!match.generatedRoomCode) {
        // Case 1: No room code shared - immediate refund
        console.log(`[Server] No room code shared. Proceeding with immediate refund for match ${roomId}.`);
        match.status = 'canceled';
        match.cancelReason = reason;
        match.cancelingPlayerUid = cancelingPlayer.uid; // Store who initiated the cancel

        console.log(`[Server] Attempting to refund funds for match ${roomId}.`);
        const refundResult = await refundFunds(match.playerA.uid, match.playerB.uid, match.amount);
        console.log(`[Server] Refund result for match ${roomId}:`, refundResult);

        if (refundResult.success) {
            console.log(`[Server] Refund successful. Saving match ${roomId} and notifying clients.`);
            await saveMatchToFirestore(match);
            await saveMatchesToFile();
            io.to(roomId).emit('matchCanceled', { message: 'Match canceled. Your bet has been refunded.' });
            updateAllQueues();
            console.log(`[Server] 'matchCanceled' event emitted for room ${roomId}.`);
        } else {
            console.error(`[Server] CRITICAL: Refund failed for canceled match ${roomId}.`);
            match.status = 'active'; // Revert status
            io.to(roomId).emit('error', { message: `Critical error during refund. Please contact support.` });
            console.log(`[Server] 'error' event emitted for room ${roomId} due to refund failure.`);
        }
    } else {
        // Case 2: Room code shared - pending admin approval
        console.log(`[Server] Room code shared. Setting match ${roomId} to pending_cancellation_approval.`);
        match.status = 'pending_cancellation_approval';
        match.cancelReason = reason;
        match.cancelingPlayerUid = cancelingPlayer.uid; // Store who initiated the cancel

        await saveMatchToFirestore(match);
        await saveMatchesToFile();
        io.to(roomId).emit('matchCancellationPending', { message: 'Your cancellation request is pending admin review.' });
        updateAllQueues();
        console.log(`[Server] 'matchCancellationPending' event emitted for room ${roomId}.`);
    }
  });

  socket.on('disconnect', async () => {
    console.log(`[Server] ❌ Socket disconnected: ${socket.id}`);

    // Find if the disconnected socket was associated with an open challenge
    const challengeIndex = challenges.findIndex(c => c.createdBy === socket.id);

    // If a challenge was found, remove it and notify clients
    if (challengeIndex !== -1) {
      const challengeId = challenges[challengeIndex].id;
      console.log(`[Server] Disconnected user was creator of challenge ${challengeId}. Removing it.`);
      
      // Remove the challenge from the array
      challenges.splice(challengeIndex, 1);
      
      // Broadcast the updated list of challenges to all clients
      updateAllQueues();
    }

    const match = matches.find(m => (m.playerA.id === socket.id || m.playerB.id === socket.id));
    if (!match) return;

    // If match is in a final state, do nothing
    if (match.status === 'pending_approval' || match.status === 'completed' || match.status === 'canceled' || match.status === 'pending_cancellation_approval' || match.status === 'cancellation_rejected') {
        console.log(`[Server] Player disconnected from match ${match.id}. Status is ${match.status}. No action taken.`);
        return;
    }

    // If match is active and not in a final state, just notify the other player of disconnect.
    // Do NOT change match status to 'canceled' automatically.
    // Do NOT refund automatically.
    console.log(`[Server] Player disconnected from match ${match.id}. Match status remains ${match.status}.`);
    const otherPlayer = match.playerA.id === socket.id ? match.playerB : match.playerA;
    if (otherPlayer && otherPlayer.id) {
        io.to(otherPlayer.id).emit('opponentDisconnected', { message: 'Your opponent has disconnected.' });
    }
  });

  socket.on('admin:fetchCancellationRequests', async () => {
    console.log(`[Server] Admin ${socket.id} requested pending cancellation requests.`);
    const pendingCancellations = matches.filter(m => m.status === 'pending_cancellation_approval');
    socket.emit('admin:cancellationRequests', pendingCancellations);
  });

  socket.on('admin:approveCancellation', async ({ matchId }) => {
    console.log(`[Server] Admin ${socket.id} approving cancellation for match ${matchId}.`);
    const match = matches.find(m => m.id === matchId && m.status === 'pending_cancellation_approval');

    if (!match) {
      console.error(`[Server] Approval failed: Match ${matchId} not found or not pending cancellation approval.`);
      return socket.emit('admin:cancellationApprovalResult', { success: false, message: 'Match not found or not pending approval.' });
    }

    const refundResult = await refundFunds(match.playerA.uid, match.playerB.uid, match.amount);

    if (refundResult.success) {
      match.status = 'canceled'; // Or 'refunded'
      await saveMatchToFirestore(match);
      await saveMatchesToFile();
      io.to(match.id).emit('matchCanceled', { message: 'Your cancellation request has been approved and your bet refunded.' });
      socket.emit('admin:cancellationApprovalResult', { success: true, message: 'Cancellation approved and refunded.' });
      updateAllQueues();
    } else {
      console.error(`[Server] CRITICAL: Refund failed during admin approval for match ${matchId}.`);
      socket.emit('admin:cancellationApprovalResult', { success: false, message: `Refund failed: ${refundResult.message}` });
    }
  });

  socket.on('admin:rejectCancellation', async ({ matchId }) => {
    console.log(`[Server] Admin ${socket.id} rejecting cancellation for match ${matchId}.`);
    const match = matches.find(m => m.id === matchId && m.status === 'pending_cancellation_approval');

    if (!match) {
      console.error(`[Server] Rejection failed: Match ${matchId} not found or not pending cancellation approval.`);
      return socket.emit('admin:cancellationApprovalResult', { success: false, message: 'Match not found or not pending approval.' });
    }

    match.status = 'cancellation_rejected';
    await saveMatchToFirestore(match);
    await saveMatchesToFile();
    io.to(match.id).emit('matchCancellationRejected', { message: 'Your cancellation request has been rejected.' });
    socket.emit('admin:cancellationApprovalResult', { success: true, message: 'Cancellation rejected.' });
    updateAllQueues();
  });

  function updateAllQueues() {
    io.emit('updateChallenges', getClientChallenges());
    io.emit('updateMatches', getClientMatches());
  }

  function getClientChallenges(requestorId = null) {
    return challenges.map(ch => ({ ...ch, own: requestorId ? ch.createdBy === requestorId : undefined }));
  }

  function getClientMatches() {
    return matches.map(m => ({ id: m.id, playerA: m.playerA, playerB: m.playerB, amount: m.amount, status: m.status }));
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});