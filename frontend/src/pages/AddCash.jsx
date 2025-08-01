import rupee2Logo from '../assets/rupee2.png'
import { useNavigate } from 'react-router-dom'
import { Header } from '../Components/Header'
import { Footer } from '../Components/Footer'
import { useState } from 'react';

//50rs - 25k
export function AddCash() {
    const navigate = useNavigate();

    return <div>
        <Header></Header>
        {/* blue portion */}
        <div className='py-5 px-4 font-roboto'>
            {/* black text parent */}
            <div className='bg-black text-white' style={{ fontSize: "10px", padding: "5px" }}>🚫Note🚫👉 Please जिस टाइम में जो UPI & Account number लगे हो उसी पर पेमेंट करें अन्यथा डिपॉजिट ऐड नहीं होगा। withdrawal की कोई समस्या नहीं है 🚫 Note 👉Withdrawal 24*7 available Thankyou 🙏🙏🥰</div>
            <div className='mt-4 text-white'>Choose Amount to Add</div>
            <div className='mt-3'>
                <div className='text-white text-[14px] mb-1'>Enter Amount</div>
                <div className='flex'><img src={rupee2Logo} className='w-12'></img><input onChange={(e)=>{window.localStorage.setItem('Amount',e.target.value)}} type="number" className='w-full h-[40px] bg-white rounded-sm px-2 mt-1' placeholder='Enter Amount' /></div>
                <div className='text-white text-[14px] mt-2'>Min:250, Max:100000</div>
            </div>
            <div className='grid grid-cols-2 gap-4 mt-8'>
                <div>
                    <button className='bg-white font-roboto rounded-sm pt-6 pr-18 pl-3 w-full' style={{ fontSize: "34px" }}>₹50</button>
                </div>
                <div>
                    <button className='bg-white font-roboto rounded-sm pt-6 pr-18 w-full pl-3' style={{ fontSize: "34px" }}>₹500</button>
                </div>
                <div>
                    <button className='bg-white font-roboto rounded-sm pt-6 pr-18 w-full pl-3' style={{ fontSize: "34px" }}>₹1000</button>
                </div>
                <div>
                    <button className='bg-white font-roboto rounded-sm pt-6 pr-18 w-full pl-3' style={{ fontSize: "34px" }}>₹25000</button>
                </div>
            </div>
            <div className='px-2 mt-4'>
                <button onClick={()=>{navigate('/Pay')
                }} className='bg-primary font-roboto rounded-sm w-full p-3 mt-4 text-[14px]'>Next</button>
            </div>
        </div>
        <Footer></Footer>
    </div>
}
