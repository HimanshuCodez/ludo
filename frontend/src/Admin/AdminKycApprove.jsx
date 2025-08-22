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

import { onAuthStateChanged } from 'firebase/auth';
import { toast } from 'react-toastify'; // Import toast

const AdminKycApprove = () => {
  const [userDoc, setUserDoc] = useState(null);
  const [adminUid, setAdminUid] = useState(null);

  // Track current logged-in admin
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setAdminUid(user ? user.uid : null);
    });
    return () => unsub();
  }, []);

  // Fetch one user with Pending KYC
  useEffect(() => {
    const fetchPendingKyc = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          where('kycStatus', '==', 'Pending')
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          setUserDoc({ id: docSnap.id, ...docSnap.data() });
        } else {
          toast.info('No users found with pending KYC.');
        }
      } catch (err) {
        console.error(err);
        toast.error('Error fetching user.');
      }
    };

    fetchPendingKyc();
  }, []);

  const updateStatus = async (status) => {
    if (!userDoc) return;
    try {
      await updateDoc(doc(db, 'users', userDoc.id), {
        kycStatus: status,
        kycReviewedAt: new Date().toISOString(),
        kycReviewedBy: adminUid,
      });
      setUserDoc({ ...userDoc, kycStatus: status });
      toast.success(`KYC marked as "${status}"`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex items-start justify-center">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">KYC Review Panel</h2>

        {userDoc && (
          <div>
            <p className="text-sm text-gray-500 mb-2">
              <strong>User Name:</strong> {userDoc.name}
            </p>

            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-700 mb-2">Aadhaar Front:</h3>
              <img
                src={userDoc.aadhaarFrontUrl}
                alt="Aadhaar Front"
                className="w-full max-h-72 object-contain rounded border"
              />
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-700 mb-2">Aadhaar Back:</h3>
              <img
                src={userDoc.aadhaarBackUrl}
                alt="Aadhaar Back"
                className="w-full max-h-72 object-contain rounded border"
              />
            </div>

            <p className="text-sm text-gray-600 mb-2">
              <strong>KYC Status:</strong>{' '}
              <span
                className={`font-semibold ${
                  userDoc.kycStatus === 'Approved'
                    ? 'text-green-600'
                    : userDoc.kycStatus === 'Rejected'
                    ? 'text-red-600'
                    : 'text-yellow-600'
                }`}
              >
                {userDoc.kycStatus || 'Not Submitted'}
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

export default AdminKycApprove;
