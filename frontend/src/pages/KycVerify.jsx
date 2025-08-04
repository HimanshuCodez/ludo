import React, { useState, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { storage, db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { v4 as uuidv4 } from 'uuid';

const KycVerify = () => {
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [uid, setUid] = useState(null);
  const [userData, setUserData] = useState({});

  // Watch for logged-in user
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
        } else {
          setUserData(userSnap.data());
        }
      } else {
        setUid(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAadhaarFile(file);
      setPreview(URL.createObjectURL(file));
      setError('');
    } else {
      setError('Please select an image file.');
    }
  };

  const handleSubmit = async () => {
    if (!aadhaarFile) {
      setError('Please upload an Aadhaar image.');
      return;
    }

    if (!uid) {
      setError('User not authenticated.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const uniqueFileName = `aadhaar_${uid}_${uuidv4()}`;
      const storageRef = ref(storage, `kyc/${uid}/${uniqueFileName}`);
      await uploadBytes(storageRef, aadhaarFile);
      const downloadURL = await getDownloadURL(storageRef);

      const userRef = doc(db, 'users', uid);

      // Add Aadhaar info to existing user document
      await updateDoc(userRef, {
        aadhaarUrl: downloadURL,
        kycStatus: 'Pending',
        kycSubmittedAt: new Date().toISOString(),
      });

      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError('Failed to upload document. Please try again.');
    }

    setLoading(false);
  };

  // Redirect on success
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border-t-4 border-green-500">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">KYC Submitted Successfully!</h2>
            <p className="text-gray-600">Your document has been received and is under review.</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">
              <strong>Status:</strong> Pending Review<br />
              <strong>Expected Time:</strong> 24-48 hours
            </p>
          </div>
          <p className="text-sm text-gray-500 mb-4">Redirecting to profile in 3 seconds...</p>
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">KYC Verification</h1>
          <p className="text-gray-600">Upload your Aadhaar card for verification</p>
        </div>

        {preview && (
          <div className="mb-6">
            <img
              src={preview}
              alt="Aadhaar Preview"
              className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
            />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
            <p className="text-red-700 text-sm text-center">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Aadhaar Card Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer cursor-pointer border border-gray-300 rounded-lg"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !aadhaarFile}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            loading || !aadhaarFile
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </div>
          ) : (
            'Submit for Verification'
          )}
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          Your document will be processed securely and reviewed within 24-48 hours.
        </p>
      </div>
    </div>
  );
};

export default KycVerify;
