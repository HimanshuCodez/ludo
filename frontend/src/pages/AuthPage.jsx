import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase"; // ← Import Firestore instance
import { doc, setDoc, getDoc } from "firebase/firestore"; // ← Firestore methods

export default function AuthPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [referral, setReferral] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const navigate = useNavigate();

  const setupRecaptcha = () => {
    const auth = getAuth();
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {}
    });
  };

  const sendOTP = async () => {
    setupRecaptcha();
    const auth = getAuth();
    const appVerifier = window.recaptchaVerifier;
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

    try {
      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(result);
      alert('OTP sent');
    } catch (error) {
      console.error('OTP Error', error);
      alert('OTP failed: ' + error.message);
    }
  };

  const verifyOTP = async () => {
    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;

      // Save user to Firestore
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          phoneNumber: user.phoneNumber,
          referral: referral || null,
          createdAt: new Date().toISOString(),
        });
      }

      alert("Phone number verified!");
      navigate('/home');
    } catch (error) {
      console.error("OTP verification failed", error);
      alert("Invalid OTP");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-yellow-100 font-sans px-4">
      <div className="max-w-md w-full bg-white p-6 rounded-2xl shadow-xl border-4 border-red-400">
        <h2 className="text-3xl font-bold text-center text-purple-700 mb-4">🎲 Ludo Login</h2>
        
        <label className="block mb-2 text-sm font-semibold text-gray-700">Phone Number</label>
        <div className="flex items-center gap-2">
          <span className="bg-gray-200 px-3 py-2 rounded-md text-gray-600">+91</span>
          <input
            type="tel"
            placeholder="Enter 10-digit number"
            maxLength={10}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <label className="block mt-4 mb-2 text-sm font-semibold text-gray-700">Referral Code <span className="text-xs text-gray-400">(optional)</span></label>
        <input
          type="text"
          placeholder="Referral code"
          maxLength={8}
          value={referral}
          onChange={(e) => setReferral(e.target.value.toUpperCase())}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />

        <button
          onClick={sendOTP}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-bold mt-4 transition duration-300"
        >
          Send OTP
        </button>

        <label className="block mt-6 mb-2 text-sm font-semibold text-gray-700">Enter OTP</label>
        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />

        <button
          onClick={verifyOTP}
          className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-bold mt-4 transition duration-300"
        >
          Verify OTP
        </button>
      </div>

      <div id="recaptcha-container"></div>
    </div>
  );
}
