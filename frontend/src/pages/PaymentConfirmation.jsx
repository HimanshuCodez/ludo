import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  CheckCircle, 
  Wallet, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  IndianRupee,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase'; // Adjust path to your firebase config

// Mock components for demo (replace with actual if available)
const Header = () => <div className="h-16 bg-black/20 backdrop-blur-sm"></div>;
const Footer = () => <div className="h-12 bg-black/20 backdrop-blur-sm mt-auto"></div>;

export function PaymentConfirmation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;
  const amount = parseFloat(window.localStorage.getItem('Amount') || 0); // Get amount from localStorage

  useEffect(() => {
    if (!user || !amount) {
      setError('Invalid payment details. Please try again.');
      setTimeout(() => navigate('/Pay'), 2000); // Redirect after error
    }
  }, [user, amount, navigate]);

  const handleConfirmPayment = async () => {
    if (!amount) {
      setError('Amount not found.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const currentChips = parseFloat(userSnap.data()?.depositChips) || 0;

      await updateDoc(userRef, {
        depositChips: currentChips + amount,
        updatedAt: new Date().toISOString(),
      });
      
      setSuccess(true);
      
      // Navigate after showing success animation
      setTimeout(() => {
        navigate('/MyWallet');
      }, 2000);
      
    } catch (err) {
      setError('Failed to update wallet. Please try again.');
      console.error('Error updating wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-roboto bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <Header />
      
      <div className="relative z-10 p-6 md:p-10 text-white flex flex-col items-center min-h-[80vh] justify-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mb-4 shadow-2xl"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <CreditCard className="w-10 h-10 text-white" />
          </motion.div>
          
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
            Payment Confirmation
          </h1>
          <p className="text-gray-300 text-lg">Secure your transaction with one click</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center space-y-4"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full"
              />
              <p className="text-xl text-gray-300 animate-pulse">Updating your wallet...</p>
            </motion.div>
          )}

          {success && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="flex flex-col items-center space-y-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                className="relative"
              >
                <CheckCircle className="w-20 h-20 text-green-500" />
                <motion.div
                  className="absolute -top-2 -right-2"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 360]
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Sparkles className="w-8 h-8 text-yellow-400" />
                </motion.div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center"
              >
                <h2 className="text-2xl font-bold text-green-400 mb-2">Payment Confirmed!</h2>
                <p className="text-gray-300">Redirecting to your wallet...</p>
              </motion.div>
            </motion.div>
          )}

          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center space-x-3 bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 backdrop-blur-sm"
            >
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-lg">{error}</p>
            </motion.div>
          )}

          {!loading && !success && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md space-y-6"
            >
              {/* Payment Details Card */}
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
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">₹{amount}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 text-green-400 bg-green-500/10 rounded-lg p-3">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="text-sm font-medium">Secure Transaction</span>
                </div>
              </motion.div>

              {/* Confirmation Button */}
              <motion.button
                onClick={handleConfirmPayment}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-2xl flex items-center justify-center space-x-3 group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
              >
                <Wallet className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span>Confirm Payment</span>
                <motion.div
                  className="group-hover:translate-x-1 transition-transform"
                  whileHover={{ x: 4 }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
              </motion.button>

              {/* Additional Info */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center text-gray-400 text-sm"
              >
                <p>Your wallet will be updated instantly after confirmation</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <Footer />
    </div>
  );
}