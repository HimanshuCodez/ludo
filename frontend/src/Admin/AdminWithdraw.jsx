// src/components/WithdrawAdmin.jsx

import { useEffect, useState } from 'react';
import { db } from '../firebase';
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const WithdrawAdmin = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    const q = query(collection(db, 'users'), where('withdrawalStatus', '==', 'Pending'));
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setRequests(results);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (id, action) => {
    const userRef = doc(db, 'users', id);
    await updateDoc(userRef, {
      withdrawalStatus: action === 'approve' ? 'Approved' : 'Rejected',
      ...(action === 'approve' && { depositChips: 200 }) // update chips
    });

    setRequests(prev => prev.filter(user => user.id !== id));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-primary mb-6 text-center">
        💸 Withdrawal Requests
      </h1>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center text-gray-600 mt-10 text-lg">✅ No pending withdrawal requests.</div>
      ) : (
        <div className="grid gap-5">
          {requests.map(user => (
            <div
              key={user.id}
              className="bg-white border-l-4 border-yellow-500 shadow-md rounded-lg p-5 transition-all hover:shadow-lg"
            >
              <div className="mb-2">
                <h2 className="text-xl font-semibold text-gray-800"> Name : {user.name}</h2>
                <p className="text-sm text-gray-500">UPI ID: <span className="text-black font-medium">{user.upiId}</span></p>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => handleAction(user.id, 'approve')}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-md transition-all"
                >
                  <CheckCircle size={18} /> Approve
                </button>
                <button
                  onClick={() => handleAction(user.id, 'reject')}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-md transition-all"
                >
                  <XCircle size={18} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WithdrawAdmin;
