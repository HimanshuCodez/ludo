import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { Footer } from "../Components/Footer";
import { Header } from "../Components/Header";
import { getAuth } from "firebase/auth";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { SplinePointer, TrophyIcon, User } from "lucide-react";
import { toast } from 'react-toastify'; // Import toast

export function Matchmaking() {
  const [amount, setAmount] = useState("");
  const [challenges, setChallenges] = useState([]);
  const [matches, setMatches] = useState([]);
  const [myChallengeId, setMyChallengeId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);
   const [winBalance, WinsetBalance] = useState(0);
  const [userName, setUserName] = useState("Anonymous");
  const [error, setError] = useState("");
  const socketRef = useRef(null);
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setBalance(parseFloat(userData.depositChips) || 0);
            WinsetBalance(parseFloat(userData.winningChips) || 0);
            setUserName(userData.name || "Anonymous");
          } else {
            setBalance(0);
             WinsetBalance(0);
            setUserName("Anonymous");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setBalance(0);
           WinsetBalance(0);
          setUserName("Anonymous");
        }
      }
    };

    fetchUserData();

    const socket = io("https://ludo-ic57.onrender.com/", {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log(`[Client] Matchmaking connected as ${socket.id}`);
      setError("");
    });

    socket.on("updateChallenges", (list) => {
      setChallenges(list);
    });

    socket.on("updateMatches", (list) => {
      const ongoingMatches = list.filter(
        (match) =>
          match.status !== "pending_approval" && match.status !== "canceled"
      );
      setMatches(ongoingMatches);
    });

    socket.on("yourChallengeId", (id) => {
      setMyChallengeId(id);
    });

    socket.on("matchConfirmed", ({ roomId }) => {
      navigate(`/room/${roomId}`);
    });

    socket.on("error", ({ message }) => {
      console.error(`[Client] Error: ${message}`);
      toast.error(message);
      setLoading(false);
    });

    socket.on("disconnect", () => {});

    return () => {
      socket.disconnect();
    };
  }, [navigate, user]);

  const handleSet = () => {
    if (!user) {
      toast.error("You must be logged in to create a challenge.");
      return;
    }
    const challengeAmount = parseInt(amount);
    if (challengeAmount > 0) {
      if (challengeAmount % 50 !== 0) {
        toast.error("Amount must be in multiples of 50.");
        return;
      }
      if (balance >= challengeAmount) {
        setLoading(true);
        setError("");
        socketRef.current.emit(
          "challenge:create",
          {
            amount,
            uid: user.uid,
            name: userName,
          },
          (success) => {
            setLoading(false);
            if (!success) {
              toast.error(
                "Failed to create challenge. The server might be busy or an error occurred."
              );
            }
          }
        );
      } else {
        toast.error("Insufficient balance to create this challenge.");
      }
    } else {
      toast.error("Please enter a valid amount.");
    }
  };

  const handlePlay = (challengeId) => {
    if (!user) {
      toast.error("You must be logged in to accept a challenge.");
      return;
    }
    const challenge = challenges.find((ch) => ch.id === challengeId);
    if (challenge && balance >= challenge.amount) {
      setLoading(true);
      setError("");
      socketRef.current.emit(
        "challenge:accept",
        {
          challengeId,
          uid: user.uid,
          name: userName,
        },
        (success) => {
          setLoading(false);
          if (!success) {
            toast.error(
              "Failed to accept challenge. The server might be busy or an error occurred."
            );
          }
        }
      );
    } else {
      toast.error("Insufficient balance to accept this challenge.");
    }
  };

  // Eye-catchy VS row with avatars + always centered VS
  const VSRow = ({ playerA, playerB, amount, children }) => (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.4 }}
      className="grid  border-2 grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 py-3 my-2 rounded-xl shadow-lg bg-gradient-to-r from-blue-100 to-purple-100 hover:scale-[1.02] transition-transform"
    >
      {/* Left Player */}
      <div className="flex items-center gap-2 justify-start">
        <User className="w-6 h-6 text-blue-600" />
        <span className="font-bold text-gray-800 truncate">{playerA.name}</span>
      </div>

      {/* VS Centered */}
      <span className="text-2xl font-extrabold text-red-500 animate-pulse text-center">
        VS
      </span>

      {/* Right Player */}
      <div className="flex items-center gap-2 justify-end">
        <span className="font-bold text-gray-800 truncate">{playerB.name}</span>
        <User className="w-6 h-6 text-purple-600" />
      </div>

      {/* Amount */}
      <span className="col-span-3 text-center mt-2  text-green-700 font-bold">
        Rs {amount}
      </span>
      {children && <div className="col-span-3 text-center mt-2">{children}</div>}
    </motion.div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="flex-grow container mx-auto max-w-xl px-2 py-6">
        {/* Balance Section */}
        <div className="w-full bg-white rounded-lg shadow p-5 mb-6">
          <div className="text-gray-700 mb-3">Welcome, {userName}!</div>
          <div className="text-gray-700 mb-3">
            Your Balance: ₹ ₹{(balance + winBalance).toFixed(2)}
          </div>
          {error && (
            <div className="bg-red-100 text-red-700 px-3 py-2 rounded mb-4 text-sm">
              {error}
            </div>
          )}
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleSet();
            }}
          >
            <input
              type="number"
              step="50"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter Amount"
              className="h-12 w-36 rounded-l px-3 border border-gray-300 focus:outline-none text-lg"
              disabled={loading || myChallengeId !== null}
            />
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`h-12 px-8 rounded-r text-white font-bold text-lg ${
                loading || myChallengeId
                  ? "bg-gray-400"
                  : "bg-blue-600 hover:bg-blue-800"
              }`}
              disabled={loading || myChallengeId}
            >
              Set
            </motion.button>
          </form>
          {myChallengeId && (
            <div className="mt-4 flex flex-col items-center justify-center text-blue-600">
             

              {/* Eye-catching waiting text */}
              <p className="text-lg font-bold animate-pulse">
                ⏳ Waiting for a player to join your challenge...
              </p>
            </div>
          )}
        </div>

        {/* Challenges */}
        <div className="mb-7">
        <h2 className="flex items-center justify-center gap-2 text-xl font-bold text-center mb-3">
 -------<TrophyIcon className="w-6 h-6 text-black-500" />
  <span>Open Challenges------</span>
</h2>

          <div className="bg-white rounded shadow px-3 pt-1 pb-2">
            <AnimatePresence>
              {challenges.length === 0 ? (
                <div className="text-gray-400 py-3 text-center">
                  No open challenges...
                </div>
              ) : (
                <ul>
                  {challenges.map((ch) => (
                    <motion.li
                      key={ch.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className={`flex items-center justify-between border-b last:border-b-0 py-2 px-2 rounded-md ${
                        ch.own
                          ? "bg-blue-50 ring-2 ring-blue-400 animate-pulse"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-500" />
                        <span className="font-semibold">{ch.name}</span>
                      </div>
                      <svg
  className="animate-spin h-8 w-8 text-black"
  xmlns="http://www.w3.org/2000/svg"
  fill="currentColor"
  viewBox="0 0 24 24"
>
  <path
    d="M12 2a10 10 0 100 20 10 10 0 100-20zm0 4a6 6 0 110 12A6 6 0 0112 6z"
    className="opacity-25"
  />
  <path
    d="M12 2a10 10 0 0110 10h-4a6 6 0 00-6-6V2z"
    className="opacity-75"
  />
</svg>

                      <span className="text-green-700 font-bold">
                        Rs {ch.amount}
                      </span>
                      {!ch.own && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="ml-3 px-4 py-1 bg-blue-500 text-white font-bold rounded hover:bg-blue-600"
                          onClick={() => handlePlay(ch.id)}
                          disabled={loading}
                        >
                          Play
                        </motion.button>
                      )}
                      {ch.own && (
                        <span className="ml-3 text-xs text-gray-500">
                          (waiting)
                        </span>
                      )}
                    </motion.li>
                  ))}
                </ul>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Ongoing Matches */}
        <div>
          <h2 className="text-xl font-bold text-center mb-3">
            -------Ongoing Matches-------
          </h2>
          <div className="bg-white rounded shadow px-3 py-2">
            <AnimatePresence>
              {matches.length === 0 ? (
                <div className="text-gray-400 py-2 text-center">
                  No ongoing matches...
                </div>
              ) : (
                <ul>
                  {matches.map((m, i) => {
                    const isUserInMatch =
                      user && (m.playerA.uid === user.uid || m.playerB.uid === user.uid);
                    return (
                      <motion.li
                        key={m.id || i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                      >
                        <VSRow
                          playerA={m.playerA}
                          playerB={m.playerB}
                          amount={m.amount}
                        >
                          {isUserInMatch && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => navigate(`/room/${m.id}`)}
                              className="px-6 py-2 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 shadow-md"
                            >
                              View Match
                            </motion.button>
                          )}
                        </VSRow>
                      </motion.li>
                    );
                  })}
                </ul>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
