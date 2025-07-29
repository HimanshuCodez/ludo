import ludoLogo from '../assets/ludo.png'
import ribbonLogo from '../assets/ribbon.png'
import snakeLogo from '../assets/snake.png'
import WALogo from '../assets/WA.png'
import ludo2Logo from '../assets/ludo2.png'
import { useNavigate } from 'react-router-dom'
import { Header } from '../Components/Header'
import { Footer } from '../Components/Footer'

export function Home() {
    const navigate = useNavigate();

    return <div>
        <Header></Header>
        {/* blue portion */}
        <div className='py-5 px-4'>
            {/* black text parent */}
            <div className='bg-black text-white text-[10px] p-[5px]'>🚫Note🚫👉 Please जिस टाइम में जो UPI & Account number लगे हो उसी पर पेमेंट करें अन्यथा डिपॉजिट ऐड नहीं होगा। withdrawal की कोई समस्या नहीं है 🚫 Note 👉Withdrawal 24*7 available Thankyou 🙏🙏🥰</div>
            {/* Tournaments parent */}
            <div className='mt-2'>
                <div className='text-white font-roboto mb-[10px]' style={{ fontSize: "18px" }}>Our Tournaments</div>
                <div className='grid grid-cols-2 place-content-between gap-5'>
                    <div className='bg-black-ka-bhai rounded-md px-1.5 pb-3.5 pt-2'>
                        <div className='font-dashhorizon text-white ml-0.5' style={{ fontSize: '18px' }}>Life Ludo</div>
                        <img src={ludoLogo} alt="" className='' />
                        <button className="relative text-center mt-3 ml-[25px]" onClick={() => { navigate('/Matchmaking') }}>
                            <img src={ribbonLogo} alt="img" />
                            <div className="absolute top-0 left-6 bottom-1.5 text-center">
                                <p className="text-sm text-center font-dashhorizon text-white font-light">
                                    Play Now
                                </p>
                            </div>
                        </button>
                    </div>
                    <div className='bg-black-ka-bhai rounded-md px-1.5 pb-3.5 pt-2'>
                        <div className='font-dashhorizon text-white ml-0.5' style={{ fontSize: '18px' }}>Life Ludo</div>
                        <img src={snakeLogo} alt="" className='' />
                        <button className="relative text-center mt-3 ml-[25px]" onClick={() => { navigate('/Matchmaking') }}>
                            <img src={ribbonLogo} alt="img" />
                            <div className="absolute top-0 left-6 bottom-1.5 text-center">
                                <p className="text-sm text-center font-dashhorizon text-white font-light">
                                    Play Now
                                </p>
                            </div>
                        </button>
                    </div>
                    <div className='bg-black-ka-bhai rounded-md px-1.5 pb-3.5  pt-2'>
                        <div className='font-dashhorizon text-white ml-0.5' style={{ fontSize: '18px' }}>Life Ludo</div>
                        <img src={ludo2Logo} alt="" className='h-[108px] w-[191px]' />
                        <p className='font-bold font-roboto text-white mt-[7px] ml-[26px] text-[26px]'>Life Ludo</p>
                    </div>
                    <div className='bg-black-ka-bhai rounded-md px-1.5 pb-3.5 pt-2' onClick={() => navigate('/Support')}>
                        <img src={WALogo} alt="" className='ml-[27px] mt-[29px]' />
                        <p className='font-bold font-roboto text-white mt-[7px] ml-[26px] text-[26px]'>Support</p>
                    </div>
                </div>
            </div>
            <button className='text-center bg-download text-white font-semibold font-roboto text-[26px] py-[4px] mt-[21px] mb-[20px] w-full'>Download App</button>
        </div>
        <Footer></Footer>
    </div>
}
