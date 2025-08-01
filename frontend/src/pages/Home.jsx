import ludoLogo from "../assets/ludo.png";
import ribbonLogo from "../assets/ribbon.png";
import snakeLogo from "../assets/snake.png";
import WALogo from "../assets/WA.png";
import ludo2Logo from "../assets/ludo2.png";
import { useNavigate } from "react-router-dom";
import { Header } from "../Components/Header";
import { Footer } from "../Components/Footer";
import { Link } from "react-router-dom";

export function Home() {
  const navigate = useNavigate();

  return (
    <div className="bg-[#0e0e0e] min-h-screen">
      <Header />

      {/* Notice Bar */}
      <div className="bg-black text-white text-[10px] p-2 text-center font-medium">
        🚫 Note 🚫 👉 Please जिस टाइम में जो UPI & Account number लगे हो उसी पर
        पेमेंट करें अन्यथा डिपॉजिट ऐड नहीं होगा। Withdrawal की कोई समस्या नहीं
        है 🚫 Note 👉 Withdrawal 24*7 available. Thank you 🙏🙏🥰
      </div>

      {/* Tournaments */}
      <div className="py-6 px-4">
        <h2 className="text-white text-2xl font-bold font-roboto mb-4">
          🔥 Our Tournaments
        </h2>

        <div className="grid grid-cols-2 gap-5">
          {/* Life Ludo 1 */}
          <Link to="/Matchmaking">
            <div className="rounded-xl p-3 bg-gradient-to-br from-yellow-500 to-red-500 hover:scale-95 transition-transform duration-200 shadow-lg">
              <h3 className="font-dashhorizon text-white text-lg mb-2">
                Life Ludo
              </h3>
              <img
                src={ludoLogo}
                alt="Life Ludo"
                className="w-full h-28 object-contain"
              />
              <button
                className="mt-4 mx-auto block px-6 py-2 bg-gradient-to-r from-[#ff512f] to-[#dd2476] text-white font-bold text-sm rounded-full shadow-lg hover:scale-95 hover:shadow-pink-500/50 transition-transform duration-200"
                onClick={() => navigate("/Matchmaking")}
              >
                🎮 Play Now
              </button>
            </div>
          </Link>

          {/* Snake Game */}
          <div className="rounded-xl p-3 bg-gradient-to-br from-green-500 to-blue-600 hover:scale-95 transition-transform duration-200 shadow-lg">
            <h3 className="font-dashhorizon text-white text-lg mb-2">
              Snake Game
            </h3>
            <img
              src={snakeLogo}
              alt="Snake"
              className="w-full h-28 object-contain"
            />
           <button
                className="mt-4 mx-auto block px-6 py-2 bg-gradient-to-r from-[#ff512f] to-[#dd2476] text-white font-bold text-sm rounded-full shadow-lg hover:scale-95 hover:shadow-pink-500/50 transition-transform duration-200"
                onClick={() => navigate("/Matchmaking")}
              >
                🎮 Play Now
              </button>
          </div>

          {/* Ludo 2 */}
          <div className="rounded-xl p-3 bg-gradient-to-br from-purple-600 to-pink-500 hover:scale-105 transition-transform duration-200 shadow-lg">
            <h3 className="font-dashhorizon text-white text-lg mb-2">
              Super Ludo
            </h3>
            <img
              src={ludo2Logo}
              alt="Ludo2"
              className="h-[108px] w-full object-contain"
            />
            <p className="font-bold font-roboto text-white text-center mt-2 text-xl">
              Life Ludo
            </p>
          </div>

          {/* Support */}
          <div
            className="rounded-xl p-3 bg-gradient-to-br from-gray-700 to-gray-900 hover:scale-105 transition-transform duration-200 shadow-lg cursor-pointer"
            onClick={() => navigate("/Support")}
          >
            <img src={WALogo} alt="Support" className="mx-auto mt-3 h-[70px]" />
            <p className="font-bold font-roboto text-white text-center mt-2 text-xl">
              Support
            </p>
          </div>
        </div>

        {/* Download App CTA */}
        <button className="mt-6 mb-6 w-full py-3 text-white bg-gradient-to-r from-yellow-500 to-orange-500 text-2xl font-bold rounded-md shadow-xl hover:scale-[1.02] transition-transform">
          📥 Download App
        </button>
      </div>

      <Footer />
    </div>
  );
}
