import rupeeLogo from "../assets/rupee.png";
import rupee2Logo from "../assets/rupee2.png";
import arrowL from "../assets/arrowL.png";
import { useNavigate } from "react-router-dom";
import { Header } from "../Components/Header";
import { Footer } from "../Components/Footer";
import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export function MyWallet() {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;
  const [depositChips, setDepositChips] = useState(0);
  const [winningChips, setWinningChips] = useState(0);

  useEffect(() => {
    const fetchWallet = async () => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setDepositChips(parseFloat(userSnap.data().depositChips) || 0);
          setWinningChips(parseFloat(userSnap.data().winningChips) || 0);
        }
      }
    };
    fetchWallet();
  }, [user]);

  return (
    <div className="font-roboto min-h-screen bg-gradient-to-br from-yellow-50 via-red-50 to-green-100">
      <Header />

      {/* Back & Wallet History */}
      <div className="px-4 pt-2 pb-1 flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="rounded-full bg-primary p-1"
        >
          <img src={arrowL} alt="Back" className="w-8 h-8" />
        </button>
        <button className="bg-gradient-to-r from-yellow-400 to-red-400 text-white font-semibold px-4 py-1 rounded-lg shadow">
          Wallet History
        </button>
      </div>

      {/* Verified Status */}
      <div className="mx-4 bg-gradient-to-r from-green-200 to-green-400 rounded-md px-4 py-2 flex justify-between items-center text-sm font-medium text-green-900 shadow-sm">
        <span>✔ Verified</span>
        <span className="bg-green-700 text-white text-xs px-2 py-1 rounded">
          Verification Completed
        </span>
      </div>

      {/* Wallet Sections */}
      <div className="mx-4 mt-4 space-y-4">
        {/* Deposit Chips */}
        <div className="rounded-xl overflow-hidden shadow-md bg-white">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-center py-1 font-semibold">
            Deposit Chips
          </div>
          <div className="bg-blue-50 text-[11px] text-center text-blue-600 px-2 py-1">
            यह चिप्स Win अवं Buy की गई चिप्स है। इनसे सिर्फ गेम खेले जा सकते
            हैं, बैंक या UPI से निकाला नहीं जा सकता है।
          </div>
          <div className="flex justify-center py-4 bg-gradient-to-br from-yellow-200 to-red-200">
            <div className="bg-white rounded-lg px-6 py-3 shadow text-center space-y-1">
              <img src={rupeeLogo} alt="" className="w-6 h-6 mx-auto" />
              <div className="flex justify-center items-center gap-1 text-xl font-bold">
                <img src={rupee2Logo} alt="" className="w-4 h-4" />
                <span>{depositChips.toFixed(2)}</span>
              </div>
              <div className="text-gray-600 text-sm">Chips</div>
            </div>
          </div>
          <button
            onClick={() => navigate("/AddCash")}
            className="w-full bg-green-600 text-white py-2 font-semibold rounded-b-lg hover:bg-green-700 transition"
          >
            Add
          </button>
        </div>

        {/* Winning Chips (Static for now) */}
        <div className="rounded-xl overflow-hidden shadow-md bg-white">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-center py-1 font-semibold">
            Winning Money
          </div>
          <div className="bg-red-50 text-[11px] text-center text-red-600 px-2 py-1">
            यह चिप्स Win अवं Buy की गई चिप्स है। इनसे सिर्फ गेम खेले जा सकते
            हैं, बैंक या UPI से निकाला नहीं जा सकता है।
          </div>
          <div className="flex justify-center py-4 bg-gradient-to-br from-orange-100 to-yellow-200">
            <div className="bg-white rounded-lg px-6 py-3 shadow text-center space-y-1">
              <img src={rupeeLogo} alt="" className="w-6 h-6 mx-auto" />
              <div className="flex justify-center items-center gap-1 text-xl font-bold">
                <img src={rupee2Logo} alt="" className="w-4 h-4" />
                <span>{winningChips.toFixed(2)}</span>
              </div>
              <div className="text-gray-600 text-sm">Money</div>
            </div>
          </div>
          <li className="p-[4px] bg-primary">
            <button
              onClick={() => navigate("/Withdraw")}
              className="text-black font-roboto text-[17px] w-full"
            >
              <div className="flex   items-center gap-2 pl-16">
                <span className="pl-20">Withdraw</span>
              </div>
            </button>
          </li>
        </div>
      </div>

      <Footer />
    </div>
  );
}
