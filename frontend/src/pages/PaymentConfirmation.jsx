import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function PaymentConfirmation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;
  const amount = parseFloat(window.localStorage.getItem('Amount') || 0);

  useEffect(() => {
    if (!user || !amount) {
      setError('Invalid payment details. Please try again.');
      navigate('/Pay');
    }
  }, [user, amount, navigate]);

  const handleConfirmPayment = async () => {
    if (!amount) {
      setError('Amount not found.');
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const currentChips = parseFloat(userSnap.data()?.depositChips) || 0;
      await updateDoc(userRef, {
        depositChips: currentChips + amount,
        updatedAt: new Date().toISOString(),
      });
      navigate('/MyWallet');
    } catch (err) {
      setError('Failed to update wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-roboto bg-gradient-to-b from-blue-900 to-blue-800 min-h-screen">
      <Header />
      <div className="p-6 md:p-10 text-white flex flex-col items-center">
        <h1 className="text-4xl font-bold text-center mb-6 drop-shadow-md">Confirm Payment</h1>

        {loading && <div className="text-lg text-center animate-pulse">Updating wallet...</div>}

        {error && <div className="text-red-500 text-center mb-4 text-lg">{error}</div>}

        {!loading && (
          <div className="bg-opacity-5 rounded-xl shadow-xl p-6 flex flex-col items-center w-full max-w-md">
            <p className="text-lg text-center mb-3">
              You have paid <span className="font-bold">₹{amount}</span>. Confirm to update your wallet.
            </p>
            <button
              onClick={handleConfirmPayment}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-bold transition duration-300"
            >
              I Have Paid
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

