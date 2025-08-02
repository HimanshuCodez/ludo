import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase'; // Adjust path
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
    if (!aadhaarFile) {
      setError('Please upload an Aadhaar image.');
      return;
    }

    setLoading(true);
    setError('');
    const uid = auth.currentUser?.uid || 'guest'; // Should be logged in

    try {
      // Convert file to base64 for Cloudinary upload
      const reader = new FileReader();
      const base64Image = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(aadhaarFile);
      });

      // Upload to Cloudinary
    const response = await fetch(
  `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      file: base64Image,
      upload_preset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
      public_id: `kyc/${uid}_${uuidv4()}`,
    }),
  }
);


      const result = await response.json();
      if (result.error) {
        throw new Error(result.error.message);
      }

      const downloadURL = result.secure_url;

      // Store in Firestore
      await addDoc(collection(db, 'kyc_requests'), {
        uid,
        aadhaarUrl: downloadURL,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      setSuccess(true);
      setAadhaarFile(null);
      setPreview('');
    } catch (err) {
      console.error('[KycVerify] Upload Error:', err);
      setError('Upload failed. Please try again.');
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