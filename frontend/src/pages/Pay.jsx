import { useEffect, useState } from 'react';
import { Header } from '../Components/Header';
import { Footer } from '../Components/Footer';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';

export function Pay() {
  const [amount] = useState(window.localStorage.getItem('Amount') || 0);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;
  const transactionId = Date.now().toString();

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
          setPaymentStatus('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Initialize payment
  useEffect(() => {
    if (!user) {
      setError('Please log in to proceed with payment.');
      setLoading(false);
      return;
    }

    if (!amount || isNaN(amount) || amount < 10 || amount > 100000) {
      setError('Invalid amount. Please select an amount between ₹50 and ₹100000.');
      setLoading(false);
      navigate('/AddCash');
      return;
    }

    const upiLink = `upi://pay?pa=khushisantoshi21@okaxis&pn=TrueWinCircle&am=${amount}&cu=INR&tr=${transactionId}`;
    window.location.href = upiLink; // Open UPI app
    window.localStorage.setItem('TransactionId', transactionId); // Store transaction ID
    setLoading(false);
  }, [amount, navigate, user]);

  // Navigate to confirmation when ready or on manual trigger (e.g., back button)
  const handleProceedToConfirm = () => {
    if (paymentStatus === 'pending') {
      navigate('/PaymentConfirmation');
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
            <p className="text-lg text-center mb-3">
              A payment request of <span className="font-bold">₹{amount}</span> has been sent to your UPI app. Please complete the payment.
            </p>
            <p className="text-lg font-mono mb-5 text-yellow-300">
              ⏳ Time Left:{' '}
              <span className="font-bold text-white">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </p>
            <button
              onClick={handleProceedToConfirm}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold transition duration-300"
            >
              I Have Completed Payment
            </button>
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