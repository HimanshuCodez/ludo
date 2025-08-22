import { useEffect, useState } from 'react';
import { db } from '../firebase';
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  increment,
} from 'firebase/firestore';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify'; // Import toast

const WithdrawAdmin = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
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
    const request = requests.find(r => r.id === id);
    if (!request) return;

    const updateData = {
        withdrawalStatus: action === 'approve' ? 'Approved' : 'Rejected',
        withdrawalAmount: 0,
        withdrawalMethod: '',
        upiId: '',
        accountNumber: '',
        ifscCode: '',
        bankName: '',
    };

    if (action === 'approve') {
      // On approval, deduct the full requested amount from the user's balance.
      updateData.depositChips = increment(-request.withdrawalAmount);
    } 
    // For rejection, we don't touch the balance, just reset the withdrawal fields.

    try {
      await updateDoc(userRef, updateData);
      toast.success(`Withdrawal request ${action === 'approve' ? 'approved' : 'rejected'}.`);
      setRequests(prev => prev.filter(user => user.id !== id));
    } catch (error) {
      console.error("Error updating withdrawal status: ", error);
      toast.error("Failed to update withdrawal status.");
    }
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
                {user.withdrawalMethod === 'upi' && (
                    <p className="text-sm text-gray-500">UPI ID: <span className="text-black font-medium">{user.upiId}</span></p>
                )}
              </div>

              {user.withdrawalMethod === 'bank' && (
                <div className="mb-2">
                    <h3 className="text-lg font-semibold text-gray-700">Bank Details</h3>
                    <p className="text-sm text-gray-500">Account Number: <span className="text-black font-medium">{user.accountNumber}</span></p>
                    <p className="text-sm text-gray-500">IFSC Code: <span className="text-black font-medium">{user.ifscCode}</span></p>
                    <p className="text-sm text-gray-500">Bank Name: <span className="text-black font-medium">{user.bankName}</span></p>
                </div>
              )}

              <div className="mt-4 bg-gray-50 p-4 rounded-md border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-2">Withdrawal Details</h3>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Request Amount:</span>
                    <span className="font-bold">₹{user.withdrawalAmount?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>5% Commission:</span>
                    <span className="font-bold text-red-600">- ₹{(user.withdrawalAmount * 0.05).toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="border-t my-2"></div>
                  <div className="flex justify-between text-base">
                    <span className="font-semibold">Final Payout Amount:</span>
                    <span className="font-bold text-green-600">₹{(user.withdrawalAmount * 0.95).toFixed(2) || '0.00'}</span>
                  </div>
                </div>
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