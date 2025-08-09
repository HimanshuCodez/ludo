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
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSendingOTP, setIsSendingOTP] = useState(false);


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

   useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setOtpSent(false);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const sendOTP = async () => {
    if (isSendingOTP || otpSent) {
      return;
    }
    if (!phone || phone.length !== 10) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }

    setIsSendingOTP(true);
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
      setOtpSent(true);
      setCountdown(60);
      if (step === 1) {
        setStep(2);
      }
      alert("OTP sent");
    } catch (error) {
      console.error("OTP Error", error);
      alert("OTP failed: " + error.message);
    } finally {
      setIsSendingOTP(false);
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
        
        {/* Stepper */}
        <div className="flex items-center justify-center mb-6">
          <div className={`flex items-center ${step >= 1 ? 'text-purple-700' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-purple-700 text-white' : 'bg-gray-300'}`}>1</div>
            <span className="ml-2 font-semibold">Details</span>
          </div>
          <div className={`flex-1 h-1 mx-4 ${step > 1 ? 'bg-purple-700' : 'bg-gray-300'}`}></div>
          <div className={`flex items-center ${step >= 2 ? 'text-purple-700' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-purple-700 text-white' : 'bg-gray-300'}`}>2</div>
            <span className="ml-2 font-semibold">Verify</span>
          </div>
        </div>

        {step === 1 && (
          <>
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

            <label className="block mt-4 mb-2 text-sm font-semibold text-gray-700">
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
              disabled={isSendingOTP}
              className={`w-full text-white py-2 rounded-lg font-bold mt-4 transition duration-300 ${
                isSendingOTP
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-700"
              }`}>
              {isSendingOTP ? "Sending..." : "Send OTP"}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-center text-gray-600 mb-4">
              Enter the OTP sent to <strong>+91 {phone}</strong>.
            </p>
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

            <div className="mt-4 flex justify-between items-center">
              <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:underline">
                Change number
              </button>
              <button
                onClick={sendOTP}
                disabled={otpSent || isSendingOTP}
                className={`text-sm font-semibold ${
                  otpSent || isSendingOTP
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-purple-600 hover:underline"
                }`}>
                {isSendingOTP ? "Sending..." : (otpSent ? `Resend in ${countdown}s` : "Resend OTP")}
              </button>
            </div>
          </>
        )}
      </div>

      <div id="recaptcha-container"></div>
    </div>
  );
}