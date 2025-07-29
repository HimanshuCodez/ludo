import display from '../assets/display.png'
import walletLogo from '../assets/wallet.png'
import referLogo from '../assets/refer.png'
import kycLogo from '../assets/kyc.png'
import moneyLogo from '../assets/money.png'
import battleLogo from '../assets/battle.png'
import { useNavigate } from 'react-router-dom'
import { Header } from '../Components/Header'
import { Footer } from '../Components/Footer'

export function Profile() {
    const navigate = useNavigate();

    return <div>
        <Header></Header>
        <div className='p-4 font-roboto'>
            <div className='flex justify-between items-center '>
                <img src={display} className='w-auto'></img>
            </div>
            <div className='border-1 border-solid border-black rounded-lg p-4 mt-4'>
                <div className='flex justify-between items-center'>
                    <button onClick={() => { navigate('/MyWallet') }} className='flex items-center justify-between bg-primary w-auto h-auto p-[6px] rounded-sm'>
                        <img src={walletLogo}></img>
                        <div className='ml-2'>Wallet</div>
                    </button>
                    <button onClick={() => { navigate('/') }} className='flex items-center justify-between bg-primary w-auto h-auto p-[6px] rounded-sm'>
                        <img src={kycLogo}></img>
                        <div className='ml-2'>KYC Verification</div>
                    </button>
                </div>
            </div>
            <div className='flex-row mt-4'>
                <div className='bg-coin border-1 border-solid border-color-coin rounded-lg p-3 mt-4 flex items-center justify-between'>
                    <img src={moneyLogo} className=''></img>
                    <div>Coin Won</div>
                    <div>0</div>
                </div>
                <div className='bg-battle border-1 border-solid border-color-coin rounded-lg p-3 mt-4 flex items-center justify-between'>
                    <img src={battleLogo} className=''></img>
                    <div>Battle Played</div>
                    <div> </div>
                </div>
                <div className='bg-refer border-1 border-solid border-color-coin rounded-lg p-3 mt-4 flex items-center justify-between'>
                    <img src={referLogo} className=''></img>
                    <div>Referral</div>
                    <div> </div>
                </div>
                <div className='text-center mt-8 w-auto px-24'>
                    <div className='bg-logout p-3 text-white rounded-sm'>Log Out</div>
                </div>
            </div>
        </div>
        <Footer></Footer>
    </div>
}