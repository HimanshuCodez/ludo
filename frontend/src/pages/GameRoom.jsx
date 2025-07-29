
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
    const socketRef = useRef(null);

    useEffect(() => {
        const socket = io("http://localhost:5000/", { transports: ["websocket"] });
        socketRef.current = socket;

        socket.on("connect", () => {
            setMyPlayerId(socket.id);
            const userName = "User_" + Math.floor(Math.random() * 1000);
            socket.emit("joinRoom", { roomId, userName });
        });

        socket.on("roomStateUpdate", (data) => {
            setPlayers(data.players);
            setGeneratedRoomCode(data.generatedRoomCode || "");
            if (data.generatedRoomCode) {
                setGameStarted(true);
                setGameLog(prev => [...prev, `Room code received: ${data.generatedRoomCode}`]);
                // Attempt to redirect to Ludo King
                attemptLudoKingRedirect(data.generatedRoomCode);
            }
        });

        socket.on("matchFound", (data) => {
            setGameLog(prev => [...prev, "Match found, waiting for Ludo room code..."]);
        });

        socket.on("userProvidedRoomCode", (code) => {
            setGeneratedRoomCode(code);
            setGameStarted(true);
            setGameLog(prev => [...prev, `Opponent sent room code: ${code}`]);
            // Attempt to redirect to Ludo King
            attemptLudoKingRedirect(code);
        });

        socket.on("playerJoined", (player) => {
            setPlayers(prev => [...prev, player]);
            setGameLog(prev => [...prev, `${player.name} joined.`]);
        });

        socket.on("playerLeft", (player) => {
            setPlayers(prev => prev.filter(p => p.socketId !== player.socketId));
            setGameLog(prev => [...prev, `${player.name} left.`]);
            setGameStarted(false);
            setGeneratedRoomCode("");
        });

        socket.on("error", ({ message }) => {
            alert(message);
        });

        socket.on("disconnect", () => {
            console.log("[Socket] Disconnected");
        });

        return () => socket.disconnect();
    }, [roomId]);

    const attemptLudoKingRedirect = (code) => {
        // Hypothetical Ludo King deep link (replace with actual scheme if known)
        const deepLink = `ludoking://join?code=${code}`;
        window.location.href = deepLink;

        // Fallback: If the deep link fails, the UI prompt will guide the user
        setTimeout(() => {
            if (document.hasFocus()) {
                // If the page is still focused, the deep link likely failed
                setGameLog(prev => [...prev, "Failed to open Ludo King automatically. Please open it manually."]);
            }
        }, 1000);
    };

    const handleSendRoomCode = () => {
        const trimmedCode = userEnteredRoomCode.trim();
        if (!trimmedCode || !/^\d{6}$/.test(trimmedCode)) {
            alert("Please enter a valid 6-digit Ludo room code.");
            return;
        }
        socketRef.current.emit("userProvidedRoomCode", { roomId, code: trimmedCode });
        setGeneratedRoomCode(trimmedCode);
        setGameStarted(true);
        setGameLog(prev => [...prev, `Room code sent: ${trimmedCode}`]);
        setUserEnteredRoomCode("");
        // Attempt to redirect to Ludo King
        attemptLudoKingRedirect(trimmedCode);
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
        setGameLog(prev => [...prev, `Game Result Submitted: ${result}`]);
        alert(`You submitted: ${result}. Awaiting opponent's submission.`);
    };

    const myPlayer = players.find(p => p.socketId === myPlayerId);
    const opponentPlayer = players.find(p => p.socketId !== myPlayerId);
    const gameAmount = myPlayer?.amount || "N/A";

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
            <Header />
            <main className="flex-grow w-full flex flex-col items-center py-4 px-1 sm:px-3">
                <div
                    className="
                        w-full 
                        max-w-md 
                        md:max-w-2xl
                        bg-white 
                        rounded-xl 
                        shadow-md 
                        md:shadow-lg 
                        md:my-8 
                        md:px-8 
                        py-6 
                        px-2
                    "
                >
                    {/* VS Block */}
                    <div
                        className={`
                            flex items-center justify-between
                            w-full
                            p-3
                            rounded-2xl
                            shadow
                            bg-gradient-to-tr from-blue-100 via-white to-blue-50
                            mt-0 md:mt-2
                            gap-3
                        `}
                    >
                        <div className="flex flex-col items-center w-1/3">
                            <div className="
                                w-10 h-10 sm:w-14 sm:h-14 
                                bg-blue-400 rounded-full 
                                flex items-center justify-center 
                                text-white text-base sm:text-xl font-bold mb-1
                            ">
                                {myPlayer?.name?.charAt(0) || "U"}
                            </div>
                            <div className="font-semibold text-gray-800 text-sm sm:text-base">{myPlayer?.name || "You"}</div>
                            <div className="text-xs text-gray-500">You</div>
                        </div>
                        <div className="w-1/3 text-center flex flex-col items-center">
                            <div className="text-2xl sm:text-3xl font-bold text-red-600 select-none">VS</div>
                            <div className="mt-1 sm:mt-2 text-green-700 font-semibold text-base sm:text-lg tracking-wide">₹{gameAmount}</div>
                        </div>
                        <div className="flex flex-col items-center w-1/3">
                            <div className="
                                w-10 h-10 sm:w-14 sm:h-14 
                                bg-orange-400 rounded-full 
                                flex items-center justify-center 
                                text-white text-base sm:text-xl font-bold mb-1
                            ">
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
                                <div className="
                                    font-mono text-2xl sm:text-3xl
                                    tracking-widest text-black 
                                    mb-2 border 
                                    px-4 py-2 rounded
                                    bg-gray-50 flex items-center justify-center gap-1
                                    w-full
                                    max-w-xs
                                ">
                                    {generatedRoomCode || <span className="text-gray-400">Waiting for Ludo room code...</span>}
                                    {generatedRoomCode && (
                                        <button
                                            className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
                                            title="Copy Room Code"
                                            onClick={handleCopyRoomCode}
                                        >📋</button>
                                    )}
                                </div>
                                {!gameStarted && (
                                    <>
                                        <input
                                            type="text"
                                            value={userEnteredRoomCode}
                                            onChange={(e) => setUserEnteredRoomCode(e.target.value)}
                                            placeholder="Paste Ludo Room Code here"
                                            className="border w-full max-w-xs text-lg py-2 px-3 rounded focus:ring focus:ring-blue-300 mb-3 mt-1"
                                        />
                                        <button
                                            onClick={handleSendRoomCode}
                                            className="w-full max-w-xs bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition"
                                        >
                                            Send Room Code
                                        </button>
                                    </>
                                )}
                                {copied && (
                                    <div className="mt-4 px-3 py-2 rounded bg-green-600 text-white font-semibold shadow text-center text-sm sm:text-base">
                                        Room code copied! Paste it in Ludo King!
                                    </div>
                                )}
                                {gameStarted && generatedRoomCode && (
                                    <div className="mt-4 px-3 py-2 rounded bg-blue-600 text-white font-semibold shadow text-center text-sm sm:text-base">
                                        Room code set! Opening Ludo King... If not redirected, open Ludo King and enter the code manually.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="order-2">
                            <div className="bg-white rounded-lg shadow p-5 flex flex-col items-center h-full">
                                <div className="mb-2 font-bold text-lg text-center">Game Result</div>
                                <p className="text-gray-700 text-xs sm:text-sm text-center mb-4">
                                    After your game, select result (screenshot upload coming soon).
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
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="font-semibold mb-1 text-base sm:text-lg">Game Events</div>
                            <ul className="max-h-32 sm:max-h-40 overflow-y-auto text-xs sm:text-sm">
                                {gameLog.length > 0 ? (
                                    gameLog.slice(-8).map((log, idx) => (
                                        <li className="text-gray-700 py-0.5" key={idx}>
                                            {log}
                                        </li>
                                    ))
                                ) : (
                                    <li className="text-gray-400">Waiting for events...</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
