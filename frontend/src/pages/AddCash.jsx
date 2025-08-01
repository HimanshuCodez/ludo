import rupee2Logo from '../assets/rupee2.png';
import { useNavigate } from 'react-router-dom';
import { Header } from '../Components/Header';
import { Footer } from '../Components/Footer';
import { useState } from 'react';

export function AddCash() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');

  const handleNext = () => {
    const parsedAmount = parseInt(amount);
    if (!parsedAmount || parsedAmount < 50 || parsedAmount > 100000) {
      alert('Please enter an amount between ₹50 and ₹100000');
      return;
    }
    window.localStorage.setItem('Amount', parsedAmount);
    navigate('/Pay');
  };

  return (
    <div className="font-roboto">
      <Header />
      <div className="py-5 px-4 bg-blue-900">
        <div className="bg-black text-white" style={{ fontSize: '10px', padding: '5px' }}>
          🚫Note🚫👉 Please जिस टाइम में जो UPI & Account number लगे हो उसी पर पेमेंट करें अन्यथा डिपॉजिट ऐड नहीं होगा। withdrawal की कोई समस्या नहीं है 🚫 Note 👉Withdrawal 24*7 available Thankyou 🙏🙏🥰
        </div>
        <div className="mt-4 text-white">Choose Amount to Add</div>
        <div className="mt-3">
          <div className="text-white text-[14px] mb-1">Enter Amount</div>
          <div className="flex">
            <img src={rupee2Logo} className="w-12" alt="Rupee" />
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full h-[40px] bg-white rounded-sm px-2 mt-1"
              placeholder="Enter Amount"
            />
          </div>
          <div className="text-white text-[14px] mt-2">Min:250, Max:100000</div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-8">
          <button
            className="bg-white hover:bg-amber-300 rounded-sm pt-6 pr-18 pl-3 w-full"
            style={{ fontSize: '34px' }}
            onClick={() => setAmount('50')}
          >
            ₹50
          </button>
          <button
            className="bg-white hover:bg-amber-300 rounded-sm pt-6 pr-18 pl-3 w-full"
            style={{ fontSize: '34px' }}
            onClick={() => setAmount('500')}
          >
            ₹500
          </button>
          <button
            className="bg-white hover:bg-amber-300 rounded-sm pt-6 pr-18 pl-3 w-full"
            style={{ fontSize: '34px' }}
            onClick={() => setAmount('1000')}
          >
            ₹1000
          </button>
          <button
            className="bg-white hover:bg-amber-300 rounded-sm pt-6 pr-18 pl-3 w-full"
            style={{ fontSize: '34px' }}
            onClick={() => setAmount('5000')}
          >
            ₹5000
          </button>
          <button
            className="bg-white hover:bg-amber-300 rounded-sm pt-6 pr-18 pl-3 w-full"
            style={{ fontSize: '34px' }}
            onClick={() => setAmount('10000')}
          >
             ₹10000
          </button>
          <button
            className="bg-white hover:bg-amber-300 rounded-sm pt-6 pr-18 pl-3 w-full"
            style={{ fontSize: '34px' }}
            onClick={() => setAmount('25000')}
          >
           ₹25000 
          </button>
        </div>
        <div className="px-2 mt-4">
          <button
            onClick={handleNext}
            className="bg-primary text-black rounded-sm w-full p-3 mt-4 text-[14px]"
          >
            Next
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}