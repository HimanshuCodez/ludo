import { useEffect, useState } from 'react';
import { Header } from '../Components/Header';
import { Footer } from '../Components/Footer';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import QRCode from 'react-qr-code';

export function Pay() {
  const [amount] = useState(window.localStorage.getItem('Amount') || 0);
  const [timeLeft, setTimeLeft] = useState(240); // ⏱️ 4 minutes
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;
  const transactionId = Date.now().toString();
  const upiId = 'khushisantoshi21@okaxis'; // update for production

  // ⏳ Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      setPaymentStatus('expired');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPaymentStatus('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // ✅ Validate user and amount
  useEffect(() => {
    if (!user) {
      setError('Please log in to proceed with payment.');
      setLoading(false);
      return;
    }

    if (!amount || isNaN(amount) || amount < 10 || amount > 100000) {
      setError('Invalid amount. Please select an amount between ₹10 and ₹100000.');
      setLoading(false);
      navigate('/AddCash');
      return;
    }

    window.localStorage.setItem('TransactionId', transactionId);
    setLoading(false);
  }, [amount, navigate, user]);

  const upiString = `upi://pay?pa=${upiId}&pn=TrueWinCircle&am=${amount}&cu=INR&tr=${transactionId}`;

  const handleProceedToConfirm = () => {
    if (paymentStatus !== 'pending') return;
    navigate('/PaymentConfirmation');
  };

  return (
    <div className="font-roboto bg-gradient-to-b from-blue-900 to-blue-800 min-h-screen">
      <Header />
      <div className="p-6 md:p-10 text-white flex flex-col items-center">
        <h1 className="text-4xl font-bold text-center mb-6 drop-shadow-md">Pay Now</h1>

        {loading && <div className="text-lg text-center animate-pulse">Loading payment details...</div>}

        {error && <div className="text-red-500 text-center mb-4 text-lg">{error}</div>}

        {!loading && paymentStatus === 'pending' && (
          <div className="bg-opacity-5 rounded-xl shadow-xl p-6 flex flex-col items-center w-full max-w-md">
            <p className="text-lg text-center mb-3">
              Scan this QR to pay <span className="font-bold">₹{amount}</span>
            </p>

            <div className="mb-5 bg-white p-2 rounded">
              <QRCode value={upiString} size={200} />
            </div>

            <p className="text-lg font-mono mb-5 text-yellow-300">
              ⏳ Time Left:{' '}
              <span className="font-bold text-white">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </p>

            <button
              onClick={handleProceedToConfirm}
              disabled={paymentStatus !== 'pending'}
              className={`w-full ${
                paymentStatus === 'pending' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-500 cursor-not-allowed'
              } text-white py-2 rounded-lg font-bold transition duration-300`}
            >
              I Have Completed Payment
            </button>
          </div>
        )}

        {paymentStatus === 'expired' && (
          <div className="text-red-500 text-lg text-center mt-6">
            ⚠️ Payment request expired after 4 minutes.{' '}
            <button onClick={() => navigate('/AddCash')} className="text-blue-300 underline ml-1">
              Try again
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
