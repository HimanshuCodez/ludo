import rupeeLogo from '../assets/rupee.png'
import rupee2Logo from '../assets/rupee2.png'
import arrowL from '../assets/arrowL.png'
import { useNavigate } from 'react-router-dom'
import { Header } from '../Components/Header'
import { Footer } from '../Components/Footer'
import { useState } from 'react'


export function MyWallet() {
    const navigate = useNavigate();

    return <div>
        <Header></Header>
        <div className='px-4 pb-4 pt-1 font-roboto'>
            <div className='p-2 flex items-center justify-between'>
                <button onClick={() => navigate('/')} className=""><img src={arrowL} alt="Close Menu" className="w-9 h-8 bg-primary rounded-4xl" /></button>
                <button className='bg-primary p-2 rounded-xl'>Wallet History</button>
            </div>
            <div className='px-4 flex items-center justify-between mt-1 bg-coin py-2 text-[16px] rounded-sm'>
                <div className=''>Verified</div>
                <div className='text-white bg-black p-[6px] rounded-sm'>Verification Completed</div>
            </div>
            <div className='flex-col p-2 mt-1'>
                <div>
                    <div className='bg-primary text-center font-semibold rounded-t-sm p-[3px]'>Deposite Chips</div>
                    <div className='bg-white text-[10px] text-center text-blue-500 p-1'>यह चिप्स Win अवं Buy की गई चिप्स है इनसे सिर्फ गेम खेले जा सकते है, बैंक या UPI से निकाला नहीं जा सकता है</div>
                    <div className='bg-chips py-2 px-28'>
                        <div className='bg-white flex-col rounded-sm'>
                            <div className='flex justify-center'>
                                <img src={rupeeLogo} alt="" className='w-5 h-5' />
                            </div>
                            <div className='flex justify-center items-center'>
                                <img src={rupee2Logo} alt="" className='w-4 h-4' /><span className='text-[16px]'>0</span>
                            </div>
                            <div className='flex justify-center'>Chips</div>
                        </div>
                    </div>
                    <div className=''>
                        <button className='w-full bg-primary text-black px-4 py-2 rounded-b-sm font-semibold' onClick={() => {navigate('/AddCash')}}>Add</button>
                    </div>
                </div>
                <div>
                    <div className='bg-primary text-center font-semibold rounded-t-sm p-[3px] mt-2'>Winning Chips</div>
                    <div className='bg-white text-[10px] text-center text-blue-500 p-1'>यह चिप्स Win अवं Buy की गई चिप्स है इनसे सिर्फ गेम खेले जा सकते है, बैंक या UPI से निकाला नहीं जा सकता है</div>
                    <div className='bg-chips py-2 px-28'>
                        <div className='bg-white flex-col rounded-sm'>
                            <div className='flex justify-center'>
                                <img src={rupeeLogo} alt="" className='w-5 h-5' />
                            </div>
                            <div className='flex justify-center items-center'>
                                <img src={rupee2Logo} alt="" className='w-4 h-4' /><span className='text-[16px]'>0</span>
                            </div>
                            <div className='flex justify-center'>Chips</div>
                        </div>
                    </div>
                    <div className=''>
                        <button className='w-full bg-primary text-black px-4 py-2 rounded-b-sm font-semibold' onClick={() => {navigate('/AddCash')}}>Withdraw</button>
                    </div>
                </div>
            </div>
        </div>
        <Footer></Footer>
    </div>
}
