import { useNavigate } from 'react-router-dom';
import { Header } from '../Components/Header';
import { Footer } from '../Components/Footer';
import notificationImg from '../assets/supportImg.png';
import whatsappLogo from '../assets/whatsapp.png';

export function Support() {
    const navigate = useNavigate();

    return <div>
        <Header></Header>
        <div className="font-roboto text-[20px] mt-4 p-4 text-white flex items-center justify-center">
            <div className="flex items-center pt-25 justify-between">
                <img src={notificationImg} className="w-1/2"></img>
                <div className='flex flex-col items-center justify-center'>
                    <p>Contact us on:</p>
                    <div className='flex justify-center items-center w-1/2'>
                        <a href='https://wa.me/917378160677'><img src={whatsappLogo} className=''></img></a>
                        <span className='text-[16px] ml-2 text-red-300 font-semibold'>Click here</span>
                    </div>
                    <div className="font-bold text-2xl mt-3">24 X 7 Support</div>
                </div>
            </div>
        </div>
        <Footer></Footer>
    </div>
}