import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';

const CancellationApprovalList = () => {
  const [cancellationRequests, setCancellationRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const socket = io("https://ludo-ic57.onrender.com/"); // Connect to your backend socket

  const fetchCancellationRequests = () => {
    setLoading(true);
    setError(null);
    socket.emit('admin:fetchCancellationRequests');
  };

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Admin connected to socket server');
      fetchCancellationRequests();
    });

    socket.on('admin:cancellationRequests', (requests) => {
      console.log('Received cancellation requests:', requests);
      setCancellationRequests(requests);
      setLoading(false);
    });

    socket.on('admin:cancellationApprovalResult', ({ success, message }) => {
      if (success) {
        toast.success(message);
        fetchCancellationRequests(); // Re-fetch to update the list
      } else {
        toast.error(message);
      }
    });

    socket.on('disconnect', () => {
      console.log('Admin disconnected from socket server');
    });

    socket.on('error', (err) => {
      console.error('Socket error:', err);
      setError(err.message || 'An unknown socket error occurred.');
      toast.error(err.message || 'An unknown socket error occurred.');
    });

    return () => {
      socket.off('connect');
      socket.off('admin:cancellationRequests');
      socket.off('admin:cancellationApprovalResult');
      socket.off('disconnect');
      socket.off('error');
      socket.disconnect(); // Disconnect socket on component unmount
    };
  }, []);

  const handleApprove = (matchId) => {
    socket.emit('admin:approveCancellation', { matchId });
  };

  const handleReject = (matchId) => {
    socket.emit('admin:rejectCancellation', { matchId });
  };

  if (loading) {
    return <div className="p-4 text-center">Loading cancellation requests...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Pending Cancellation Approvals</h3>
      {cancellationRequests.length === 0 ? (
        <p>No pending cancellation requests.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="py-2 px-4 text-left text-sm font-medium text-gray-600">Match ID</th>
                <th className="py-2 px-4 text-left text-sm font-medium text-gray-600">Player A</th>
                <th className="py-2 px-4 text-left text-sm font-medium text-gray-600">Player B</th>
                <th className="py-2 px-4 text-left text-sm font-medium text-gray-600">Amount</th>
                <th className="py-2 px-4 text-left text-sm font-medium text-gray-600">Reason</th>
                <th className="py-2 px-4 text-left text-sm font-medium text-gray-600">Canceling Player</th>
                <th className="py-2 px-4 text-left text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cancellationRequests.map((request) => (
                <tr key={request.id} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="py-2 px-4 text-sm text-gray-800">{request.id}</td>
                  <td className="py-2 px-4 text-sm text-gray-800">{request.playerA.name} ({request.playerA.uid})</td>
                  <td className="py-2 px-4 text-sm text-gray-800">{request.playerB.name} ({request.playerB.uid})</td>
                  <td className="py-2 px-4 text-sm text-gray-800">₹{request.amount}</td>
                  <td className="py-2 px-4 text-sm text-gray-800">{request.cancelReason}</td>
                  <td className="py-2 px-4 text-sm text-gray-800">
                    {request.cancelingPlayerUid === request.playerA.uid ? request.playerA.name : request.playerB.name}
                  </td>
                  <td className="py-2 px-4 text-sm">
                    <button
                      onClick={() => handleApprove(request.id)}
                      className="bg-green-500 text-white px-3 py-1 rounded-md text-xs font-medium hover:bg-green-600 mr-2"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded-md text-xs font-medium hover:bg-red-600"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CancellationApprovalList;