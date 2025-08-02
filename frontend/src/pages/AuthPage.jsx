// src/pages/AuthPage.jsx
import React, { useState, useEffect } from "react";
import { auth, RecaptchaVerifier, signInWithPhoneNumber, db } from "../firebase.js";
import { collection, doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const AuthPage = () => {
  const [phone, setPhone] = useState("");
  const [referral, setReferral] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmObj, setConfirmObj] = useState(null);
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => {},
      });
    }
  }, []);

  const sendOTP = async () => {
    const cleanedPhone = phone.replace(/\D/g, '');

    if (cleanedPhone.length !== 10) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }

    const appVerifier = window.recaptchaVerifier;

    try {
      const result = await signInWithPhoneNumber(auth, "+91" + cleanedPhone, appVerifier);
      setConfirmObj(result);
      setStep(2);
    } catch (error) {
      console.error("OTP Send Error:", error);
      alert("Failed to send OTP: " + error.message);
    }
  };

  const verifyOTP = async () => {
    if (!otp || !confirmObj) return alert("Enter OTP");

    try {
      const result = await confirmObj.confirm(otp);
      const user = result.user;

      await setDoc(doc(db, "users", user.uid), {
        phone,
        referral: referral || null,
        uid: user.uid,
        createdAt: new Date().toISOString(),
      });

      navigate("/home");
    } catch (error) {
      console.error("OTP Verify Error:", error);
      alert("Invalid OTP");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-yellow-200 via-red-200 to-green-200 px-4 relative">
      <div className="absolute top-6 text-4xl animate-bounce">🎲</div>
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border-4 border-dashed border-indigo-400">
        <h1 className="text-4xl font-extrabold text-center text-indigo-700 mb-4">
          Welcome to <span className="text-green-600">Life</span> <span className="text-red-500">Ludo</span> 🎮
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Join the game of life, one dice roll at a time!
        </p>

        {step === 1 && (
          <>
            <input
              type="tel"
              placeholder="📱 Enter Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mb-4 w-full px-4 py-3 border-2 border-yellow-400 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <input
              type="text"
              placeholder="🎁 Referral Code (optional)"
              value={referral}
              onChange={(e) => setReferral(e.target.value)}
              className="mb-4 w-full px-4 py-3 border-2 border-blue-400 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={sendOTP}
              className="w-full bg-green-500 hover:bg-green-600 text-white text-xl font-bold py-3 rounded-xl transition duration-300"
            >
              🚀 Send OTP
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <input
              type="text"
              placeholder="🔒 Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="mb-4 w-full px-4 py-3 border-2 border-purple-400 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={verifyOTP}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xl font-bold py-3 rounded-xl transition duration-300"
            >
              ✅ Verify OTP
            </button>
          </>
        )}
      </div>

      <div id="recaptcha-container"></div>
    </div>
  );
};

export default AuthPage;
