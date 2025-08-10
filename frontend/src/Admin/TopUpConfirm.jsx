import { collection, getDocs, doc, updateDoc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase'; // Adjust path to your firebase config
import React, { useState, useEffect } from 'react'
import { 
  Check, 
  X, 
  Eye, 
  Calendar, 
  User, 
  DollarSign, 
  MessageSquare,
  Clock,
  ImageIcon,
  ZoomIn,
  ZoomOut,
  RotateCw,
  IndianRupee
} from 'lucide-react'

const TopUpConfirm = () => {
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [comment, setComment] = useState('')
  const [imageZoom, setImageZoom] = useState(100)
  const [imageRotation, setImageRotation] = useState(0)
  const [topUpRequests, setTopUpRequests] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchTopUpRequests = async () => {
      const topUpsQuery = query(collection(db, "top-ups"), where("status", "==", "pending"));
      const querySnapshot = await getDocs(topUpsQuery);
      
      const requestsPromises = querySnapshot.docs.map(async (d) => {
        const requestData = d.data();
        const timestamp = requestData.createdAt ? new Date(requestData.createdAt).toLocaleString() : 'N/A';

        const userRef = doc(db, 'users', requestData.userId);
        const userSnap = await getDoc(userRef);
        const userName = userSnap.exists() ? userSnap.data().name : 'Unknown User';
        
        return { 
          id: d.id, 
          ...requestData,
          userName: userName,
          timestamp: timestamp,
          paymentMethod: 'Online Payment'
        };
      });

      const requests = await Promise.all(requestsPromises);
      setTopUpRequests(requests);
    };

    fetchTopUpRequests();
  }, []);

  const handleApprove = async (request) => {
    try {
      const userRef = doc(db, 'users', request.userId);
      const userSnap = await getDoc(userRef);
      const currentChips = parseFloat(userSnap.data()?.depositChips) || 0;

      await updateDoc(userRef, {
        depositChips: currentChips + request.amount,
        updatedAt: new Date().toISOString(),
      });

      const topUpRef = doc(db, 'top-ups', request.id);
      await updateDoc(topUpRef, {
        status: 'approved',
        adminComment: comment,
      });

      alert(`Request ${request.id} approved!`)
      setComment('')
      setSelectedRequest(null)
      setTopUpRequests(topUpRequests.filter(r => r.id !== request.id));
    } catch (error) {
      console.error("Error approving request: ", error);
      alert("Failed to approve request.")
    }
  }

  const handleReject = async (requestId) => {
    try {
      const topUpRef = doc(db, 'top-ups', requestId);
      await updateDoc(topUpRef, {
        status: 'rejected',
        adminComment: comment,
      });

      alert(`Request ${requestId} rejected!`)
      setComment('')
      setSelectedRequest(null)
      setTopUpRequests(topUpRequests.filter(r => r.id !== requestId));
    } catch (error) {
      console.error("Error rejecting request: ", error);
      alert("Failed to reject request.")
    }
  }

  const handleViewScreenshot = (request) => {
    setSelectedRequest(request)
    setImageZoom(100)
    setImageRotation(0)
    setComment('')
  }

  const adjustZoom = (delta) => {
    setImageZoom(prev => Math.max(25, Math.min(200, prev + delta)))
  }

  const rotateImage = () => {
    setImageRotation(prev => (prev + 90) % 360)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Top-Up Confirmations</h1>
          <p className="text-gray-600">Review and approve user payment screenshots</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Request List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-blue-500" />
                  Pending Requests ({topUpRequests.length})
                </h2>
              </div>
              
              <div className="max-h-[70vh] overflow-y-auto">
                {topUpRequests.map((request) => (
                  <div 
                    key={request.id}
                    className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedRequest?.id === request.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                    onClick={() => handleViewScreenshot(request)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 flex items-center">
                          <User className="w-4 h-4 mr-1 text-gray-500" />
                          {request.userName}
                        </h3>
                        <p className="text-sm text-gray-500 break-all">{request.userId}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600 flex items-center">
                          <IndianRupee className="w-4 h-4" />
                          {request.amount}
                        </p>
                        <span className="inline-block mt-1 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                          {request.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 mb-2 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {request.timestamp}
                    </div>
                    
                    <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block">
                      {request.paymentMethod}
                    </div>
                    
                    <button className="mt-2 flex items-center text-sm text-blue-600 hover:text-blue-800 font-semibold">
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Screenshot Viewer & Actions */}
          <div className="lg:col-span-2">
            {selectedRequest ? (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden sticky top-6">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold">{selectedRequest.userName}</h2>
                      <p className="opacity-90">Top-up Request: ₹{selectedRequest.amount}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm opacity-90">{selectedRequest.paymentMethod}</p>
                      <p className="text-xs opacity-75">{selectedRequest.timestamp}</p>
                    </div>
                  </div>
                </div>

                {/* Image Controls */}
                <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ImageIcon className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Payment Screenshot</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => adjustZoom(-25)} className="p-2 rounded-lg bg-white hover:bg-gray-100 shadow-sm transition-colors"><ZoomOut className="w-4 h-4" /></button>
                    <span className="text-sm text-gray-600 px-2">{imageZoom}%</span>
                    <button onClick={() => adjustZoom(25)} className="p-2 rounded-lg bg-white hover:bg-gray-100 shadow-sm transition-colors"><ZoomIn className="w-4 h-4" /></button>
                    <button onClick={rotateImage} className="p-2 rounded-lg bg-white hover:bg-gray-100 shadow-sm transition-colors"><RotateCw className="w-4 h-4" /></button>
                  </div>
                </div>

                {/* Screenshot */}
                <div className="p-4 bg-gray-800 flex justify-center items-center" style={{ minHeight: '300px' }}>
                  <div className="relative overflow-hidden rounded-lg shadow-lg bg-black cursor-pointer" onClick={() => setIsModalOpen(true)}>
                    <img
                      src={selectedRequest.paymentProof}
                      alt="Payment Screenshot"
                      className="transition-transform duration-300"
                      style={{
                        transform: `scale(${imageZoom / 100}) rotate(${imageRotation}deg)`,
                        maxWidth: '100%',
                        maxHeight: '50vh',
                        objectFit: 'contain',
                      }}
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                      <Eye className="w-10 h-10 text-white" />
                      <span className="ml-2 text-white font-bold">View Fullscreen</span>
                    </div>
                  </div>
                </div>

                {/* Comment Section */}
                <div className="p-6 border-b border-gray-100">
                  <label className="block text-sm font-medium text-gray-700 mb-2  items-center"><MessageSquare className="w-4 h-4 mr-2" />Admin Comment (Optional)</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment about this request..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows="2"
                  />
                </div>

                {/* Action Buttons */}
                <div className="p-6 bg-gray-50 flex space-x-4">
                  <button onClick={() => handleApprove(selectedRequest)} className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center"><Check className="w-5 h-5 mr-2" />Approve Request</button>
                  <button onClick={() => handleReject(selectedRequest.id)} className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center"><X className="w-5 h-5 mr-2" />Reject Request</button>
                </div>
              </div>
            ) : (
              /* Empty State */
              <div className="bg-white rounded-xl shadow-lg p-12 text-center sticky top-6">
                <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Select a Request</h3>
                <p className="text-gray-500">Choose a top-up request from the list to review the payment screenshot</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {isModalOpen && selectedRequest && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="relative max-w-5xl max-h-full p-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedRequest.paymentProof}
              alt="Payment Screenshot"
              className="w-auto h-auto shadow-2xl rounded-lg"
              style={{ maxHeight: '90vh', maxWidth: '90vw' }}
            />
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute -top-2 -right-2 text-white bg-gray-800/80 rounded-full p-2 hover:bg-red-600 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TopUpConfirm