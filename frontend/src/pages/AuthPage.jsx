import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const { user, loading } = useAuth();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [referral, setReferral] = useState("");
  const [name, setName] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const navigate = useNavigate();

  // Redirect if already logged in and user exists in Firestore
  useEffect(() => {
    const checkUserAndRedirect = async () => {
      if (!loading && user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          navigate("/home");
        }
      }
    };
    checkUserAndRedirect();
  }, [user, loading, navigate]);

  useEffect(() => {
    const auth = getAuth();
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: () => console.log("reCAPTCHA solved"),
        }
      );
    }

    let timer;
    if (confirmationResult) {
      timer = setTimeout(() => {
        setConfirmationResult(null);
        alert("OTP session expired. Request a new OTP.");
      }, 120000); // 2 minutes timeout
    }
    return () => clearTimeout(timer);
  }, [confirmationResult]);

  const sendOTP = async () => {
    const auth = getAuth();
    const appVerifier = window.recaptchaVerifier;
    const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;

    try {
      const result = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        appVerifier
      );
      setConfirmationResult(result);
      console.log("Confirmation Result:", result);
      alert("OTP sent");
    } catch (error) {
      console.error("OTP Error", error);
      alert("OTP failed: " + error.message);
    }
  };

 const verifyOTP = async () => {
  if (!confirmationResult) {
    alert("Please request a new OTP first.");
    return;
  }

  if (!otp || otp.length !== 6 || isNaN(otp)) {
    alert("Please enter a valid 6-digit OTP");
    return;
  }

  try {
    const result = await confirmationResult.confirm(otp);
    const user = result.user;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const generateReferralCode = () => {
        const prefix = name?.substring(0, 3)?.toUpperCase() || "REF";
        const suffix = Math.random()
          .toString(36)
          .substring(2, 6)
          .toUpperCase();
        return `${prefix}${suffix}`;
      };

      await setDoc(userRef, {
        uid: user.uid,
        phoneNumber: user.phoneNumber,
        name: name || "Anonymous",
        referral: referral || null,
        referralCode: generateReferralCode(),
        role:"user",
        createdAt: new Date().toISOString(),
      });
    }

 
    alert("Phone number verified!");
    navigate("/home");

  } catch (error) {
    console.error("OTP verification failed", error);
    if (
      error.code === "auth/invalid-verification-code" ||
      error.code === "auth/code-expired"
    ) {
      alert("Invalid or expired OTP. Please request a new OTP.");
      setConfirmationResult(null);
    } else if (error.code === "permission-denied") {
      alert("Error: Missing or insufficient permissions. Check Firestore rules.");
    } else {
      alert("Invalid OTP: " + error.message);
    }
  }
};

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-yellow-100 font-sans px-4">
      <div className="max-w-md w-full bg-white p-6 rounded-2xl shadow-xl border-4 border-red-400">
        <h2 className="text-3xl font-bold text-center text-purple-700 mb-4">
          🎲 Ludo Login
        </h2>
        <label className="block mt-4 mb-2 text-sm font-semibold text-gray-700">
          Name
        </label>
        <input
          type="text"
          placeholder="Enter your name"
          maxLength={30}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />

        <label className="block mb-2 text-sm font-semibold text-gray-700">
          Phone Number
        </label>
        <div className="flex items-center gap-2">
          <span className="bg-gray-200 px-3 py-2 rounded-md text-gray-600">
            +91
          </span>
          <input
            type="tel"
            placeholder="Enter 10-digit number"
            maxLength={10}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <label className="block mt-4 mb-2 text-sm font-semibold text-gray-700">
          Referral Code{" "}
          <span className="text-xs text-gray-400">(optional)</span>
        </label>
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

        <label className="block mt-6 mb-2 text-sm font-semibold text-gray-700">
          Enter OTP
        </label>
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