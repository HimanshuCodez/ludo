import React, { useState, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function GameResultComponent({ gameStarted }) {
  const [gameResult, setGameResult] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [userId, setUserId] = useState(null);
  const [showCancelOptions, setShowCancelOptions] = useState(false);
  const [showResultBox, setShowResultBox] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20 * 60);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    let timer;
    if (gameStarted) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setShowResultBox(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameStarted]);

  const handleFileUpload = async (file) => {
    if (!file || !userId) return;
    const fileRef = ref(storage, `gameProofs/${userId}/${Date.now()}.jpg`);
    setUploading(true);
    setUploadError('');
    try {
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);
      await updateDoc(doc(db, 'users', userId), {
        lastGameProofUrl: downloadURL,
        lastGameResult: 'I WON',
        lastGameAt: new Date().toISOString(),
      });
      setUploading(false);
      setShowSuccess(true);
    } catch (err) {
      console.error(err);
      setUploadError('Upload failed. Please try again.');
      setUploading(false);
    }
  };

  const handleGameResult = (result) => {
    setGameResult(result);
    if (result === 'I WON') {
      // Show upload prompt
    } else if (result === 'I LOST') {
      setTimeout(() => setShowSuccess(true), 500);
    } else if (result === 'CANCEL') {
      setShowCancelOptions(true);
    }
  };

  const handleCancelReasonSubmit = async (reason) => {
    if (!userId) return;
    setUploading(true);
    try {
      await updateDoc(doc(db, 'users', userId), {
        lastGameResult: 'Canceled',
        lastGameCancelReason: reason,
        lastGameAt: new Date().toISOString(),
      });
      setGameResult('CANCEL');
      setShowSuccess(true);
      setShowCancelOptions(false);
    } catch (error) {
      console.error("Error submitting cancellation reason: ", error);
      setUploadError('Failed to submit reason. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const resetAll = () => {
    setShowSuccess(false);
    setShowResultBox(false);
    setGameResult(null);
    setTimeLeft(20 * 60);
    setUploadError('');
    setShowCancelOptions(false);
  };

  if (gameResult === 'I WON' && !showSuccess) {
    return (
      <div className="order-2">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Upload Screenshot</h2>
          <p className="text-sm text-gray-600 mb-4">
            Please upload a screenshot of your winning screen in Ludo King.
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload(e.target.files[0])}
            className="mb-4"
            disabled={uploading}
          />
          {uploadError && <div className="text-red-600 text-sm mb-2">{uploadError}</div>}
          {uploading ? (
            <p className="text-blue-600 text-sm">Uploading...</p>
          ) : (
            <p className="text-sm text-gray-500">Only image files allowed</p>
          )}
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="order-2">
        <div className="bg-white rounded-lg shadow p-5 flex flex-col items-center h-full">
          <div className="mb-6 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {gameResult === 'I WON' ? 'Congratulations! 🎉' : gameResult === 'I LOST' ? 'Better Luck Next Time! 💪' : 'Result Submitted'}
            </h2>
            <p className="text-gray-600 mb-4">
              {gameResult === 'I WON'
                ? 'Your winning screenshot has been recorded!'
                : gameResult === 'I LOST'
                ? 'Your result has been recorded. Keep practicing!'
                : 'Your cancellation has been recorded.'}
            </p>
          </div>
          <button
            onClick={resetAll}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Play Another Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-2">
      <div className="bg-white rounded-lg shadow p-5 flex flex-col items-center h-full">
        {showResultBox && !showSuccess && !showCancelOptions && (
          <>
            <div className="mb-2 font-bold text-lg text-center">🎯 Game Result</div>
            <p className="text-gray-700 text-xs sm:text-sm text-center mb-4">
              After playing in Ludo King, return here and submit your result.
            </p>
            <div className="flex w-full gap-2">
              <button onClick={() => handleGameResult('I WON')} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700">I WON</button>
              <button onClick={() => handleGameResult('I LOST')} className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700">I LOST</button>
              <button onClick={() => handleGameResult('CANCEL')} className="flex-1 bg-gray-400 text-white py-2 rounded-lg font-bold hover:bg-gray-500">CANCEL</button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-3">
              ⏰ Please submit your result within 5 minutes of game completion
            </p>
          </>
        )}

        {showCancelOptions && (
          <div className="w-full">
            <h3 className="font-bold text-lg text-center mb-3">Reason for Cancellation</h3>
            <div className="flex flex-col gap-2">
              <button onClick={() => handleCancelReasonSubmit('Abusing')} className="bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600">Abusing</button>
              <button onClick={() => handleCancelReasonSubmit('Opponent quit')} className="bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600">Opponent quit</button>
              <button onClick={() => handleCancelReasonSubmit('Network issue')} className="bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600">Network issue</button>
              <button onClick={() => handleCancelReasonSubmit("I don't want to play")} className="bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600">I don't want to play</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
