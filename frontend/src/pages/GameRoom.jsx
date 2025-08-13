import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useBlocker } from "react-router-dom";
import { io } from "socket.io-client";
import { Header } from "../Components/Header";
import { Footer } from "../Components/Footer";
import { getAuth } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export function GameRoom() {
  const { roomId } = useParams();
  const [players, setPlayers] = useState([]);
  const [gameLog, setGameLog] = useState([]);
  const [generatedRoomCode, setGeneratedRoomCode] = useState("");
  const [userEnteredRoomCode, setUserEnteredRoomCode] = useState("");
  const [myPlayerId, setMyPlayerId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [userName, setUserName] = useState("Anonymous");
  const [gameAmount, setGameAmount] = useState(0);
  const socketRef = useRef(null);
  const retryCount = useRef(0);
  const auth = getAuth();
  const user = auth.currentUser;

  // --- GameResultBox state ---
  const [gameResult, setGameResult] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showCancelOptions, setShowCancelOptions] = useState(false);
  const [showResultBox, setShowResultBox] = useState(true);
  const [timeLeft, setTimeLeft] = useState(20 * 60);
  const [showLeaveConfirmationModal, setShowLeaveConfirmationModal] = useState(false);
  const [nextLocation, setNextLocation] = useState(null);
  const navigate = useNavigate();

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => {
      if (gameStarted && !showSuccess) {
        setShowLeaveConfirmationModal(true);
        setNextLocation(nextLocation);
        return true; // Block navigation
      }
      return false; // Allow navigation
    }
  );


  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setUserName(userData.name || 'Anonymous');
          } else {
            setUserName('Anonymous');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUserName('Anonymous');
        }
      }
    };

    fetchUserData();

    const socket = io("https://ludo-p65v.onrender.com/", {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setMyPlayerId(socket.id);
      console.log(`[Client] Connected as ${socket.id}, joining room ${roomId} as ${userName}`);
      retryCount.current = 0; // Reset retry count on connect
      socket.emit("joinRoom", { roomId, userName, uid: user?.uid || '' });
    });

    socket.on("roomStateUpdate", (data) => {
      console.log(`[Client] Received roomStateUpdate:`, data);
      setPlayers(data.players.filter((p) => p && p.id));
      setGameAmount(data.amount || 0);
      if (data.generatedRoomCode && data.generatedRoomCode !== generatedRoomCode) {
        setGeneratedRoomCode(data.generatedRoomCode);
        setGameStarted(true);
        setGameLog((prev) => [...prev, `Room code received: ${data.generatedRoomCode}`]);
        if (data.roomCodeProvider === socket.id) {
          redirectToLudoKing(data.generatedRoomCode);
        }
      }
    });

    socket.on("userProvidedRoomCode", (code) => {
      console.log(`[Client] Received userProvidedRoomCode: ${code}`);
      setGameLog((prev) => [...prev, `Opponent sent room code: ${code}`]);
    });

    socket.on("matchFound", () => {
      console.log(`[Client] Match found for room ${roomId}`);
      setGameLog((prev) => [...prev, "Match found, waiting for Ludo room code..."]);
    });

    socket.on("playerJoined", (player) => {
      console.log(`[Client] Player joined:`, player);
      setPlayers((prev) => [...prev.filter((p) => p.socketId !== player.socketId), player]);
      setGameLog((prev) => [...prev, `${player.name} joined.`]);
    });

    socket.on("playerLeft", (player) => {
      console.log(`[Client] Player left:`, player);
      setPlayers((prev) => prev.filter((p) => p.socketId !== player.socketId));
      setGameLog((prev) => [...prev, `${player.name} left.`]);
      setGameStarted(false);
      setGeneratedRoomCode("");
      setIsRedirecting(false);
    });

    socket.on("roomNotFound", ({ message }) => {
      console.log(`[Client] Room not found: ${message}`);
      if (retryCount.current < 5) {
        retryCount.current += 1;
        const delay = Math.pow(2, retryCount.current) * 1000; // Exponential backoff
        setTimeout(() => {
          console.log(`[Client] Retrying joinRoom (${retryCount.current}/5) for room ${roomId}`);
          socket.emit("joinRoom", { roomId, userName, uid: user?.uid || '' });
        }, delay);
      } else {
        alert("Room not found. Please try again or create a new match.");
      }
    });

    socket.on("error", ({ message }) => {
      console.log(`[Client] Error: ${message}`);
      alert(message);
    });

    socket.on("disconnect", () => {
      console.log("[Client] Disconnected from server");
      setGameLog((prev) => [...prev, "Disconnected from server. Reconnecting..."]);
    });

    socket.on("reconnect", () => {
      console.log("[Client] Reconnected to server");
      setGameLog((prev) => [...prev, "Reconnected to server."]);
      retryCount.current = 0;
      socket.emit("joinRoom", { roomId, userName, uid: user?.uid || '' });
    });

    return () => {
      socket.off("connect");
      socket.off("roomStateUpdate");
      socket.off("userProvidedRoomCode");
      socket.off("matchFound");
      socket.off("playerJoined");
      socket.off("playerLeft");
      socket.off("roomNotFound");
      socket.off("error");
      socket.off("disconnect");
      socket.off("reconnect");
    };
  }, [roomId, user, userName]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
      console.log('BeforeUnload event prevented!'); // Log when prompt is triggered
    };

    if (gameStarted && !showSuccess) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      console.log('BeforeUnload listener ADDED. gameStarted:', gameStarted, 'showSuccess:', showSuccess);
    } else {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      console.log('BeforeUnload listener REMOVED. gameStarted:', gameStarted, 'showSuccess:', showSuccess);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      console.log('BeforeUnload cleanup: listener removed on unmount.');
    };
  }, [gameStarted, showSuccess]);

  const redirectToLudoKing = (roomCode) => {
    if (!roomCode) return;
    setIsRedirecting(true);
    console.log(`[Client] Redirecting to Ludo King with code ${roomCode}`);

    const webLink = `https://lk.gggred.com/?rmc=${roomCode}&gt=0`;
    const androidIntent =
      `intent://lk.gggred.com/?rmc=${roomCode}&gt=0` +
      `#Intent;scheme=https;package=com.ludo.king;end`;
    const ua = navigator.userAgent || "";

    if (/Android/i.test(ua)) {
      window.location.href = androidIntent;
    } else if (/iPhone|iPad|iPod/i.test(ua)) {
      window.location.href = webLink;
    } else {
      window.open(webLink, "_blank");
    }

    setTimeout(() => {
      if (document.hasFocus()) {
        setGameLog((prev) => [
          ...prev,
          "👆 If nothing happened, open Ludo King manually and paste the room code.",
        ]);
        setIsRedirecting(false);
      }
    }, 2000);
  };

  const handleSendRoomCode = () => {
    const trimmedCode = userEnteredRoomCode.trim();
    if (!trimmedCode) {
      alert("Please enter a room code.");
      return;
    }
    if (!/^\d{8}$/.test(trimmedCode)) {
      alert("Please enter a valid 8-digit Ludo King room code.");
      return;
    }

    console.log(`[Client] Sending room code ${trimmedCode} for room ${roomId}`);
    socketRef.current.emit("userProvidedRoomCode", { roomId, code: trimmedCode });
    setGeneratedRoomCode(trimmedCode);
    setGameStarted(true);
    setGameLog((prev) => [...prev, `Room code sent: ${trimmedCode}`]);
    redirectToLudoKing(trimmedCode);
    setUserEnteredRoomCode("");
  };

  const handleJoinWithRoomCode = () => {
    if (!generatedRoomCode) {
      alert("No room code available to join.");
      return;
    }
    redirectToLudoKing(generatedRoomCode);
  };

  const handleCopyRoomCode = () => {
    if (generatedRoomCode) {
      navigator.clipboard.writeText(generatedRoomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      console.log(`[Client] Copied room code ${generatedRoomCode}`);
    }
  };

  // --- GameResultBox functions ---
  const handleFileUpload = async (file) => {
    if (!file || !user) return;
    const fileRef = ref(storage, `gameProofs/${user.uid}/${Date.now()}.jpg`);
    setUploading(true);
    setUploadError('');
    try {
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);
    
      await updateDoc(doc(db, 'users', user.uid), {
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
    if (!user) return;
    setUploading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
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

  const handleConfirmLeaveGame = async () => {
    await handleCancelReasonSubmit('Left Game');
    setShowLeaveConfirmationModal(false);
    if (blocker) {
      blocker.proceed(); // Proceed with the blocked navigation
    } else if (nextLocation) { // Fallback, though blocker.proceed() should handle it
      navigate(nextLocation.pathname);
    }
  };

  const handleStayOnPage = () => {
    setShowLeaveConfirmationModal(false);
    if (blocker) {
      blocker.reset(); // Reset the navigation attempt
    }
    setNextLocation(null);
  };

  const renderLeaveConfirmationModal = () => {
    if (!showLeaveConfirmationModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full text-center">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Leave Game?</h3>
          <p className="text-gray-600 mb-6">
            Are you sure you want to leave the game? Your progress will be lost and it will be recorded as a cancellation.
          </p>
          <div className="flex justify-around gap-4">
            <button
              onClick={handleConfirmLeaveGame}
              className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700 transition-colors"
            >
              Leave Game
            </button>
            <button
              onClick={handleStayOnPage}
              className="flex-1 bg-gray-400 text-white py-2 rounded-lg font-bold hover:bg-gray-500 transition-colors"
            >
              Stay
            </button>
          </div>
        </div>
      </div>
    );
  };


  const myPlayer = players.find((p) => p.id === myPlayerId);
  const opponentPlayer = players.find((p) => p.id !== myPlayerId);

  const renderGameResultBox = () => {
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

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      <Header />
      {renderLeaveConfirmationModal()}
      <main className="flex-grow w-full flex flex-col items-center py-4 px-1 sm:px-3">
        <div className="w-full max-w-md md:max-w-2xl bg-white rounded-xl shadow-md md:shadow-lg md:my-8 md:px-8 py-6 px-2">
          <div className="flex items-center justify-between w-full p-3 rounded-2xl shadow bg-gradient-to-tr from-blue-100 via-white to-blue-50 mt-0 md:mt-2 gap-3">
            <div className="flex flex-col items-center w-1/3">
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-blue-400 rounded-full flex items-center justify-center text-white text-base sm:text-xl font-bold mb-1">
                {userName.charAt(0) || "U"}
              </div>
              <div className="font-semibold text-gray-800 text-sm sm:text-base">{userName}</div>
              <div className="text-xs text-gray-500">You</div>
            </div>
            <div className="w-1/3 text-center flex flex-col items-center">
              <div className="text-2xl sm:text-3xl font-bold text-red-600 select-none">VS</div>
              <div className="mt-1 sm:mt-2 text-green-700 font-semibold text-base sm:text-lg tracking-wide">
                ₹{gameAmount}
              </div>
            </div>
            <div className="flex flex-col items-center w-1/3">
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-orange-400 rounded-full flex items-center justify-center text-white text-base sm:text-xl font-bold mb-1">
              {/* problem in opponent name that should be checked*/}
                {opponentPlayer?.name?.charAt(0) || "O"}
              </div>
              <div className="font-semibold text-gray-800 text-sm sm:text-base">{opponentPlayer?.name || "Opponent"}</div>
              <div className="text-xs text-gray-500">Opponent</div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="order-1">
              <div className="bg-white rounded-lg shadow p-5 flex flex-col items-center h-full">
                <div className="font-bold text-gray-600 mb-1 text-md text-center">Ludo Room Code</div>
                <div className="font-mono text-2xl sm:text-3xl tracking-widest text-black mb-2 border px-4 py-2 rounded bg-gray-50 flex items-center justify-center gap-1 w-full max-w-xs">
                  {generatedRoomCode ? (
                    <>
                      <span>{generatedRoomCode}</span>
                      <button
                        className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
                        title="Copy Room Code"
                        onClick={handleCopyRoomCode}
                      >
                        📋
                      </button>
                    </>
                  ) : (
                    <span className="text-gray-400">Waiting for Ludo room code...</span>
                  )}
                </div>

                {generatedRoomCode && (
                  <button
                    onClick={handleJoinWithRoomCode}
                    className="w-full max-w-xs bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700 transition mb-3"
                    disabled={isRedirecting}
                  >
                    {isRedirecting ? "Opening Ludo King..." : "🎮 Join Ludo Game"}
                  </button>
                )}

                {!gameStarted && (
                  <div className="w-full max-w-xs border-t pt-3">
                    <p className="text-xs text-gray-600 mb-2 text-center">Paste room code from Ludo King:</p>
                    <input
                      type="text"
                      value={userEnteredRoomCode}
                      onChange={(e) => setUserEnteredRoomCode(e.target.value)}
                      placeholder="Enter Ludo Room Code"
                      className="border w-full text-lg py-2 px-3 rounded focus:ring focus:ring-blue-300 mb-3"
                      maxLength={8}
                    />
                    <button
                      onClick={handleSendRoomCode}
                      className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition"
                      disabled={isRedirecting}
                    >
                      {isRedirecting ? "Opening Ludo King..." : "Join & Play"}
                    </button>
                  </div>
                )}

                {copied && (
                  <div className="mt-4 px-3 py-2 rounded bg-green-600 text-white font-semibold shadow text-center text-sm sm:text-base">
                    Room code copied! Paste it in Ludo King if needed!
                  </div>
                )}
                {isRedirecting && (
                  <div className="mt-4 px-3 py-2 rounded bg-blue-600 text-white font-semibold shadow text-center text-sm sm:text-base animate-pulse">
                    Redirecting to Ludo King… If nothing happens, open the app and enter the code.
                  </div>
                )}
              </div>
            </div>

            {renderGameResultBox()}
          </div>

          <div className="mt-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="font-semibold mb-2 text-base text-center">How to Play:</div>
              <ol className="text-sm text-gray-700 space-y-1">
                <li>1. Create a room in Ludo King (Play with Friends) and copy its code.</li>
                <li>2. Paste the code above and click “Join &amp; Play”.</li>
                <li>3. Ludo King will open directly into the private room.</li>
                <li>4. Return here and submit your result when done.</li>
              </ol>
            </div>
          </div>

          <div className="mt-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="font-semibold mb-1 text-base sm:text-lg">Game Events</div>
              <ul className="max-h-32 sm:max-h-40 overflow-y-auto text-xs sm:text-sm">
                {gameLog.length > 0
                  ? gameLog.slice(-8).map((log, idx) => (
                      <li className="text-gray-700 py-0.5" key={idx}>{
                        log
                      }</li>
                    ))
                  : <li className="text-gray-400">Waiting for events...</li>}
              </ul>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
