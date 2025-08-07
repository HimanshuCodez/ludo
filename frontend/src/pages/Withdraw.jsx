// src/components/Withdraw.jsx

import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

const Withdraw = () => {
  const [amount, setAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [method, setMethod] = useState('upi'); // 'upi' or 'bank'

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [userBalance, setUserBalance] = useState(0);

  useEffect(() => {
    const fetchUserBalance = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          setUserBalance(docSnap.data().depositChips || 0);
        }
      }
    };
    fetchUserBalance();
  }, []);


  const validateUPI = (upi) => {
    const upiRegex = /^[\w.-]+@[\w.-]+$/;
    return upiRegex.test(upi);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    const withdrawalAmount = parseFloat(amount);
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    if (withdrawalAmount > userBalance) {
        setError('Insufficient balance.');
        return;
    }
    if (withdrawalAmount < 200) {
        setError('Balance must be above 200rs.');
        return;
    }

    if (method === 'upi' && !validateUPI(upiId)) {
      setError('Please enter a valid UPI ID (e.g., user@bank).');
      return;
    }

    if (method === 'bank' && (!accountNumber || !ifscCode || !bankName)) {
      setError('Please fill in all bank details.');
      return;
    }

    setLoading(true);

    const user = auth.currentUser;
    if (!user) {
      setError('User not logged in.');
      setLoading(false);
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      
      const withdrawalData = {
        withdrawalAmount: withdrawalAmount,
        withdrawalStatus: 'Pending',
        withdrawalMethod: method,
        upiId: method === 'upi' ? upiId : '',
        accountNumber: method === 'bank' ? accountNumber : '',
        ifscCode: method === 'bank' ? ifscCode : '',
        bankName: method === 'bank' ? bankName : '',
      };

      await updateDoc(userRef, withdrawalData);

      setMessage('✅ Withdrawal request submitted successfully!');
      setAmount('');
      setUpiId('');
      setAccountNumber('');
      setIfscCode('');
      setBankName('');
    } catch (err) {
      console.error(err);
      setError('❌ Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-semibold text-center text-gray-800 mb-5">
        💸 Request Withdrawal
      </h2>
      <div className="text-center mb-4">
        <p className="text-lg">Your balance: <span className="font-bold">₹{userBalance.toFixed(2)}</span></p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount to Withdraw</label>
            <input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full border border-gray-300 px-4 py-2 rounded focus:outline-none focus:ring focus:border-blue-400 mt-1"
            />
        </div>

        <div className="flex justify-center gap-4">
            <button type="button" onClick={() => setMethod('upi')} className={`px-4 py-2 rounded ${method === 'upi' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>UPI</button>
            <button type="button" onClick={() => setMethod('bank')} className={`px-4 py-2 rounded ${method === 'bank' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Bank Transfer</button>
        </div>

        {method === 'upi' && (
            <input
              type="text"
              placeholder="Enter your UPI ID (e.g., user@upi)"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              required={method === 'upi'}
              className="w-full border border-gray-300 px-4 py-2 rounded focus:outline-none focus:ring focus:border-blue-400"
            />
        )}

        {method === 'bank' && (
            <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Bank Account Number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  required={method === 'bank'}
                  className="w-full border border-gray-300 px-4 py-2 rounded focus:outline-none focus:ring focus:border-blue-400"
                />
                <input
                  type="text"
                  placeholder="IFSC Code"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value)}
                  required={method === 'bank'}
                  className="w-full border border-gray-300 px-4 py-2 rounded focus:outline-none focus:ring focus:border-blue-400"
                />
                <input
                  type="text"
                  placeholder="Bank Name"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  required={method === 'bank'}
                  className="w-full border border-gray-300 px-4 py-2 rounded focus:outline-none focus:ring focus:border-blue-400"
                />
            </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 transition"
        >
          {loading ? 'Submitting...' : 'Submit Withdrawal Request'}
        </button>
      </form>

      {message && <p className="mt-4 text-green-600 text-center">{message}</p>}
      {error && <p className="mt-4 text-red-600 text-center">{error}</p>}
    </div>
  );
};

export default Withdraw;