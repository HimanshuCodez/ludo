
import { useEffect, useState } from 'react';
import { Header } from '../Components/Header';
import { Footer } from '../Components/Footer';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import axios from 'axios';

export function Pay() {
  const [amount, setAmount] = useState(window.localStorage.getItem('Amount') || '');
  const [upiId, setUpiId] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  // Timer countdown
  useEffect(() => {
    if (!timeLeft || timeLeft <= 0) {
      setPaymentStatus('expired');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Initiate payment request
  const initiatePayment = () => {
    if (!user) {
      setError('Please log in to proceed with payment.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount < 250 || parsedAmount > 100000) {
      setError('Invalid amount. Please enter an amount between ₹250 and ₹100000.');
      return;
    }

    if (!upiId || !upiId.includes('@')) {
      setError('Please enter a valid UPI ID (e.g., example@bank).');
      return;
    }

    setLoading(true);
    setError('');
    const upiLink = `upi://pay?pa=${upiId}&pn=TrueWinCircle&am=${parsedAmount}&cu=INR&tr=${Date.now()}`;
    setTransactionId(Date.now().toString());
    window.location.href = upiLink; // Opens UPI app for payment
    setLoading(false);
  };

  // Verify payment
  const verifyPayment = async () => {
    if (!transactionId) {
      setError('Transaction ID not found.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        'https://8f54vp0d-5000.inc1.devtunnels.ms/verifyPayment',
        {
          transactionId,
          amount: parseFloat(amount),
          phone: user.phoneNumber,
        }
      );
      if (response.data.success) {
        // Update Firestore wallet
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          depositChips: parseFloat(amount) + (parseFloat(await (await userRef.get()).data()?.depositChips) || 0),
          updatedAt: new Date().toISOString(),
        });
        setPaymentStatus('completed');
        navigate('/mywallet');
      } else {
        setError('Payment verification failed. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to verify payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-roboto bg-gradient-to-b from-blue-900 to-blue-800 min-h-screen">
      <Header />
      <div className="p-6 md:p-10 text-white flex flex-col items-center">
        <h1 className="text-4xl font-bold text-center mb-6 drop-shadow-md">Pay Now</h1>

        {loading && <div className="text-lg text-center animate-pulse">Processing payment...</div>}

        {error && <div className="text-red-500 text-center mb-4 text-lg">{error}</div>}

        {!loading && paymentStatus === 'pending' && (
          <div className="bg-opacity-5 rounded-xl shadow-xl p-6 flex flex-col items-center w-full max-w-md">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount (₹250-₹100000)"
              className="w-full mb-3 p-2 rounded bg-gray-800 text-white border border-gray-700"
            />
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="Enter UPI ID (e.g., example@bank)"
              className="w-full mb-3 p-2 rounded bg-gray-800 text-white border border-gray-700"
            />
            <button
              onClick={initiatePayment}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold transition duration-300"
            >
              Pay Now
            </button>
            {transactionId && (
              <>
                <p className="text-lg text-center mb-3 mt-4">
                  A payment request of <span className="font-bold">₹{amount}</span> has been sent. Complete the payment in your UPI app.
                </p>
                <p className="text-lg font-mono mb-5 text-yellow-300">
                  ⏳ Time Left:{' '}
                  <span className="font-bold text-white">
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </span>
                </p>
                <button
                  onClick={verifyPayment}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-bold transition duration-300"
                >
                  Confirm Payment
                </button>
              </>
            )}
          </div>
        )}

        {paymentStatus === 'completed' && (
          <div className="text-green-500 text-lg text-center mt-6">
            ✅ Payment successful! Redirecting to wallet...
          </div>
        )}

        {paymentStatus === 'expired' && (
          <div className="text-red-500 text-lg text-center mt-6">
            ⚠️ Payment request expired.{' '}
            <button
              onClick={() => navigate('/AddCash')}
              className="text-blue-300 underline ml-1"
            >
              Try again
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}