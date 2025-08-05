import homeLogo from '../assets/home.png'
import walletLogo from '../assets/wallet.png'
import supportLogo from '../assets/support.png'
import accountLogo from '../assets/account.png'
import referLogo from '../assets/refer.png'
import { useNavigate } from 'react-router-dom'

export function Footer() {
    const navigate = useNavigate();

    return <div>
        <div className='bg-primary fixed bottom-0 w-full h-[52px] grid grid-cols-5 place-content-between px-4 py-2'>
            <button className='font-roboto flex flex-col items-center text-[12px]' onClick={() => navigate('/home')}>
                <img src={homeLogo} alt="" className='' />
                <p>Home</p>
            </button>
            <button className='font-roboto flex flex-col items-center text-[12px]' onClick={() => navigate('/MyWallet')}>
                <img src={walletLogo} alt="" className='' />
                <p>My Wallet</p>
            </button>
            <button className='font-roboto flex flex-col items-center text-[12px]' onClick={() => navigate('/Refer')}>
                <img src={referLogo} alt="" className='' />
                <p>Refer</p>
            </button>
            <button className='font-roboto flex flex-col items-center text-[12px]' onClick={() => navigate('/Support')}>
                <img src={supportLogo} alt="" className='' />
                <p>Support</p>
            </button>
            <button className='font-roboto flex flex-col items-center text-[12px]' onClick={() => navigate('/Profile')}>
                <img src={accountLogo} alt="" className='' />
                <p>Account</p>
            </button>
        </div>
    </div>
}