import ludoLogo from "../assets/ludo.png";
import ribbonLogo from "../assets/ribbon.png";
import snakeLogo from "../assets/snake.png";
import WALogo from "../assets/WA.png";
import ludo2Logo from "../assets/ludo2.png";
import { useNavigate } from "react-router-dom";
import { Header } from "../Components/Header";
import { Footer } from "../Components/Footer";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

export function Home() {
  const navigate = useNavigate();
  const [notice, setNotice] = useState("");
  const [userRole, setUserRole] = useState(null);
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  useEffect(() => {
    const fetchNotice = async () => {
      const noticeDoc = await getDoc(doc(db, "notice", "main"));
      if (noticeDoc.exists()) {
        setNotice(noticeDoc.data().message);
      }
    };

    const checkUserRole = () => {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
          }
        }
      });
    };

    fetchNotice();
    checkUserRole();
  }, []);

  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          console.log("User accepted the install prompt");
        } else {
          console.log("User dismissed the install prompt");
        }
        setInstallPrompt(null);
      });
    }
  };

  return (
    <div className="bg-[#0e0e0e] min-h-screen">
      <Header />

      {/* Notice Bar */}
      <div className="bg-black text-white text-[14px] md:text-[16px] p-3 text-center font-semibold leading-5">
        {notice}
        {userRole === "admin" && (
          <Link to="/admin/notice-change" className="ml-4 text-blue-500">
            [Edit]
          </Link>
        )}
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
          <div className="rounded-xl p-3 bg-gradient-to-br from-green-500 to-blue-600 hover:scale-95 transition-transform duration-200 shadow-lg relative overflow-hidden">
            <h3 className="font-dashhorizon text-white text-lg mb-2">
              Snake Game
            </h3>
            <img
              src={snakeLogo}
              alt="Snake"
              className="w-full h-28 object-contain opacity-20 blur-sm"
            />
            <button
              className="mt-4 mx-auto block px-6 py-2 bg-gradient-to-r from-[#ff512f] to-[#dd2476] text-white font-bold text-sm rounded-full shadow-lg opacity-20"
              disabled
            >
              🎮 Play Now
            </button>

            {/* Coming Soon Overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl">
              {/* Glowing Border */}
              <div className="absolute inset-1 rounded-xl border-2 border-emerald-400/30 animate-pulse"></div>

              {/* Main Content */}
              <div className="text-center relative z-10">
                {/* Spinning Snake Icon */}
                <div className="mb-6 relative">
                  <div
                    className="text-6xl animate-spin"
                    style={{ animationDuration: "4s" }}
                  >
                    🐍
                  </div>
                  <div className="absolute inset-0 text-6xl animate-ping opacity-30">
                    🐍
                  </div>
                </div>

                {/* Stylish Coming Soon */}
                <div className="relative mb-4">
                  <div className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 p-[2px] rounded-2xl shadow-2xl">
                    <div className="bg-black/90 px-8 py-4 rounded-2xl backdrop-blur-sm">
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-300 bg-clip-text text-transparent font-dashhorizon tracking-wider">
                        COMING SOON
                      </h3>
                    </div>
                  </div>
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 rounded-2xl blur-lg opacity-20 animate-pulse"></div>
                </div>

                <p className="text-emerald-300 text-sm font-semibold animate-pulse">
                  🎯Comming Soon
                </p>
              </div>

              {/* Floating Particles */}
              <div className="absolute top-4 left-4 w-2 h-2 bg-emerald-400 rounded-full animate-bounce opacity-60"></div>
              <div
                className="absolute top-8 right-6 w-1 h-1 bg-cyan-400 rounded-full animate-bounce opacity-60"
                style={{ animationDelay: "0.5s" }}
              ></div>
              <div
                className="absolute bottom-8 left-6 w-1 h-1 bg-blue-400 rounded-full animate-bounce opacity-60"
                style={{ animationDelay: "1s" }}
              ></div>
              <div
                className="absolute bottom-4 right-4 w-2 h-2 bg-emerald-400 rounded-full animate-bounce opacity-60"
                style={{ animationDelay: "1.5s" }}
              ></div>
            </div>
          </div>

          {/* Super Ludo */}
          <div className="rounded-xl p-3 bg-gradient-to-br from-purple-600 to-pink-500 hover:scale-95 transition-transform duration-200 shadow-lg relative overflow-hidden">
            <h3 className="font-dashhorizon text-white text-lg mb-2">
              Super Ludo
            </h3>
            <img
              src={ludo2Logo}
              alt="Ludo2"
              className="h-[108px] w-full object-contain opacity-20 blur-sm"
            />
            <p className="font-bold font-roboto text-white text-center mt-2 text-xl opacity-20">
              Life Ludo
            </p>

            {/* Coming Soon Overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl">
              {/* Glowing Border */}
              <div className="absolute inset-1 rounded-xl border-2 border-purple-400/30 animate-pulse"></div>

              {/* Main Content */}
              <div className="text-center relative z-10">
                {/* Crown + Dice */}
                <div className="mb-6 relative">
                  <div
                    className="text-5xl animate-bounce"
                    style={{ animationDuration: "2s" }}
                  >
                    🎲
                  </div>
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-4xl animate-pulse text-yellow-400">
                    👑
                  </div>
                  <div className="absolute inset-0 text-5xl animate-ping opacity-20">
                    🎲
                  </div>
                </div>

                {/* Ultra Stylish Coming Soon */}
                <div className="relative mb-4">
                  <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 p-[2px] rounded-2xl shadow-2xl">
                    <div className="bg-black/90 px-8 py-4 rounded-2xl backdrop-blur-sm relative overflow-hidden">
                      {/* Shimmer overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse transform -skew-x-12"></div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-yellow-300 bg-clip-text text-transparent font-dashhorizon tracking-wider relative z-10">
                        COMING SOON
                      </h3>
                    </div>
                  </div>
                  {/* Intense glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 rounded-2xl blur-xl opacity-30 animate-pulse"></div>
                </div>

                <p className="text-yellow-300 text-sm font-semibold animate-pulse">
                  🏆 Ultimate Ludo Comming Soon
                </p>
              </div>

              {/* Premium Sparkles */}
              <div className="absolute top-3 left-3 text-yellow-400 text-lg animate-ping">
                ✨
              </div>
              <div
                className="absolute top-3 right-3 text-pink-400 text-lg animate-ping"
                style={{ animationDelay: "0.7s" }}
              >
                💫
              </div>
              <div
                className="absolute bottom-3 left-3 text-purple-400 text-lg animate-ping"
                style={{ animationDelay: "1.4s" }}
              >
                ⭐
              </div>
              <div
                className="absolute bottom-3 right-3 text-yellow-400 text-lg animate-ping"
                style={{ animationDelay: "2.1s" }}
              >
                🌟
              </div>
            </div>
          </div>

          {/* Support */}
          <div
            className="rounded-xl p-3 bg-gradient-to-br from-gray-700 to-gray-900 hover:scale-95 transition-transform duration-200 shadow-lg cursor-pointer"
            onClick={() => navigate("/Support")}
          >
            <img src={WALogo} alt="Support" className="mx-auto mt-3 h-[70px]" />
            <p className="font-bold font-roboto text-white text-center mt-2 text-xl">
              Support
            </p>
          </div>
        </div>

        {/* Download App CTA */}
        {installPrompt && (
          <button
            className="mt-6 mb-6 w-full py-3 text-white bg-gradient-to-r from-yellow-500 to-orange-500 text-2xl font-bold rounded-md shadow-xl hover:scale-[1.02] transition-transform"
            onClick={handleInstallClick}
          >
            📥 Download App
          </button>
        )}
      </div>

      <Footer />
    </div>
  );
}
