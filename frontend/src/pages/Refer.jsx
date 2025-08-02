
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export function Refer() {
  const navigate = useNavigate();
  const [referralCode, setReferralCode] = useState('');

  const generateReferralCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase(); // 6-digit alphanumeric
    setReferralCode(code);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    alert('Referral code copied!');
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
            <div
              onClick={handleCopy}
              className="text-2xl font-mono bg-gray-100 text-purple-700 px-6 py-3 rounded-lg mb-4 cursor-pointer hover:bg-purple-100 transition"
            >
              {referralCode}
              <span className="text-sm ml-2 text-gray-500">(click to copy)</span>
            </div>
          ) : (
            <button
              onClick={generateReferralCode}
              className="bg-purple-600 text-white py-3 px-6 rounded-xl text-lg hover:bg-purple-700 transition"
            >
              Generate Referral Code
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
