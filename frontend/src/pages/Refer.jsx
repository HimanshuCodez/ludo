import { useNavigate } from 'react-router-dom'
import { Header } from '../Components/Header'
import { Footer } from '../Components/Footer'


export function Refer() {
    const navigate = useNavigate();

    return <div>
        <Header></Header>
        <Footer></Footer>
    </div>
}
