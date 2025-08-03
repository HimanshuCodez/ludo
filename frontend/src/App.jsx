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
import  GameRoom  from "./pages/GameRoom"; // <-- Naya import: GameRoom component ko import karein
import { PrivateRoute } from "./Admin/PrivateRoute";
import Dashboard from "./Admin/Dashboard";

import AuthPage from "./pages/AuthPage";
import KycVerify from "./pages/KycVerify";
import { Pay } from "./pages/Pay";
import { PaymentConfirmation } from "./pages/PaymentConfirmation";
import { AuthProvider } from "./context/AuthContext";
import KycAdmin from "./Admin/KycAdmin";


function App() {
  return (
    <div>
      <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<AuthPage />} />
           
        <Route path="/home" element={<Home />} />
          <Route path='/Profile' element={<Profile />} />
          <Route path='/AddCash' element={<AddCash />} />
          <Route path='/Refer' element={<Refer />} />
          <Route path='/History' element={<History />} />
          <Route path='/MyWallet' element={<MyWallet />} />
          <Route path='/Notifications' element={<Notifications />} />
          <Route path='/Support' element={<Support />} />
          <Route path='/Pay' element={<Pay />} />
          <Route path='/Matchmaking' element={<Matchmaking />} />
          <Route path='/Kyc-Admin' element={<KycAdmin/>} />
          <Route path='/Kyc-Verify' element={<KycVerify />} />
          <Route path="/PaymentConfirmation" element={<PaymentConfirmation />} />
        {/* <Route
          path="/"
          element={
            <PrivateRoute>
              <HomePage />
            </PrivateRoute>
          }
        /> */}
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
