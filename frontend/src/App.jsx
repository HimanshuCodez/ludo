import { Routes, Route, BrowserRouter } from "react-router-dom";
import { Home } from "./pages/Home";
import { Profile } from "./pages/Profile";
import { AddCash } from "./pages/AddCash";
import { Refer } from "./pages/Refer";
import { History } from "./pages/History";
import { MyWallet } from "./pages/MyWallet";
import { Notifications } from "./pages/Notifications";
import { Support } from "./pages/Support";
import { Matchmaking } from "./pages/Matchmaking"; // Assuming Matchmaking is in ./pages
import  {GameRoom}  from "./pages/GameRoom"; // <-- Naya import: GameRoom component ko import karein
import { PrivateRoute } from "./Admin/PrivateRoute";
import Dashboard from "./Admin/Dashboard";
import AuthPage from "./pages/AuthPage";
import KycVerify from "./pages/KycVerify";
import { Pay } from "./pages/Pay";
import { PaymentConfirmation } from "./pages/PaymentConfirmation";
import { AuthProvider } from "./context/AuthContext";
import Withdraw from "./pages/Withdraw";
import WinApprove from "./Admin/WinApprove";
import WithdrawAdmin from "./Admin/AdminWithdraw";
import AdminKycApprove from "./Admin/AdminKycApprove";
import NoticeChange from "./Admin/NoticeChange";
import TopUpConfirm from "./Admin/TopUpConfirm";
import AdminBarcode from "./Admin/AdminBarCode";



function App() {
  return (
    <div>
      <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<AuthPage />} />
           
        <Route path="/home" element={ <PrivateRoute><Home /></PrivateRoute>} />
          <Route path='/Profile' element={<Profile />} />
          <Route path='/AddCash' element={<AddCash />} />
          <Route path='/Refer' element={<Refer />} />
          <Route path='/History' element={<History />} />
          <Route path='/MyWallet' element={<MyWallet />} />
          <Route path='/Notifications' element={<Notifications />} />
          <Route path='/Support' element={<Support />} />
          <Route path='/Pay' element={<Pay />} />
          <Route path='/Matchmaking' element={<Matchmaking />} />
          <Route path='/Kyc-Admin' element={<AdminKycApprove/>} />
          <Route path='/Kyc-Verify' element={<KycVerify />} />
          <Route path='/Withdraw' element={<Withdraw />} />
          <Route path='/Withdraw-admin' element={<WithdrawAdmin />} />
          <Route path='/Win-Approve' element={<WinApprove />} />
          <Route path='/notice-change' element={<NoticeChange />} />
          <Route path="/PaymentConfirmation" element={<PaymentConfirmation />} />
          <Route path="/Admin-TopUp" element={<TopUpConfirm />} />
          <Route path="/Admin-BarCode" element={<AdminBarcode />} />
       
          {/* Naya Route: GameRoom component ke liye dynamic route */}
          <Route path='/room/:roomId' element={<GameRoom />} /> {/* <-- Ye line add karein */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard/></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </div>
  )
}

export default App;
