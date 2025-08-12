import { useEffect, useState } from 'react';
import { Header } from '../Components/Header';
import { Footer } from '../Components/Footer';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export function Pay() {
  const [amount] = useState(window.localStorage.getItem('Amount') || 0);
  const [timeLeft, setTimeLeft] = useState(240); // ⏱️ 4 minutes
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [barcodeUrl, setBarcodeUrl] = useState('');
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;
  const transactionId = Date.now().toString();

  // Combined initialization useEffect
  useEffect(() => {
    const initializePayment = async () => {
      // 1. Validate user
      if (!user) {
        setError('Please log in to proceed with payment.');
        setLoading(false);
        return;
      }

      // 2. Validate amount
      if (!amount || isNaN(amount) || amount < 10 || amount > 20000) {
        setError('Invalid amount. Please select an amount between ₹10 and ₹20000.');
        navigate('/AddCash');
        setLoading(false);
        return;
      }

      window.localStorage.setItem('TransactionId', transactionId);

      // 3. Fetch barcode
      try {
        const docRef = doc(db, 'users', 'upi_barcode');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setBarcodeUrl(docSnap.data().NewBarcode);
        } else {
          setError('Could not find payment QR code.');
        }
      } catch (err) {
        setError('Failed to load payment QR code.');
        console.error(err);
      } finally {
        // 4. Finish loading
        setLoading(false);
      }
    };

    initializePayment();
  }, [amount, navigate, user, transactionId]);


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

        {!loading && !error && paymentStatus === 'pending' && (
          <div className="bg-opacity-5 rounded-xl shadow-xl p-6 flex flex-col items-center w-full max-w-md">
            <p className="text-lg text-center mb-3">
              Scan this QR to pay <span className="font-bold">₹{amount}</span>
            </p>

            <div className="mb-5 bg-white p-2 rounded">
              {barcodeUrl ? (
                <img src={barcodeUrl} alt="Payment QR Code" style={{ width: 200, height: 200 }} />
              ) : (
                <div className="w-[200px] h-[200px] bg-gray-200 animate-pulse flex items-center justify-center">
                  <p className="text-gray-500">Loading QR...</p>
                </div>
              )}
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
