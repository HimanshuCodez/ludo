// src/pages/AdminKycPanel.jsx
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";

const AdminKycPanel = () => {
  const [kycRequests, setKycRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    const querySnapshot = await getDocs(collection(db, "kyc_requests"));
    const data = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    setKycRequests(data);
    setLoading(false);
  };

  const handleUpdateStatus = async (id, newStatus) => {
    await updateDoc(doc(db, "kyc_requests", id), {
      status: newStatus,
    });
    setKycRequests(prev =>
      prev.map(item =>
        item.id === id ? { ...item, status: newStatus } : item
      )
    );
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">🛂 Admin KYC Review</h2>

      {loading ? (
        <p className="text-center text-gray-500">Loading requests...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {kycRequests.length === 0 && (
            <p className="text-center col-span-full text-gray-500">No KYC submissions yet.</p>
          )}

          {kycRequests.map((req) => (
            <div key={req.id} className="bg-white p-4 rounded-xl shadow-md">
              <img
                src={req.aadhaarUrl}
                alt="Aadhaar"
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              <p><strong>UID:</strong> {req.uid}</p>
              <p>
                <strong>Status:</strong>{" "}
                <span className={`font-semibold ${
                  req.status === "approved" ? "text-green-600"
                  : req.status === "rejected" ? "text-red-500"
                  : "text-yellow-600"
                }`}>
                  {req.status}
                </span>
              </p>

              <div className="mt-4 flex justify-between gap-2">
                <button
                  onClick={() => handleUpdateStatus(req.id, "approved")}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  ✅ Approve
                </button>
                <button
                  onClick={() => handleUpdateStatus(req.id, "rejected")}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  ❌ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminKycPanel;
