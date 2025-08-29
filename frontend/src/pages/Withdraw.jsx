// src/components/Withdraw.jsx

import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, updateDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { toast } from 'react-toastify'; // Import toast

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
  const [onCooldown, setOnCooldown] = useState(false);
  const [cooldownTime, setCooldownTime] = useState('');

  useEffect(() => {
    const user = auth.currentUser;
    let unsubscribeFromBalance;

    if (user) {
      const userRef = doc(db, 'users', user.uid);
      unsubscribeFromBalance = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserBalance(docSnap.data().winningChips || 0);
        } else {
          setUserBalance(0);
        }
      });
    }

    const withdrawalTimestamp = localStorage.getItem('withdrawalTimestamp');
    if (withdrawalTimestamp) {
      const now = new Date().getTime();
      const fourHoursInMillis = 4 * 60 * 60 * 1000;
      const timeSinceWithdrawal = now - parseInt(withdrawalTimestamp, 10);

      if (timeSinceWithdrawal < fourHoursInMillis) {
        setOnCooldown(true);
      } else {
        localStorage.removeItem('withdrawalTimestamp');
        setOnCooldown(false);
      }
    }

    return () => {
      if (unsubscribeFromBalance) {
        unsubscribeFromBalance();
      }
    };
  }, []);

  useEffect(() => {
    let intervalId;
    if (onCooldown) {
      intervalId = setInterval(() => {
        const withdrawalTimestamp = localStorage.getItem('withdrawalTimestamp');
        if (!withdrawalTimestamp) {
          setOnCooldown(false);
          return;
        }
        const fourHoursInMillis = 4 * 60 * 60 * 1000;
        const currentTime = new Date().getTime();
        const timePassed = currentTime - parseInt(withdrawalTimestamp, 10);
        const remaining = fourHoursInMillis - timePassed;

        if (remaining <= 0) {
          setOnCooldown(false);
          setCooldownTime('');
          localStorage.removeItem('withdrawalTimestamp');
        } else {
          const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
          setCooldownTime(`${hours}h ${minutes}m ${seconds}s`);
        }
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [onCooldown]);


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
      toast.error('Please enter a valid amount.');
      return;
    }

    if (withdrawalAmount > userBalance) {
        toast.error('Insufficient balance.');
        return;
    }
    if (withdrawalAmount < 200) {
        toast.error('Balance must be above 200rs.');
        return;
    }

    if (method === 'upi' && !validateUPI(upiId)) {
      toast.error('Please enter a valid UPI ID (e.g., user@bank).');
      return;
    }

    if (method === 'bank' && (!accountNumber || !ifscCode || !bankName)) {
      toast.error('Please fill in all bank details.');
      return;
    }

    setLoading(true);

    const user = auth.currentUser;
    if (!user) {
      toast.error('User not logged in.');
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

      const timestamp = new Date().getTime();
      localStorage.setItem('withdrawalTimestamp', timestamp.toString());
      setOnCooldown(true);

      toast.success('✅ Withdrawal request submitted successfully!');
      setAmount('');
      setUpiId('');
      setAccountNumber('');
      setIfscCode('');
      setBankName('');
    } catch (err) {
      console.error(err);
      toast.error('❌ Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-semibold text-center text-gray-800 mb-5">
        💸 Request Withdrawal
      </h2>
      
      {onCooldown ? (
        <div className="text-center p-8">
          <p className="text-lg text-gray-700">Your withdrawal request has been submitted.</p>
          <p className="text-md text-gray-600 mt-2">Next withdrawal is available in:</p>
          <div className="text-3xl font-bold text-blue-600 mt-4">
            {cooldownTime}
          </div>
        </div>
      ) : (
        <>
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
        </>
      )}

      {message && <p className="mt-4 text-green-600 text-center">{message}</p>}
      {error && <p className="mt-4 text-red-600 text-center">{error}</p>}
    </div>
  );
};

export default Withdraw;
