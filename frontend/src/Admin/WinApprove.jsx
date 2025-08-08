import React, { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  runTransaction,
  getDoc,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const WinApprove = () => {
  const [pendingMatches, setPendingMatches] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [adminUid, setAdminUid] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setAdminUid(user.uid);
      else setAdminUid(null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const fetchPendingMatches = async () => {
      setError('');
      setStatusMessage('');
      try {
        const q = query(
          collection(db, 'users'),
          where('lastGameProofUrl', '==', 'pending')
        );
        const querySnapshot = await getDocs(q);
        const matchesWithUserData = await Promise.all(
          querySnapshot.docs.map(async (d) => {
            const match = { id: d.id, ...d.data() };
            const playerUids = Object.keys(match.playerResults);
            const playersData = {};
            for (const uid of playerUids) {
              const userDoc = await getDoc(doc(db, 'users', uid));
              if (userDoc.exists()) {
                playersData[uid] = userDoc.data();
              }
            }
            return { ...match, playersData };
          })
        );

        setPendingMatches(matchesWithUserData);
        if (matchesWithUserData.length === 0) {
          setError('No matches are currently pending approval.');
        }
      } catch (err) {
        console.error(err);
        setError('Error fetching pending matches.');
      }
    };

    fetchPendingMatches();
  }, []);

  const handleApproval = async (match, winningPlayer, status) => {
    if (!adminUid) {
      setError('Admin not authenticated.');
      return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        const matchRef = doc(db, 'matches', match.id);
        const winnerRef = doc(db, 'users', winningPlayer.uid);

        const winnerDoc = await transaction.get(winnerRef);
        if (!winnerDoc.exists()) {
          throw new Error('Winning user not found.');
        }

        if (status === 'Approved') {
          const prizeMoney = match.amount * 1.9;
          const newBalance = (winnerDoc.data().depositChips || 0) + prizeMoney;
          transaction.update(winnerRef, { depositChips: newBalance });
        }

        transaction.update(matchRef, {
          status: status,
          winReviewedBy: adminUid,
          winReviewedAt: new Date().toISOString(),
        });
      });

      setStatusMessage(`Match ${match.id} has been ${status}.`);
      setPendingMatches(pendingMatches.filter((m) => m.id !== match.id));
    } catch (err) {
      console.error(err);
      setError(`Failed to update match status: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-start justify-center">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Win Approval</h2>

        {error && (
          <div className="bg-red-100 text-red-700 px-3 py-2 rounded mb-4 text-sm">{error}</div>
        )}
        {statusMessage && (
          <div className="bg-green-100 text-green-700 px-3 py-2 rounded mb-4 text-sm">{statusMessage}</div>
        )}

        <div className="space-y-4">
          {pendingMatches.map((match) => (
            <div key={match.id} className="bg-gray-100 p-4 rounded-lg shadow">
              <p><strong>Match ID:</strong> {match.id}</p>
              <p><strong>Amount:</strong> ₹{match.amount}</p>
              <p><strong>Players:</strong> {match.playerA.name} vs {match.playerB.name}</p>

              {Object.entries(match.playerResults).map(([uid, result]) => {
                const playerData = match.playersData?.[uid];
                if (!playerData) return null; // Don't render if player data hasn't loaded

                return (
                  <div key={uid} className="mt-2 border-t pt-2">
                    <p><strong>Winner Claim:</strong> {playerData.name} ({result.result})</p>
                    {playerData.lastGameProofUrl ? (
                      <p>
                        <strong>Proof:</strong> <a href={playerData.lastGameProofUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500">View Screenshot</a>
                      </p>
                    ) : (
                      <p><strong>Proof:</strong> No proof uploaded.</p>
                    )}
                    <div className="flex space-x-4 mt-2">
                      <button
                        onClick={() => handleApproval(match, match.playerA.id === uid ? match.playerA : match.playerB, 'Approved')}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleApproval(match, match.playerA.id === uid ? match.playerA : match.playerB, 'Rejected')}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WinApprove;

