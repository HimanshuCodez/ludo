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
import { toast } from 'react-toastify'; // Import toast

const WinApprove = () => {
  const [pendingMatches, setPendingMatches] = useState([]);
  const [adminUid, setAdminUid] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setAdminUid(user.uid);
      else setAdminUid(null);
    });
    return () => unsub();
  }, []);

    useEffect(() => {
    const fetchPendingMatches = async () => {
      try {
        const q = query(
          collection(db, 'matches'), // Query 'matches' collection
          where('status', '==', 'pending_approval') // Look for matches pending approval
        );
        const querySnapshot = await getDocs(q);
        const matchesData = await Promise.all(
          querySnapshot.docs.map(async (d) => {
            const match = { id: d.id, ...d.data() };
            
            // Fetch data for winning player (if stored in match)
            const winningPlayerUid = match.winningPlayerUid;
            let winningPlayerData = null;
            if (winningPlayerUid) {
              const userDoc = await getDoc(doc(db, 'users', winningPlayerUid));
              if (userDoc.exists()) {
                winningPlayerData = userDoc.data();
              }
            }

            // Fetch data for other players in the match (if needed for display)
            // Assuming match document has playerA and playerB UIDs.
            let playerAData = null;
            if (match.playerA?.uid) { // Assuming playerA has a uid field
                const userDoc = await getDoc(doc(db, 'users', match.playerA.uid));
                if (userDoc.exists()) {
                    playerAData = userDoc.data();
                }
            }
            let playerBData = null;
            if (match.playerB?.uid) { // Assuming playerB has a uid field
                const userDoc = await getDoc(doc(db, 'users', match.playerB.uid));
                if (userDoc.exists()) {
                    playerBData = userDoc.data();
                }
            }

            return { ...match, winningPlayerData, playerAData, playerBData };
          })
        );

        setPendingMatches(matchesData);
        if (matchesData.length === 0) {
          toast.info('No matches are currently pending approval.');
        }
      } catch (err) {
        console.error(err);
        toast.error('Error fetching pending matches.');
      }
    };

    fetchPendingMatches();
  }, []);

  const handleApproval = async (match, winningPlayerUid, status) => { // winningPlayerUid is now just the UID
    if (!adminUid) {
      toast.error('Admin not authenticated.');
      return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        const matchRef = doc(db, 'matches', match.id);
        const winnerRef = doc(db, 'users', winningPlayerUid); // Use winningPlayerUid directly

        const winnerDoc = await transaction.get(winnerRef);
        if (!winnerDoc.exists()) {
          throw new Error('Winning user not found.');
        }

        if (status === 'Approved') {
          const prizeMoney = match.amount * 1.9;
          const newBalance = (winnerDoc.data().winningChips || 0) + prizeMoney;
          transaction.update(winnerRef, { winningChips: newBalance });
        }

        transaction.update(matchRef, {
          status: status, // 'Approved' or 'Rejected'
          winReviewedBy: adminUid,
          winReviewedAt: new Date().toISOString(),
        });
      });

      toast.success(`Match ${match.id} has been ${status}.`);
      setPendingMatches(pendingMatches.filter((m) => m.id !== match.id));
    } catch (err) {
      console.error(err);
      toast.error(`Failed to update match status: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-start justify-center">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Win Approval</h2>

        <div className="space-y-4">
          {pendingMatches.map((match) => (
            <div key={match.id} className="bg-gray-100 p-4 rounded-lg shadow">
              <p><strong>Match ID:</strong> {match.id}</p>
              <p><strong>Amount:</strong> ₹{match.amount}</p>
              {/* Display player names using playerAData and playerBData */}
              <p><strong>Players:</strong> {match.playerAData?.name || 'N/A'} vs {match.playerBData?.name || 'N/A'}</p>

              {/* Display winning player's claim and proof */}
              {match.winningPlayerData && (
                <div className="mt-2 border-t pt-2">
                  <p><strong>Winner Claim:</strong> {match.winningPlayerData.name} (claimed win)</p>
                  {match.winningPlayerProofUrl ? (
                    <p>
                      <strong>Proof:</strong> <a href={match.winningPlayerProofUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500">View Screenshot</a>
                    </p>
                  ) : (
                    <p><strong>Proof:</strong> No proof uploaded.</p>
                  )}
                  <div className="flex space-x-4 mt-2">
                    <button
                      onClick={() => handleApproval(match, match.winningPlayerUid, 'Approved')}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleApproval(match, match.winningPlayerUid, 'Rejected')}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WinApprove;

