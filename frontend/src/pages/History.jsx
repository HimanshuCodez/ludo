import { useNavigate } from 'react-router-dom'
import { Header } from '../Components/Header'
import { Footer } from '../Components/Footer'


export function History() {
    const navigate = useNavigate();

    return <div>
        <Header></Header>
        <div className='flex items-center justify-around mt-7 font-roboto text-white text-[15px]'>
            <div className='bg-linear-to-r from-gradient1 to-gradient2 px-3 py-1 rounded-sm'>Wallet</div>
            <div className='bg-linear-to-r from-gradient1 to-gradient2 px-3 py-1 rounded-sm'>Game</div>
            <div className='bg-linear-to-r from-gradient1 to-gradient2 px-3 py-1 rounded-sm'>Penalty</div>
            <div className='bg-linear-to-r from-gradient1 to-gradient2 px-3 py-1 rounded-sm'>Bonus</div>
        </div>
        <Footer></Footer>
    </div>
     
}
