import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase'; // Adjust path

const KycAdmin = () => {
  const [kycRequests, setKycRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'kyc_requests'), (snapshot) => {
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setKycRequests(requests);
    }, (err) => {
      console.error('[KycAdmin] Snapshot Error:', err);
      setError('Failed to fetch KYC requests.');
    });
    return () => unsubscribe();
  }, []);

  const handleApprove = async (id, aadhaarUrl) => {
    try {
      const requestRef = doc(db, 'kyc_requests', id);
      await updateDoc(requestRef, { status: 'approved', reviewedAt: serverTimestamp() });
      setKycRequests(prev =>
        prev.map(req => (req.id === id ? { ...req, status: 'approved' } : req))
      );
    } catch (err) {
      console.error('[KycAdmin] Approve Error:', err);
      setError('Failed to approve request.');
    }
  };

  const handleReject = async (id) => {
    try {
      const requestRef = doc(db, 'kyc_requests', id);
      await updateDoc(requestRef, { status: 'rejected', reviewedAt: serverTimestamp() });
      setKycRequests(prev =>
        prev.map(req => (req.id === id ? { ...req, status: 'rejected' } : req))
      );
    } catch (err) {
      console.error('[KycAdmin] Reject Error:', err);
      setError('Failed to reject request.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center p-4">
      <div className="bg-white shadow-lg rounded-xl p-8 max-w-2xl w-full">
        <h1 className="text-2xl font-bold text-center mb-6 text-indigo-700">KYC Requests</h1>

        {loading && <p className="text-center text-gray-600">Loading...</p>}
        {error && <p className="text-red-600 text-center mb-4">{error}</p>}

        {!loading && kycRequests.length === 0 && (
          <p className="text-center text-gray-600">No KYC requests found.</p>
        )}

        {!loading && kycRequests.length > 0 && (
          <div className="space-y-6">
            {kycRequests.map(request => (
              <div key={request.id} className="border border-gray-200 p-4 rounded-lg">
                <p><strong>UID:</strong> {request.uid}</p>
                <p><strong>Status:</strong> {request.status}</p>
                <p><strong>Submitted:</strong> {request.createdAt?.toDate().toLocaleString() || 'N/A'}</p>
                {request.reviewedAt && <p><strong>Reviewed:</strong> {request.reviewedAt.toDate().toLocaleString()}</p>}
                <img src={request.aadhaarUrl} alt="Aadhaar" className="w-full h-48 object-cover rounded-lg mt-2" />
                {request.status === 'pending' && (
                  <div className="mt-4 flex space-x-4">
                    <button
                      onClick={() => handleApprove(request.id, request.aadhaarUrl)}
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default KycAdmin;