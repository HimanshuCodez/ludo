import { useNavigate } from 'react-router-dom';
import { Header } from '../Components/Header';
import { Footer } from '../Components/Footer';
import display from '../assets/display.png';
import walletLogo from '../assets/wallet.png';
import referLogo from '../assets/refer.png';
import kycLogo from '../assets/kyc.png';
import moneyLogo from '../assets/money.png';
import battleLogo from '../assets/battle.png';

export function Profile() {
    const navigate = useNavigate();

    return (
        <div className='min-h-screen bg-gray-100 font-roboto'>
            <Header />

            <div className='p-4 max-w-xl mx-auto'>
                {/* User Info */}
                <div className='bg-white shadow rounded-lg p-4 flex items-center space-x-4'>
                    <img src={display} alt='profile' className='w-16 h-16 rounded-full object-cover border' />
                    <div>
                        <h2 className='text-lg font-semibold text-gray-800'>John Doe</h2>
                        <p className='text-sm text-gray-500'>UID: 12345678</p>
                    </div>
                </div>

                {/* Wallet + KYC Buttons */}
                <div className='mt-4 grid grid-cols-2 gap-4'>
                    <button onClick={() => navigate('/MyWallet')} className='flex items-center p-3 bg-white shadow rounded-lg hover:bg-primary/90 transition'>
                        <img src={walletLogo} className='w-6 h-6' />
                        <span className='ml-2 font-medium text-gray-700'>My Wallet</span>
                    </button>
                    <button onClick={() => navigate('/Kyc-Verify')} className='flex items-center p-3 bg-white shadow rounded-lg hover:bg-primary/90 transition'>
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
