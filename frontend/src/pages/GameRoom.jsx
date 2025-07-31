import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { Header } from "../Components/Header";
import { Footer } from "../Components/Footer";

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

  useEffect(() => {
    const socket = io("https://ludo-p65v.onrender.com/", { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setMyPlayerId(socket.id);
      const userName = "User_" + Math.floor(Math.random() * 1000);
      socket.emit("joinRoom", { roomId, userName });
    });

    socket.on("roomStateUpdate", (data) => {
      setPlayers(data.players);
      setGeneratedRoomCode(data.generatedRoomCode || "");
      if (data.generatedRoomCode && !gameStarted) {
        setGameStarted(true);
        setGameLog((prev) => [...prev, `Room code received: ${data.generatedRoomCode}`]);
        redirectToLudoKing(data.generatedRoomCode);
      }
    });

    socket.on("matchFound", () => {
      setGameLog((prev) => [...prev, "Match found, waiting for Ludo room code..."]);
    });

    socket.on("userProvidedRoomCode", (code) => {
      setGeneratedRoomCode(code);
      setGameStarted(true);
      setGameLog((prev) => [...prev, `Opponent sent room code: ${code}`]);
      redirectToLudoKing(code);
    });

    socket.on("playerJoined", (player) => {
      setPlayers((prev) => [...prev, player]);
      setGameLog((prev) => [...prev, `${player.name} joined.`]);
    });

    socket.on("playerLeft", (player) => {
      setPlayers((prev) => prev.filter((p) => p.socketId !== player.socketId));
      setGameLog((prev) => [...prev, `${player.name} left.`]);
      setGameStarted(false);
      setGeneratedRoomCode("");
      setIsRedirecting(false);
    });

    socket.on("error", ({ message }) => {
      alert(message);
    });

    socket.on("disconnect", () => {
      console.log("[Socket] Disconnected");
    });

    return () => socket.disconnect();
  }, [roomId]);

  const redirectToLudoKing = (roomCode) => {
    if (!roomCode) return;
    setIsRedirecting(true);

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
          "👆 If nothing happened, open Ludo King manually and paste the room code."
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
    }
  };

  const handleGameResult = (result) => {
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
          {/* VS Block */}
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

          {/* Room Code & Join Controls */}
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

            <div className="order-2">
              <div className="bg-white rounded-lg shadow p-5 flex flex-col items-center h-full">
                <div className="mb-2 font-bold text-lg text-center">Game Result</div>
                <p className="text-gray-700 text-xs sm:text-sm text-center mb-4">
                  After playing in Ludo King, return here and submit your result.
                </p>
                <div className="flex w-full gap-2">
                  <button
                    onClick={() => handleGameResult("I WON")}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700"
                    disabled={!gameStarted}
                  >
                    I WON
                  </button>
                  <button
                    onClick={() => handleGameResult("I LOST")}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700"
                    disabled={!gameStarted}
                  >
                    I LOST
                  </button>
                  <button
                    onClick={() => handleGameResult("CANCEL")}
                    className="flex-1 bg-gray-400 text-white py-2 rounded-lg font-bold hover:bg-gray-500"
                    disabled={!gameStarted}
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            </div>
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