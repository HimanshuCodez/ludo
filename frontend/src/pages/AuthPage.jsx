import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { useState } from "react";

export default function AuthPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);

  const setupRecaptcha = () => {
    const auth = getAuth();
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible',
      'callback': (response) => {
        // reCAPTCHA solved
      }
    });
  };

  const sendOTP = async () => {
    setupRecaptcha();
    const auth = getAuth();
    const appVerifier = window.recaptchaVerifier;

    try {
      const result = await signInWithPhoneNumber(auth, phone, appVerifier);
      setConfirmationResult(result);
      alert('OTP sent');
    } catch (error) {
      console.error('OTP Error', error);
      alert('OTP failed: ' + error.message);
    }
  };

  const verifyOTP = async () => {
    try {
      await confirmationResult.confirm(otp);
      alert("Phone number verified!");
    } catch (error) {
      alert("Invalid OTP");
    }
  };

  return (
    <div className="p-4">
      <input type="tel" placeholder="+91..." value={phone} onChange={(e) => setPhone(e.target.value)} className="border p-2" />
      <button onClick={sendOTP} className="bg-blue-500 text-white p-2 rounded mt-2">Send OTP</button>

      <input type="text" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} className="border p-2 mt-2" />
      <button onClick={verifyOTP} className="bg-green-500 text-white p-2 rounded mt-2">Verify OTP</button>

      <div id="recaptcha-container"></div>
    </div>
  );
}
