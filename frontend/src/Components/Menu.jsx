import React, { useEffect, useState } from 'react';
import walletLogo from "../assets/wallet.png";
import supportLogo from "../assets/support.png";
import accountLogo from "../assets/account.png";
import referLogo from "../assets/refer.png";
import arrowL from "../assets/arrowL.png";
import gameLogo from "../assets/game.png";
import downloadLogo from "../assets/download.png";
import historyLogo from "../assets/history.png";
import referHistoryLogo from "../assets/referHistory.png";
import notificationLogo from "../assets/notification.png";
import policyLogo from "../assets/policy.png";
import { Link, useNavigate } from "react-router-dom";
import { CheckIcon } from "lucide-react";

  import { doc, getDoc } from "firebase/firestore";
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';



export function Menu() {
   const [userDoc, setUserDoc] = useState(null);
 
    const [adminUid, setAdminUid] = useState(null);
    const [error, setError] = useState('');
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

 useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setAdminUid(user.uid);
      else setAdminUid(null);
    });
    return () => unsub();
  }, []);


useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserDoc({ id: userSnap.id, ...userSnap.data() });
        } else {
          setError("User document not found.");
        }
      } catch (err) {
        console.error(err);
        setError("Error fetching user.");
      }
    }
  });

  return () => unsubscribe();
}, []);

  //get user info
  return (
    <div>
      <div style={{ marginLeft: "40px", marginRight: "17px" }}>
        <span
          className="material-symbols-outlined"
          style={{ marginTop: "10px" }}
        >
          <button
            onClick={() => {
              setIsOpen(!isOpen);
            }}
          >
            menu
          </button>
        </span>
        <div
          className={`fixed top-0 -right-3 w-64 h-full bg-menu-base shadow-lg transform transition-transform duration-300 z-40 ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="">
            <div className="flex bg-primary p-2 items-center">
              <button onClick={() => setIsOpen(false)} className="">
                <img src={arrowL} alt="Close Menu" className="w-6 h-6" />
              </button>
              <Link to={userDoc?.role === "admin" ? "/dashboard" : "/Profile"}>
              <button
               
                className=" text-black bg-primary font-roboto text-[17px]"
              >
               <div className="flex ml-[26px] items-center">
  <img src={accountLogo} className="w-8" alt="Account" />
  <p className="ml-[12px]">
    {userDoc?.role === "admin" ? "Admin Dashboard" : "My Profile"}
  </p>
</div>
               
              </button>
              </Link>
            </div>
            <ul className="">
              <li className="p-[4px] bg-menu-base">
                <button
                  onClick={() => navigate("/Matchmaking")}
                  className=" text-white  font-roboto text-[17px] w-full"
                >
                  <div className="flex items-center mr-2 pl-14">
                    <img src={gameLogo} className="w-8"></img>
                    <p className="ml-[12px]">Play Game</p>
                  </div>
                </button>
              </li>
              <li className="p-[4px] bg-primary">
                <button
                  onClick={() => navigate("/MyWallet")}
                  className=" text-black  font-roboto text-[17px] w-full"
                >
                  <div className="flex items-center mr-2 pl-14">
                    <img src={walletLogo} className="w-8"></img>
                    <p className="ml-[12px]">My Wallet</p>
                  </div>
                </button>
              </li>
              <li className="p-[4px] bg-menu-base">
                <button
                  onClick={() => navigate("/Refer")}
                  className=" text-white  font-roboto text-[17px] w-full"
                >
                  <div className="flex items-center mr-2 pl-14">
                    <img src={referLogo} className="w-8"></img>
                    <p className="ml-[12px]">Refer & Earn</p>
                  </div>
                </button>
              </li>
              <li className="p-[4px] bg-primary">
                <button
                  onClick={() => navigate("/History")}
                  className=" text-black  font-roboto text-[17px] w-full"
                >
                  <div className="flex items-center mr-2 pl-14">
                    <img src={historyLogo} className="w-8"></img>
                    <p className="ml-[12px]">History</p>
                  </div>
                </button>
              </li>
              <li className="p-[4px] bg-menu-base">
                <button
                  onClick={() => setIsOpen(false)}
                  className=" text-white  font-roboto text-[17px] w-full"
                >
                  <div className="flex items-center mr-2 pl-14">
                    <img src={referHistoryLogo} className="w-8"></img>
                    <p className="ml-[12px]">Refer History</p>
                  </div>
                </button>
              </li>
              <li className="p-[4px] bg-primary">
                <button
                  onClick={() => navigate("/Notifications")}
                  className=" text-black  font-roboto text-[17px] w-full"
                >
                  <div className="flex items-center mr-2 pl-14">
                    <img src={notificationLogo} className="w-8"></img>
                    <p className="ml-[12px]">Notification</p>
                  </div>
                </button>
              </li>
              <li className="p-[4px] bg-menu-base">
                <button
                  onClick={() => navigate("/Support")}
                  className=" text-white  font-roboto text-[17px] w-full"
                >
                  <div className="flex items-center mr-2 pl-14">
                    <img src={supportLogo} className="w-8"></img>
                    <p className="ml-[12px]">Support</p>
                  </div>
                </button>
              </li>
              <li className="p-[4px] bg-primary">
                <button
                  onClick={() => navigate("/Withdraw")}
                  className="text-black font-roboto text-[17px] w-full"
                >
                  <div className="flex items-center gap-2 pl-16">
                    <CheckIcon />
                    <span>Withdraw</span>
                  </div>
                </button>
              </li>

              <li className="p-[4px] bg-menu-base">
                <button
                  onClick={() => navigate("/Kyc-Admin")}
                  className=" text-white  font-roboto text-[17px] w-full"
                >
                  <div className="flex items-center mr-2 pl-14">
                    <img src={supportLogo} className="w-8"></img>
                    <p className="ml-[12px]">Admin</p>
                  </div>
                </button>
              </li>
              <li className="p-[4px] bg-primary">
                <button
                  onClick={() => setIsOpen(false)}
                  className=" text-black  font-roboto text-[17px] w-full"
                >
                  <div className="flex items-center mr-2 pl-14">
                    <img src={downloadLogo} className="w-8"></img>
                    <p className="ml-[12px]">App Download</p>
                  </div>
                </button>
              </li>
              <li className="p-[4px] bg-menu-base">
                <button
                  onClick={() => setIsOpen(false)}
                  className=" text-white  font-roboto text-[17px] w-full"
                >
                  <div className="flex items-center mr-2 pl-14">
                    <img src={policyLogo} className="w-8"></img>
                    <p className="ml-[12px]">All Policy</p>
                  </div>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
