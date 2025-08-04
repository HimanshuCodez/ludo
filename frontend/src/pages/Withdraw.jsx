// src/components/Withdraw.jsx

import { useState } from 'react';
import { auth, db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

const Withdraw = () => {
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const validateUPI = (upi) => {
    const upiRegex = /^[\w.-]+@[\w.-]+$/;
    return upiRegex.test(upi);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    if (!validateUPI(upiId)) {
      setError('Please enter a valid UPI ID (e.g., user@bank).');
      setLoading(false);
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setError('User not logged in.');
      setLoading(false);
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        upiId,
        withdrawalStatus: 'Pending',
      });

      setMessage('✅ Withdrawal request submitted successfully!');
      setUpiId('');
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

      <form onSubmit={handleSubmit} className="space-y-5">
        <input
          type="text"
          placeholder="Enter your UPI ID (e.g., user@upi)"
          value={upiId}
          onChange={(e) => setUpiId(e.target.value)}
          required
          className="w-full border border-gray-300 px-4 py-2 rounded focus:outline-none focus:ring focus:border-blue-400"
        />

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
