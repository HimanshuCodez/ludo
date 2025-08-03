import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";

const GameRoom = ()=> {
  const { roomId } = useParams();
  const socketRef = useRef(null);
  const [players, setPlayers] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [turn, setTurn] = useState(null);

  useEffect(() => {
    const socket = io("https://ludo-p65v.onrender.com/", {
      transports: ["websocket"],
      reconnection: true,
    });
    socketRef.current = socket;

    socket.emit("joinRoom", { roomId, userName: "Player" + socket.id.slice(0, 4) });

    socket.on("roomStateUpdate", (data) => {
      setPlayers(data.players);
    });

    socket.on("gameStart", () => {
      setGameStarted(true);
      setTurn(players[0]?.id); // Start with first player
    });

    socket.on("error", ({ message }) => {
      alert(message);
    });

    return () => {
      socket.off("roomStateUpdate");
      socket.off("gameStart");
      socket.off("error");
    };
  }, [roomId, players]);

  const handleMove = () => {
    if (turn === socketRef.current.id) {
      // Implement game move logic (e.g., roll dice, move piece)
      socketRef.current.emit("moveMade", { roomId, move: "exampleMove" });
      setTurn(players.find(p => p.id !== turn)?.id); // Switch turn
    }
  };

  return (
    <div className="flex flex-col items-center p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Room {roomId}</h1>
      <div className="mb-4">
        <h2 className="text-xl">Players:</h2>
        <ul>
          {players.map((p) => (
            <li key={p.id} className={turn === p.id ? "font-bold text-blue-600" : ""}>
              {p.name}
            </li>
          ))}
        </ul>
      </div>
      {gameStarted ? (
        <div>
          <p>Game in progress. {turn === socketRef.current.id ? "Your turn!" : "Waiting for opponent."}</p>
          <button
            className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            onClick={handleMove}
            disabled={turn !== socketRef.current.id}
          >
            Make Move
          </button>
        </div>
      ) : (
        <p>Waiting for both players to join...</p>
      )}
    </div>
  );
}
export default GameRoom;