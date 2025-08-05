import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { Footer } from "../Components/Footer";
import { Header } from "../Components/Header";
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function Matchmaking() {
  const [amount, setAmount] = useState("");
  const [challenges, setChallenges] = useState([]);
  const [matches, setMatches] = useState([]);
  const [myChallengeId, setMyChallengeId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const socketRef = useRef(null);
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    // Fetch user balance
    const fetchBalance = async () => {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setBalance(parseFloat(userData.depositChips) || 0);
          } else {
            setBalance(0);
          }
        } catch (error) {
          console.error('Error fetching balance:', error);
          setBalance(0);
        }
      }
    };

    fetchBalance();

    // Socket.IO setup
    const socket = io("https://ludo-p65v.onrender.com/", {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log(`[Client] Matchmaking connected as ${socket.id}`);
    });

    socket.on("updateChallenges", (list) => {
      console.log(`[Client] Received challenges:`, list);
      setChallenges(list);
    });

    socket.on("updateMatches", (list) => {
      console.log(`[Client] Received matches:`, list);
      setMatches(list);
    });

    socket.on("yourChallengeId", (id) => {
      console.log(`[Client] My challenge ID: ${id}`);
      setMyChallengeId(id);
    });

    socket.on("matchConfirmed", ({ roomId }) => {
      console.log(`[Client] Match confirmed, navigating to room ${roomId}`);
      navigate(`/room/${roomId}`);
    });

    socket.on("error", ({ message }) => {
      console.log(`[Client] Error: ${message}`);
      setLoading(false);
      alert(message);
    });

    socket.on("disconnect", () => {
      console.log("[Client] Disconnected from server");
    });

    socket.on("reconnect", () => {
      console.log("[Client] Reconnected to server");
    });

    return () => {
      socket.off("connect");
      socket.off("updateChallenges");
      socket.off("updateMatches");
      socket.off("yourChallengeId");
      socket.off("matchConfirmed");
      socket.off("error");
      socket.off("disconnect");
      socket.off("reconnect");
    };
  }, [navigate, user]);

  const handleSet = () => {
    const challengeAmount = parseInt(amount);
    if (challengeAmount > 0) {
      if (balance >= challengeAmount) {
        setLoading(true);
        console.log(`[Client] Creating challenge for ₹${amount}`);
        socketRef.current.emit("challenge:create", { amount }, (success) => {
          setLoading(false);
          if (!success) {
            alert("Failed to create challenge.");
          }
        });
      } else {
        alert("Insufficient balance to create this challenge.");
      }
    } else {
      alert("Please enter a valid amount.");
    }
  };

  const handlePlay = (challengeId) => {
    const challenge = challenges.find((ch) => ch.id === challengeId);
    if (challenge && balance >= challenge.amount) {
      setLoading(true);
      console.log(`[Client] Accepting challenge ${challengeId}`);
      socketRef.current.emit("challenge:accept", { challengeId }, (success) => {
        setLoading(false);
        if (!success) {
          alert("Failed to accept challenge.");
        }
      });
    } else {
      alert("Insufficient balance to accept this challenge.");
    }
  };

  const VSRow = ({ playerA, playerB, amount }) => (
    <div className="flex items-center justify-between px-5 py-2 my-1 bg-blue-50 rounded-xl shadow">
      <span className="font-bold text-gray-700">{playerA.name}</span>
      <span className="text-xl font-extrabold text-red-500">VS</span>
      <span className="font-bold text-gray-700">{playerB.name}</span>
      <span className="ml-3 text-green-700 font-bold">₹{amount}</span>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="flex-grow container mx-auto max-w-xl px-2 py-6">
        <div className="w-full bg-white rounded-lg shadow p-5 mb-6">
          <div className="text-gray-700 mb-3">Your Balance: ₹{balance.toFixed(2)}</div>
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleSet();
            }}
          >
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter Amount"
              className="h-12 w-36 rounded-l px-3 border border-gray-300 focus:outline-none text-lg"
              disabled={loading || myChallengeId !== null}
            />
            <button
              type="submit"
              className={`h-12 px-8 rounded-r text-white font-bold text-lg ${
                loading || myChallengeId ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-800"
              }`}
              disabled={loading || myChallengeId}
            >
              Set
            </button>
          </form>
          {myChallengeId && (
            <div className="mt-3 text-blue-600 text-center animate-pulse">
              Waiting for opponent to click Play...
            </div>
          )}
        </div>

        <div className="mb-7">
          <h2 className="text-xl font-bold text-center mb-3">Challenges</h2>
          <div className="bg-white rounded shadow px-3 pt-1 pb-2">
            {challenges.length === 0 && (
              <div className="text-gray-400 py-3 text-center">No open challenges...</div>
            )}
            <ul>
              {challenges.map((ch) => (
                <li
                  key={ch.id}
                  className={`flex items-center justify-between border-b last:border-b-0 py-2 ${
                    ch.own ? "bg-blue-50" : ""
                  }`}
                >
                  <span className="font-semibold">{ch.name}</span>
                  <span className="text-green-700 font-bold">₹{ch.amount}</span>
                  {!ch.own && (
                    <button
                      className="ml-3 px-4 py-1 bg-blue-500 text-white font-bold rounded hover:bg-blue-600"
                      onClick={() => handlePlay(ch.id)}
                      disabled={loading}
                    >
                      Play
                    </button>
                  )}
                  {ch.own && <span className="ml-3 text-xs text-gray-500">(waiting)</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-center mb-3">Ongoing Matches</h2>
          <div className="bg-white rounded shadow px-3 py-2">
            {matches.length === 0 ? (
              <div className="text-gray-400 py-2 text-center">No ongoing matches...</div>
            ) : (
              <ul>
                {matches.map((m, i) => (
                  <li key={m.id || i}>
                    <VSRow playerA={m.playerA} playerB={m.playerB} amount={m.amount} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}