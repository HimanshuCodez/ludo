import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  Wallet, 
  Loader2, 
  AlertCircle,
  IndianRupee,
  ShieldCheck,
  UploadCloud,
  Clock,
  XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, addDoc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const Header = () => <div className="h-16 bg-black/20 backdrop-blur-sm"></div>;
const Footer = () => <div className="h-12 bg-black/20 backdrop-blur-sm mt-auto"></div>;

export function PaymentConfirmation() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [paymentProof, setPaymentProof] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('confirming'); // confirming, pending, approved, rejected
  const [topUpId, setTopUpId] = useState(null);
  const [rejectionComment, setRejectionComment] = useState('');

  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;
  const amount = parseFloat(window.localStorage.getItem('Amount') || 0);

  useEffect(() => {
    if (!user || !amount) {
      setError('Invalid payment details. Please try again.');
      setTimeout(() => navigate('/Pay'), 3000);
    }
  }, [user, amount, navigate]);

  useEffect(() => {
    if (!topUpId) return;

    const unsubscribe = onSnapshot(doc(db, 'top-ups', topUpId), (doc) => {
      const data = doc.data();
      if (data) {
        switch (data.status) {
          case 'approved':
            setPaymentStatus('approved');
            setTimeout(() => navigate('/MyWallet'), 3000);
            break;
          case 'rejected':
            setPaymentStatus('rejected');
            setRejectionComment(data.adminComment || 'Your payment could not be verified.');
            break;
          default:
            break;
        }
      }
    });

    return () => unsubscribe();
  }, [topUpId, navigate]);

  const handleConfirmPayment = async () => {
    if (!paymentProof) {
      setError('Please upload a payment screenshot.');
      return;
    }

    setUploading(true);
    setError('');
    
    try {
      const storage = getStorage();
      const storageRef = ref(storage, `paymentProofs/${user.uid}/${Date.now()}_${paymentProof.name}`);
      await uploadBytes(storageRef, paymentProof);
      const proofUrl = await getDownloadURL(storageRef);

      const topUpRef = await addDoc(collection(db, 'top-ups'), {
        userId: user.uid,
        amount,
        status: 'pending',
        paymentProof: proofUrl,
        createdAt: new Date().toISOString(),
      });
      
      setTopUpId(topUpRef.id);
      setPaymentStatus('pending');
      
    } catch (err) {
      setError('Failed to submit request. Please check your connection and try again.');
      console.error('Error submitting top-up request:', err);
    } finally {
      setUploading(false);
    }
  };

  const renderInitialContent = () => (
    <motion.div
      key="confirm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md space-y-6"
    >
      <motion.div
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
              <IndianRupee className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Payment Amount</h3>
              <p className="text-gray-400 text-sm">Ready to process</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-white">₹{amount}</p>
        </div>
        <div className="flex items-center space-x-2 text-green-400 bg-green-500/10 rounded-lg p-3">
          <ShieldCheck className="w-5 h-5" />
          <span className="text-sm font-medium">Secure Transaction</span>
        </div>
      </motion.div>

      <motion.div>
        <label htmlFor="file-upload" className="w-full cursor-pointer bg-white/5 border border-dashed border-white/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors">
          <UploadCloud className="w-10 h-10 text-purple-400 mb-3" />
          <span className="font-semibold text-white">{paymentProof ? 'File Selected' : 'Upload Screenshot'}</span>
          <span className="text-xs text-gray-400 mt-1">{paymentProof ? paymentProof.name : 'PNG, JPG, GIF up to 10MB'}</span>
        </label>
        <input id="file-upload" type="file" onChange={(e) => setPaymentProof(e.target.files[0])} className="hidden" />
      </motion.div>

      <motion.button
        onClick={handleConfirmPayment}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-4 rounded-2xl font-bold text-lg shadow-2xl flex items-center justify-center space-x-3 group"
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        disabled={uploading}
      >
        <Wallet className="w-6 h-6" />
        <span>{uploading ? 'Submitting...' : 'Submit for Verification'}</span>
      </motion.button>
    </motion.div>
  );

  const renderPendingContent = () => (
    <motion.div
      key="pending"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center space-y-6 text-center"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className="w-24 h-24 border-4 border-purple-500/30 border-t-purple-500 rounded-full"
      />
      <h2 className="text-3xl font-bold text-white">Payment Processing</h2>
      <p className="text-gray-300 max-w-sm">We have received your request. Please wait while we verify your payment. This page will update automatically.</p>
      <div className="flex items-center space-x-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 backdrop-blur-sm">
        <Clock className="w-6 h-6 text-yellow-400 flex-shrink-0" />
        <p className="text-yellow-300 text-lg">Do not close this page</p>
      </div>
    </motion.div>
  );

  const renderApprovedContent = () => (
    <motion.div
      key="success"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center space-y-4 text-center"
    >
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, delay: 0.2 }}>
        <CheckCircle className="w-24 h-24 text-green-500" />
      </motion.div>
      <h2 className="text-3xl font-bold text-green-400">Payment Approved!</h2>
      <p className="text-gray-300">₹{amount} has been added to your wallet. Redirecting...</p>
    </motion.div>
  );

  const renderRejectedContent = () => (
    <motion.div
      key="rejected"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center space-y-6 text-center"
    >
      <XCircle className="w-24 h-24 text-red-500" />
      <h2 className="text-3xl font-bold text-red-400">Payment Rejected</h2>
      <p className="text-gray-300 max-w-md">Reason: {rejectionComment}</p>
      <button
        onClick={() => navigate('/Support')}
        className="w-full max-w-xs bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-bold"
      >
        Contact Support
      </button>
    </motion.div>
  );

  return (
    <div className="font-roboto bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
      <Header />
      <div className="relative z-10 p-6 text-white flex flex-col items-center min-h-[80vh] justify-center">
        <AnimatePresence mode="wait">
          {uploading ? (
            <motion.div key="loading" className="flex flex-col items-center space-y-4">
              <Loader2 className="w-16 h-16 text-purple-400 animate-spin" />
              <p className="text-xl text-gray-300">Submitting your request...</p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              className="flex items-center space-x-3 bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 backdrop-blur-sm"
            >
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-lg">{error}</p>
            </motion.div>
          ) : {
            'confirming': renderInitialContent(),
            'pending': renderPendingContent(),
            'approved': renderApprovedContent(),
            'rejected': renderRejectedContent(),
          }[paymentStatus]}
        </AnimatePresence>
      </div>
      <Footer />
    </div>
  );
}
''