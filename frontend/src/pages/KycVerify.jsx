
import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, storage } from '../firebase'; // Adjusted for storage
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

const KycVerify = () => {
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

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
    const user = auth.currentUser;
    if (!user) {
      setError('Please log in to submit KYC verification.');
      return;
    }

    if (!aadhaarFile) {
      setError('Please upload an Aadhaar image.');
      return;
    }

    setLoading(true);
    setError('');
    console.log('User:', user.uid, 'Starting upload process'); // Debug log

    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Image = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result.split(',')[1]); // Get base64 data without prefix
        reader.readAsDataURL(aadhaarFile);
      });
      console.log('Base64 conversion successful, length:', base64Image.length);

      // Upload to Firebase Storage
      const fileName = `${user.uid}_${uuidv4()}`;
      const storageRef = ref(storage, `kyc/${fileName}`);
      console.log('Storage reference created:', storageRef.fullPath); // Debug log
      await uploadString(storageRef, base64Image, 'base64');
      const downloadURL = await getDownloadURL(storageRef);
      console.log('Storage upload successful, URL:', downloadURL);

      // Store in Firestore
      console.log('Attempting Firestore write with URL:', downloadURL);
      const docRef = await addDoc(collection(db, 'kyc_requests'), {
        uid: user.uid,
        aadhaarUrl: downloadURL,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      console.log('Firestore write successful, Document ID:', docRef.id);

      setSuccess(true);
      setAadhaarFile(null);
      setPreview('');
    } catch (err) {
      console.error('[KycVerify] Upload Error:', err);
      setError(`Upload failed: ${err.code ? `${err.code}: ` : ''}${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center p-4">
      <div className="bg-white shadow-lg rounded-xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-4 text-indigo-700">Verify your Aadhaar</h1>

        {preview && (
          <img src={preview} alt="Preview" className="w-full h-56 object-cover rounded-lg mb-4 border" />
        )}

        {error && (
          <p className="text-red-600 text-sm mb-4 text-center">{error}</p>
        )}

        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="mb-4 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        />

        <button
          onClick={handleSubmit}
          disabled={loading || !aadhaarFile}
          className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition ${
            loading || !aadhaarFile ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Uploading...' : 'Submit for Verification'}
        </button>

        {success && (
          <p className="text-green-600 text-sm mt-4 text-center">✅ Aadhaar submitted successfully!</p>
        )}
      </div>
    </div>
  );
};

export default KycVerify;
