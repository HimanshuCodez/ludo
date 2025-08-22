import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase'; // Adjust path as needed
import { toast } from 'react-toastify'; // Import toast

export function Refer() {
  const navigate = useNavigate();
  const [referralCode, setReferralCode] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const auth = getAuth();
  const user = auth.currentUser;

  // Fetch user data including phone number
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setUserPhone(userData.phoneNumber || userData.phone || '');
            // If user already has a referral code, set it
            if (userData.referralCode) {
              setReferralCode(userData.referralCode);
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserData();
  }, [user]);

  const generateReferralCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setReferralCode(code);
    
    // Optionally save the referral code to Firestore
    // You can uncomment and implement this if needed
    /*
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      updateDoc(userRef, { referralCode: code });
    }
    */
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success('Referral code copied!'); // Use toast.success
  };

  const handleWhatsAppShare = () => {
    if (!referralCode) {
      toast.error('Please generate a referral code first!'); // Use toast.error
      return;
    }

    setIsLoading(true);
    
    // Create the WhatsApp message template
    const message = `🎮 Hey! Join me on this amazing gaming platform and win real money! 💰

🎯 Use my referral code:
    👇👇👇👇👇
  *${referralCode}*

🎲 Play exciting games like Ludo, Snake and more!
💸 Instant withdrawals available 24/7
🏆 Win cash prizes daily!

Download now and start winning! 

Register and Play Here 
👇👇👇👇👇👇👇👇
https://lifeludo.in
`;

    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Create WhatsApp URL
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`;
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 flex flex-col items-center">
      <div className="flex-1 flex flex-col justify-center items-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="bg-white shadow-xl rounded-2xl p-8 text-center max-w-md w-full"
        >
          <h1 className="text-3xl font-bold mb-4 text-purple-600">🎉 Refer and Earn!</h1>
          <p className="text-gray-600 mb-6">Generate your referral code and share it with friends to earn rewards.</p>

          {referralCode ? (
            <div className="mb-6">
              <div
                onClick={handleCopy}
                className="text-2xl font-mono bg-gray-100 text-purple-700 px-6 py-3 rounded-lg mb-4 cursor-pointer hover:bg-purple-100 transition"
              >
                {referralCode}
                <span className="text-sm ml-2 text-gray-500">(click to copy)</span>
              </div>
              
              {/* Share Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleWhatsAppShare}
                  disabled={isLoading}
                  className="bg-green-500 text-white py-3 px-6 rounded-xl text-lg hover:bg-green-600 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Sharing...
                    </>
                  ) : (
                    <>
                      📱 Share on WhatsApp
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleCopy}
                  className="bg-blue-500 text-white py-2 px-6 rounded-xl text-base hover:bg-blue-600 transition"
                >
                  📋 Copy Code
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={generateReferralCode}
              className="bg-purple-600 text-white py-3 px-6 rounded-xl text-lg hover:bg-purple-700 transition mb-6"
            >
              Generate Referral Code
            </button>
          )}

          {/* Rewards Info */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl mt-4">
            <h3 className="font-bold text-purple-700 mb-2">🎁 Referral Rewards</h3>
            <ul className="text-sm text-gray-600 space-y-1">
           
              <li>• Earn 2% of their winnings forever!</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}