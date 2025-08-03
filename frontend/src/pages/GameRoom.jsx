import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { Header } from "../Components/Header";
import { Footer } from "../Components/Footer";
import GameResultBox from "../Components/GameResultBox";

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
  const socketRef = useRef(null);
  const retryCount = useRef(0);

  useEffect(() => {
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
      const userName = "User_" + Math.floor(Math.random() * 1000);
      console.log(`[Client] Connected as ${socket.id}, joining room ${roomId} as ${userName}`);
      retryCount.current = 0; // Reset retry count on connect
      socket.emit("joinRoom", { roomId, userName });
    });

    socket.on("roomStateUpdate", (data) => {
      console.log(`[Client] Received roomStateUpdate:`, data);
      setPlayers(data.players.filter((p) => p && p.id));
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
        const delay = Math.pow(2, retryCount.current) * 1000; // Exponential backoff: 2s, 4s, 8s, 16s, 32s
        setTimeout(() => {
          const userName = "User_" + Math.floor(Math.random() * 1000);
          console.log(`[Client] Retrying joinRoom (${retryCount.current}/5) for room ${roomId}`);
          socket.emit("joinRoom", { roomId, userName });
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
      const userName = "User_" + Math.floor(Math.random() * 1000);
      socket.emit("joinRoom", { roomId, userName });
    });

    return () => {
      // Remove socket.disconnect() to persist connection
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
  }, [roomId]);

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

  const handleGameResult = (result) => {
    console.log(`[Client] Submitting game result ${result} for room ${roomId}`);
    socketRef.current.emit("submitGameResult", { roomId, result });
    setGameLog((prev) => [...prev, `Game Result Submitted: ${result}`]);
    alert(`You submitted: ${result}. Awaiting opponent's submission.`);
  };

  const myPlayer = players.find((p) => p.socketId === myPlayerId);
  const opponentPlayer = players.find((p) => p.socketId !== myPlayerId);
  const gameAmount = myPlayer?.amount || "N/A";

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      <Header />
      <main className="flex-grow w-full flex flex-col items-center py-4 px-1 sm:px-3">
        <div className="w-full max-w-md md:max-w-2xl bg-white rounded-xl shadow-md md:shadow-lg md:my-8 md:px-8 py-6 px-2">
          <div className="flex items-center justify-between w-full p-3 rounded-2xl shadow bg-gradient-to-tr from-blue-100 via-white to-blue-50 mt-0 md:mt-2 gap-3">
            <div className="flex flex-col items-center w-1/3">
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-blue-400 rounded-full flex items-center justify-center text-white text-base sm:text-xl font-bold mb-1">
                {myPlayer?.name?.charAt(0) || "U"}
              </div>
              <div className="font-semibold text-gray-800 text-sm sm:text-base">{myPlayer?.name || "You"}</div>
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

            <GameResultBox gameStarted={true} />
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
                      <li className="text-gray-700 py-0.5" key={idx}>
                        {log}
                      </li>
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