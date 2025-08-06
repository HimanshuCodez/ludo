import { useNavigate } from 'react-router-dom';
import { Header } from '../Components/Header';
import { Footer } from '../Components/Footer';
import display from '../assets/display.png';
import walletLogo from '../assets/wallet.png';
import referLogo from '../assets/refer.png';
import kycLogo from '../assets/kyc.png';
import moneyLogo from '../assets/money.png';
import battleLogo from '../assets/battle.png';
import { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function Profile() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        setUserData(data);
        setName(data.name || 'Player');
      }
    };

    fetchUser();
  }, []);

  const handleSave = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user || !name.trim()) return;

    const userRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userRef, {
        name: name,
      });
      setUserData((prevData) => ({ ...prevData, name: name }));
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating name: ', error);
    }
  };

  return (
    <div className='min-h-screen bg-gray-100 font-roboto'>
      <Header />

      <div className='p-4 max-w-xl mx-auto'>
        {/* User Info */}
        <div className='bg-white shadow rounded-lg p-4 flex items-center space-x-4'>
          <img src={display} alt='profile' className='w-16 h-16 rounded-full object-cover border' />
          <div className='flex-grow'>
            <div className='flex items-center space-x-3'>
              {isEditing ? (
                <input
                  type='text'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className='text-lg font-semibold text-gray-800 border-b-2 focus:outline-none focus:border-blue-500'
                />
              ) : (
                <h2 className='text-lg font-semibold text-gray-800'>
                  {userData?.name || 'Player'}
                </h2>
              )}
              {isEditing ? (
                <button
                  onClick={handleSave}
                  className='bg-green-500 text-white px-4 py-1 rounded text-sm hover:bg-green-600 transition'
                >
                  Save
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className='bg-blue-500 text-white px-4 py-1 rounded text-sm hover:bg-blue-600 transition'
                >
                  Edit
                </button>
              )}
            </div>
            <p className='text-sm text-gray-500 mt-1'>
              Referral Code: <span className='font-medium'>{userData?.referralCode || 'N/A'}</span>
              {userData?.referralCode && (
                <button
                  onClick={() => navigator.clipboard.writeText(userData.referralCode)}
                  className='ml-2 text-blue-600 text-xs hover:underline'
                >
                  Copy
                </button>
              )}
            </p>
          </div>
        </div>

        {/* Wallet + KYC Buttons */}
        <div className='mt-4 grid grid-cols-2 gap-4'>
          <button
            onClick={() => navigate('/MyWallet')}
            className='flex items-center p-3 bg-white shadow rounded-lg hover:bg-primary/90 transition'
          >
            <img src={walletLogo} className='w-6 h-6' />
            <span className='ml-2 font-medium text-gray-700'>My Wallet</span>
          </button>
          <button
            onClick={() => navigate('/Kyc-Verify')}
            className='flex items-center p-3 bg-white shadow rounded-lg hover:bg-primary/90 transition'
          >
            <img src={kycLogo} className='w-6 h-6' />
            <span className='ml-2 font-medium text-gray-700'>AADHAAR KYC</span>
          </button>
        </div>

        {/* Stats Section */}
        <div className='mt-6 space-y-4'>
          <div className='flex items-center justify-between p-4 bg-yellow-100 border border-yellow-400 rounded-lg'>
            <div className='flex items-center space-x-2'>
              <img src={moneyLogo} className='w-6 h-6' />
              <span className='font-medium'>Coins Won</span>
            </div>
            <span className='font-semibold text-yellow-700'>0</span>
          </div>

          <div className='flex items-center justify-between p-4 bg-blue-100 border border-blue-400 rounded-lg'>
            <div className='flex items-center space-x-2'>
              <img src={battleLogo} className='w-6 h-6' />
              <span className='font-medium'>Battles Played</span>
            </div>
            <span className='font-semibold text-blue-700'>0</span>
          </div>

          <div className='flex items-center justify-between p-4 bg-green-100 border border-green-400 rounded-lg'>
            <div className='flex items-center space-x-2'>
              <img src={referLogo} className='w-6 h-6' />
              <span className='font-medium'>Referrals</span>
            </div>
            <span className='font-semibold text-green-700'>0</span>
          </div>
        </div>

        {/* Logout */}
        <div className='mt-8 text-center'>
          <button className='bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600 transition'>
            Log Out
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}