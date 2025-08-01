import { useEffect, useState } from 'react';
import { Header } from '../Components/Header';
import { Footer } from '../Components/Footer';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export function Pay() {
  const [qr, setQr] = useState('');
  const [amount] = useState(window.localStorage.getItem('Amount'));
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  // Generate QR code using reliable API
  useEffect(() => {
    if (!amount || isNaN(amount) || amount < 250 || amount > 100000) {
      setError('Invalid amount. Please select an amount between ₹250 and ₹100000.');
      setLoading(false);
      navigate('/AddCash');
      return;
    }

    const upiLink = `upi://pay?pa=7378160677-2@axl&pn=TrueWinCircle&am=${amount}&cu=INR`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
      upiLink
    )}&size=300x300`;

    setQr(qrUrl);
    setLoading(false);
  }, [amount, navigate]);

  // Handle screenshot upload
  const handleScreenshotUpload = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setError('Please select a screenshot.');
      return;
    }

    const formData = new FormData();
    formData.append('screenshot', file);
    formData.append('amount', amount);

    setLoading(true);
    axios
      .post('https://8f54vp0d-5000.inc1.devtunnels.ms/uploadScreenshot', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(() => {
        setPaymentStatus('awaiting_verification');
        setLoading(false);
      })
      .catch((err) => {
        setError(
          err.response?.data?.error || 'Failed to upload screenshot. Please try again.'
        );
        setLoading(false);
      });
  };

  return (
    <div className="font-roboto bg-gradient-to-b from-blue-900 to-blue-800 min-h-screen">
      <Header />
      <div className="p-6 md:p-10 text-white flex flex-col items-center">
        <h1 className="text-4xl font-bold text-center mb-6 drop-shadow-md">Pay Now</h1>

        {loading && <div className="text-lg text-center animate-pulse">Generating QR code...</div>}

        {error && <div className="text-red-500 text-center mb-4 text-lg">{error}</div>}

        {!loading && qr && paymentStatus !== 'expired' && (
          <div className=" bg-opacity-5 rounded-xl shadow-xl p-6 flex flex-col items-center w-full max-w-md">
            <img
              src={qr}
              className="w-64 h-64 mb-4 border-4 border-white rounded-xl shadow-lg"
              alt="UPI QR Code"
            />
            <p className="text-lg text-center mb-3">
              Scan to pay <span className="font-bold">₹{amount}</span> to{' '}
              <span className="font-semibold text-green-300">7378160677-2@axl</span> using
              GPay, PhonePe, etc.
            </p>
            <p className="text-lg font-mono mb-5 text-yellow-300">
              ⏳ Time Left:{' '}
              <span className="font-bold text-white">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </p>

            {paymentStatus === 'pending' && (
              <div className="w-full text-center">
                <label className="text-lg mb-2 block">Upload Payment Screenshot:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotUpload}
                  className="bg-white text-black p-2 rounded-md w-full max-w-xs mx-auto text-sm"
                />
              </div>
            )}

            {paymentStatus === 'awaiting_verification' && (
              <div className="text-yellow-400 text-lg text-center mt-4 animate-pulse">
                Awaiting admin verification...
              </div>
            )}
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
