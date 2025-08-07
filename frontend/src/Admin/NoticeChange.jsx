import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const NoticeChange = () => {
  const [notice, setNotice] = useState('');
  const [newNotice, setNewNotice] = useState('');
  const [message, setMessage] = useState('');
  const noticeRef = doc(db, 'notice', 'main');

  useEffect(() => {
    const fetchNotice = async () => {
      let noticeDoc = await getDoc(noticeRef);
      if (!noticeDoc.exists()) {
        // Document doesn't exist, so create it with a default message
        const defaultNotice = "Welcome! This is the default notice. Please edit it.";
        await setDoc(noticeRef, { message: defaultNotice });
        noticeDoc = await getDoc(noticeRef); // Re-fetch the document
      }
      const noticeData = noticeDoc.data();
      setNotice(noticeData.message);
      setNewNotice(noticeData.message);
    };
    fetchNotice();
  }, []);

  const handleUpdateNotice = async () => {
    setMessage('');
    try {
      await updateDoc(noticeRef, {
        message: newNotice,
      });
      setMessage('Notice updated successfully!');
      setNotice(newNotice);
    } catch (error) {
      console.error('Error updating notice: ', error);
      setMessage('Failed to update notice.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-start justify-center">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Change Notice</h2>
        {message && <p className={`mb-4 ${message.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>}
        <div className="mb-4">
          <label htmlFor="notice" className="block text-sm font-medium text-gray-700">Edit Notice</label>
          <textarea
            id="notice"
            rows="4"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={newNotice}
            onChange={(e) => setNewNotice(e.target.value)}
          />
        </div>
        <button
          onClick={handleUpdateNotice}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Update Notice
        </button>
      </div>
    </div>
  );
};

export default NoticeChange;