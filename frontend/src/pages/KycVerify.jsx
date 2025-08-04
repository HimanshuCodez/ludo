import React, { useState, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { storage, db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { v4 as uuidv4 } from 'uuid';

const KycVerify = () => {
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [frontPreview, setFrontPreview] = useState('');
  const [backPreview, setBackPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [uid, setUid] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          const generateReferralCode = () => {
            const prefix = (user.displayName || 'REF').substring(0, 3).toUpperCase();
            const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
            return `${prefix}${suffix}`;
          };

          await setDoc(userRef, {
            uid: user.uid,
            phoneNumber: user.phoneNumber,
            name: user.displayName || 'Anonymous',
            referral: null,
            referralCode: generateReferralCode(),
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        setUid(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleFrontChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFrontFile(file);
      setFrontPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleBackChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBackFile(file);
      setBackPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (!frontFile || !backFile || !uid) {
      setError('Please upload both front and back Aadhaar images.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const frontRef = ref(storage, `kyc/${uid}/aadhaar_front_${uuidv4()}`);
      const backRef = ref(storage, `kyc/${uid}/aadhaar_back_${uuidv4()}`);

      await uploadBytes(frontRef, frontFile);
      await uploadBytes(backRef, backFile);

      const frontURL = await getDownloadURL(frontRef);
      const backURL = await getDownloadURL(backRef);

      await updateDoc(doc(db, 'users', uid), {
        aadhaarFrontUrl: frontURL,
        aadhaarBackUrl: backURL,
        kycStatus: 'Pending',
        kycSubmittedAt: new Date().toISOString(),
      });

      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    }

    setLoading(false);
  };

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        window.location.href = '/profile';
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="bg-white p-6 rounded-xl shadow-md text-center border-t-4 border-green-500 max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            ✅
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">KYC Submitted!</h2>
          <p className="text-gray-600">Your documents have been received and are under review.</p>
          <p className="text-sm text-gray-500 mt-3">Redirecting to profile in 3 seconds...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-indigo-100 rounded-full mx-auto flex items-center justify-center mb-2">
            <svg className="w-7 h-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Upload Aadhaar Front & Back</h2>
          <p className="text-sm text-gray-600 mt-1">For KYC verification, upload clear images of both sides.</p>
        </div>

        {error && <p className="text-sm text-red-600 mb-4 text-center">{error}</p>}

        {/* Front Preview */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700">Front Side</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFrontChange}
            className="w-full border px-3 py-2 rounded-md file:bg-indigo-100 file:text-indigo-700 file:border-0"
          />
          {frontPreview && (
            <img
              src={frontPreview}
              alt="Front Aadhaar"
              className="mt-2 w-full h-40 object-cover rounded-lg border"
            />
          )}
        </div>

        {/* Back Preview */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700">Back Side</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleBackChange}
            className="w-full border px-3 py-2 rounded-md file:bg-indigo-100 file:text-indigo-700 file:border-0"
          />
          {backPreview && (
            <img
              src={backPreview}
              alt="Back Aadhaar"
              className="mt-2 w-full h-40 object-cover rounded-lg border"
            />
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!frontFile || !backFile || loading}
          className={`w-full mt-4 py-3 rounded-lg font-semibold transition ${
            !frontFile || !backFile || loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {loading ? 'Submitting...' : 'Submit for Verification'}
        </button>

        <p className="text-xs text-gray-400 text-center mt-4">
          Make sure your Aadhaar images are clear and readable. Approval in 24–48 hours.
        </p>
      </div>
    </div>
  );
};

export default KycVerify;
