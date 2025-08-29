import { useNavigate } from 'react-router-dom';
import { Header } from '../Components/Header';
import { Footer } from '../Components/Footer';
import { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export function History() {
    const navigate = useNavigate();
    const [userData, setUserData] = useState({
        withdrawals: [],
        credits: [],
        games: [],
        penalties: [],
        bonuses: []
    });
    const [activeTab, setActiveTab] = useState('wallet');

    useEffect(() => {
        const fetchHistory = async () => {
            const auth = getAuth();
            const user = auth.currentUser;
            if (!user) return;

            const transactionsRef = collection(db, 'users', user.uid, 'transactions');
            const q = query(transactionsRef, orderBy('timestamp', 'desc'));
            const querySnapshot = await getDocs(q);

            const transactions = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    ...data,
                    id: doc.id,
                    date: data.timestamp ? new Date(data.timestamp.toDate()).toLocaleString() : 'N/A'
                };
            });

            const history = {
                withdrawals: transactions.filter(t => t.type === 'withdrawal'),
                credits: transactions.filter(t => t.type === 'credit'),
                games: transactions.filter(t => ['game_win', 'game_loss'].includes(t.type)),
                penalties: transactions.filter(t => t.type === 'penalty'),
                bonuses: transactions.filter(t => t.type === 'bonus')
            };
            setUserData(history);
        };

        fetchHistory();
    }, []);

    const renderWallet = () => (
        <div className='space-y-4'>
            <div className="bg-white shadow rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Credit History</h3>
                {userData.credits.length > 0 ? userData.credits.map((item, index) => (
                    <div key={index} className="flex justify-between items-center border-b py-2">
                        <span className="text-gray-600">Credited: {item.amount}</span>
                        <span className="text-sm text-gray-500">{item.date}</span>
                    </div>
                )) : <p className="text-gray-500">No credit history.</p>}
            </div>
            <div className="bg-white shadow rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Withdrawal History</h3>
                {userData.withdrawals.length > 0 ? userData.withdrawals.map((item, index) => (
                    <div key={index} className="flex justify-between items-center border-b py-2">
                        <span className="text-gray-600">Withdrew: {item.amount}</span>
                        <span className="text-sm text-gray-500">{item.date}</span>
                    </div>
                )) : <p className="text-gray-500">No withdrawal history.</p>}
            </div>
        </div>
    );

    const renderGames = () => (
        <div className="bg-white shadow rounded-lg p-4 space-y-3">
             <h3 className="text-lg font-semibold text-gray-800 mb-2">Game History</h3>
            {userData.games.length > 0 ? userData.games.map((game, index) => (
                <div key={index} className={`p-3 rounded-lg ${game.result === 'Win' ? 'bg-green-100' : 'bg-red-100'}`}>
                    <div className="flex justify-between items-center">
                        <span className="font-semibold">vs {game.opponent}</span>
                        <span className={`font-bold ${game.result === 'Win' ? 'text-green-600' : 'text-red-600'}`}>{game.result}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-1">
                        <span className="text-gray-600">Amount: {game.amount}</span>
                        <span className="text-gray-500">{game.date}</span>
                    </div>
                </div>
            )) : <p className="text-gray-500">No game history.</p>}
        </div>
    );
    
    const renderPenalties = () => (
        <div className="bg-white shadow rounded-lg p-4 space-y-3">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Penalty History</h3>
            {userData.penalties.length > 0 ? userData.penalties.map((penalty, index) => (
                <div key={index} className="p-3 rounded-lg bg-yellow-100">
                    <div className="flex justify-between items-center">
                        <span className="font-semibold">{penalty.reason}</span>
                        <span className="font-bold text-yellow-700">-{penalty.amount}</span>
                    </div>
                     <div className="text-sm text-gray-500 mt-1">{penalty.date}</div>
                </div>
            )) : <p className="text-gray-500">No penalty history.</p>}
        </div>
    );

    const renderBonuses = () => (
         <div className="bg-white shadow rounded-lg p-4 space-y-3">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Bonus History</h3>
            {userData.bonuses.length > 0 ? userData.bonuses.map((bonus, index) => (
                <div key={index} className="p-3 rounded-lg bg-blue-100">
                    <div className="flex justify-between items-center">
                        <span className="font-semibold">{bonus.type}</span>
                        <span className="font-bold text-blue-600">+{bonus.amount}</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">{bonus.date}</div>
                </div>
            )) : <p className="text-gray-500">No bonus history.</p>}
        </div>
    );


    const renderContent = () => {
        switch (activeTab) {
            case 'wallet': return renderWallet();
            case 'game': return renderGames();
            case 'penalty': return renderPenalties();
            case 'bonus': return renderBonuses();
            default: return null;
        }
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <Header />
            <div className='p-4 max-w-xl mx-auto font-roboto'>
                <div className='flex items-center justify-around mb-6 bg-white shadow rounded-lg p-2'>
                    <button onClick={() => setActiveTab('wallet')} className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'wallet' ? 'bg-primary text-white' : 'text-gray-700'}`}>Wallet</button>
                    <button onClick={() => setActiveTab('game')} className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'game' ? 'bg-primary text-white' : 'text-gray-700'}`}>Game</button>
                    <button onClick={() => setActiveTab('penalty')} className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'penalty' ? 'bg-primary text-white' : 'text-gray-700'}`}>Penalty</button>
                    <button onClick={() => setActiveTab('bonus')} className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'bonus' ? 'bg-primary text-white' : 'text-gray-700'}`}>Bonus</button>
                </div>
                <div>
                    {renderContent()}
                </div>
            </div>
            <Footer />
        </div>
    );
}