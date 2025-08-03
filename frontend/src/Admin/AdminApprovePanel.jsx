// src/components/AdminApprovePanel.jsx
import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";

export function AdminApprovePanel() {
  const [images, setImages] = useState([]);

  const fetchImages = async () => {
    const snapshot = await getDocs(collection(db, "uploads"));
    const items = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        approved: data.approved,
        filename: data.filename, // you must save filename during upload
      };
    });
    setImages(items);
  };

  const approveImage = async (id) => {
    await updateDoc(doc(db, "uploads", id), { approved: true });
    fetchImages();
  };

  const rejectImage = async (id) => {
    // Just delete from Firestore – we assume client uploaded to "uploads/filename"
    await deleteDoc(doc(db, "uploads", id));
    fetchImages();
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const getImageURL = (filename) => {
    const projectId = "your-project-id"; // 🔁 Replace this with your actual Firebase project ID
    return `https://firebasestorage.googleapis.com/v0/b/${projectId}.appspot.com/o/uploads%2F${encodeURIComponent(
      filename
    )}?alt=media`;
  };

  return (
    <div className="max-w-5xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold mb-6 text-center">🧑‍💼 Admin Approval Panel</h2>
      {images.length === 0 ? (
        <p className="text-center text-gray-500">No uploads found.</p>
      ) : (
        <div className="grid md:grid-cols-3 sm:grid-cols-2 gap-6">
          {images.map((img) => (
            <div
              key={img.id}
              className="border rounded-lg p-3 shadow hover:shadow-md transition"
            >
              <img
                src={getImageURL(img.filename)}
                alt="Upload"
                className="rounded mb-2 w-full h-52 object-cover"
              />
              <p className="text-sm mb-1 text-gray-700">
                Status:{" "}
                <span
                  className={img.approved ? "text-green-600" : "text-yellow-600"}
                >
                  {img.approved ? "✅ Approved" : "⏳ Pending"}
                </span>
              </p>
              {!img.approved && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => approveImage(img.id)}
                    className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => rejectImage(img.id)}
                    className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
