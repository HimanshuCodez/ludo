import coinsLogo from '../assets/coins.png';
import rupeeLogo from '../assets/rupee.png';
import { Menu } from './Menu';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase'; // Adjust path to your firebase config

export function Header() {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const fetchBalance = async () => {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setBalance(parseFloat(userData.depositChips) || 0);
          } else {
            setBalance(0); // Default to 0 if no document exists
          }
        } catch (error) {
          console.error('Error fetching balance:', error);
          setBalance(0); // Fallback to 0 on error
        }
      }
    };

    fetchBalance();
  }, [user]);

  return (
    <div>
      <div
        className="bg-primary px-4 flex items-center justify-between"
        style={{ paddingTop: '10px', height: '80px' }}
      >
        <button
          className="font-dashhorizon text-[26px] mt-3"
          onClick={() => navigate('/home')}
        >
          <span className="text-L">L</span>
          <span className="text-black">i</span>
          <span className="text-f-d">f</span>
          <span className="text-e-u">e</span>
          <span className="text-L">L</span>
          <span className="text-e-u">u</span>
          <span className="text-f-d">d</span>
          <span className="text-black">o</span>
        </button>
        <div className="flex justify-between mt-2 text-[15px] w-full">
          <div className="flex items-center justify-center w-full">
            <img src={rupeeLogo} alt="" className="translate-x-2" />
            <button
              onClick={() => navigate('/AddCash')}
              className="font-roboto text-white bg-linear-to-r from-gradient1 to-gradient2 rounded-xs flex py-1 pl-2 pr-[7px] w-[65px] h-[28px] justify-between"
            >
              <div className="">₹{balance.toFixed(2)}</div>
              <div className="bg-plus w-3 h-3 text-[12px] flex justify-center items-center mt-[5px]">
                +
              </div>
            </button>
          </div>
          <div className="flex items-center justify-center w-full">
            <img src={coinsLogo} alt="" className="translate-x-2" />
            <button className="font-roboto text-white bg-linear-to-r from-gradient1 to-gradient2 rounded-xs flex py-1 pl-2 pr-[7px] w-[65px] h-[28px] justify-between">
              <div className="">Earning</div>
            </button>
          </div>
        </div>
        <Menu />
      </div>
      <div className="bg-linear-to-b from-gradient-red-1 to-gradient-red-2 px-16 py-1.5 text-white font-roboto tracking-wide text-[10px]">
        COMMISSION 5% : REFERRAL 2% FOR ALL GAMES
      </div>
    </div>
  );
}