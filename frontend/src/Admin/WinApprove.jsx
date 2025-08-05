import React, { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const WinApprove = () => {
  const [userDoc, setUserDoc] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [adminUid, setAdminUid] = useState(null);
  const [error, setError] = useState('');

  // Watch for logged-in admin
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setAdminUid(user.uid);
      else setAdminUid(null);
    });
    return () => unsub();
  }, []);

  // Fetch user with a win proof (screenshot)
  useEffect(() => {
    const fetchWinProof = async () => {
      setError('');
      setStatusMessage('');
      try {
        const q = query(
          collection(db, 'users'),
          where('lastGameProofUrl', '!=', '') // fetch users who submitted proof
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const userSnap = querySnapshot.docs[0];
          setUserDoc({ id: userSnap.id, ...userSnap.data() });
        } else {
          setError('No users found with win proof screenshot.');
        }
      } catch (err) {
        console.error(err);
        setError('Error fetching user.');
      }
    };

    fetchWinProof();
  }, []);

  const updateStatus = async (status) => {
    if (!userDoc) return;
    try {
      await updateDoc(doc(db, 'users', userDoc.id), {
        winStatus: status,
        winReviewedAt: new Date().toISOString(),
        winReviewedBy: adminUid,
      });
      setUserDoc({ ...userDoc, winStatus: status });
      setStatusMessage(`Win marked as "${status}"`);
    } catch (err) {
      console.error(err);
      setError('Failed to update win status.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-start justify-center">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Win Approval</h2>

        {error && (
          <div className="bg-red-100 text-red-700 px-3 py-2 rounded mb-4 text-sm">{error}</div>
        )}

        {userDoc && (
          <div>
            <p className="text-sm text-gray-500 mb-2">
              <strong>User ID:</strong> {userDoc.id}
            </p>
            <p className="text-sm text-gray-500 mb-2">
              <strong>Name:</strong> {userDoc.name}
            </p>

            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-700 mb-2">Win Screenshot:</h3>
              <img
                src={userDoc.lastGameProofUrl}
                alt="Win Screenshot"
                className="w-full max-h-96 object-contain rounded border"
              />
            </div>

            <p className="text-sm text-gray-600 mb-2">
              <strong>Win Status:</strong>{' '}
              <span
                className={`font-semibold ${
                  userDoc.winStatus === 'Approved'
                    ? 'text-green-600'
                    : userDoc.winStatus === 'Rejected'
                    ? 'text-red-600'
                    : 'text-yellow-600'
                }`}
              >
                {userDoc.winStatus || 'Not Reviewed'}
              </span>
            </p>

            <div className="flex space-x-4 mt-4 justify-end">
              <button
                onClick={() => updateStatus('Approved')}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                Approve
              </button>
              <button
                onClick={() => updateStatus('Rejected')}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
              >
                Reject
              </button>
            </div>

            {statusMessage && (
              <div className="mt-4 text-green-700 bg-green-100 px-3 py-2 rounded text-sm">
                {statusMessage}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WinApprove;
