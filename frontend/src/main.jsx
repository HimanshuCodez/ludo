import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import 'react-toastify/dist/ReactToastify.css'; // Import Toastify CSS
import { ToastContainer } from 'react-toastify'; // Import ToastContainer
// import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Import all page components
import { Home } from "./pages/Home";
import { Profile } from "./pages/Profile";
import { AddCash } from "./pages/AddCash";
import { Refer } from "./pages/Refer";
import { History } from "./pages/History";
import { MyWallet } from "./pages/MyWallet";
import { Notifications } from "./pages/Notifications";
import { Support } from "./pages/Support";
import { Matchmaking } from "./pages/Matchmaking";
import { GameRoom } from "./pages/GameRoom";
import { PrivateRoute } from "./Admin/PrivateRoute";
import Dashboard from "./Admin/Dashboard";
import AuthPage from "./pages/AuthPage";
import KycVerify from "./pages/KycVerify";
import { Pay } from "./pages/Pay";
import { PaymentConfirmation } from "./pages/PaymentConfirmation";
import Withdraw from "./pages/Withdraw";
import WinApprove from "./Admin/WinApprove";
import WithdrawAdmin from "./Admin/AdminWithdraw";
import AdminKycApprove from "./Admin/AdminKycApprove";
import NoticeChange from "./Admin/NoticeChange";
import TopUpConfirm from "./Admin/TopUpConfirm";
import AdminUpi from "./Admin/AdminUpi";

// Define routes
const router = createBrowserRouter([
  {
    path: '/',
    element: <AuthPage />,
  },
  {
    path: '/home',
    element: <Home />,
  },
  {
    path: '/Profile',
    element: <Profile />,
  },
  {
    path: '/AddCash',
    element: <AddCash />,
  },
  {
    path: '/Refer',
    element: <Refer />,
  },
  {
    path: '/History',
    element: <History />,
  },
  {
    path: '/MyWallet',
    element: <MyWallet />,
  },
  {
    path: '/Notifications',
    element: <Notifications />,
  },
  {
    path: '/Support',
    element: <Support />,
  },
  {
    path: '/Pay',
    element: <Pay />,
  },
  {
    path: '/Matchmaking',
    element: <Matchmaking />,
  },
  {
    path: '/Kyc-Admin',
    element: <AdminKycApprove />,
  },
  {
    path: '/Kyc-Verify',
    element: <KycVerify />,
  },
  {
    path: '/Withdraw',
    element: <Withdraw />,
  },
  {
    path: '/Withdraw-admin',
    element: <WithdrawAdmin />,
  },
  {
    path: '/Win-Approve',
    element: <WinApprove />,
  },
  {
    path: '/notice-change',
    element: <NoticeChange />,
  },
  {
    path: '/PaymentConfirmation',
    element: <PaymentConfirmation />,
  },
  {
    path: '/Admin-TopUp',
    element: <TopUpConfirm />,
  },
  {
    path: '/Admin-Barcode',
    element: <AdminUpi />,
  },
  {
    path: '/room/:roomId',
    element: <GameRoom />,
  },
  {
    path: '/dashboard',
    element: <PrivateRoute><Dashboard /></PrivateRoute>,
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
     <AuthProvider>
      <RouterProvider router={router} />
      <ToastContainer /> {/* Add ToastContainer here */}
    </AuthProvider>
  // </React.StrictMode>
);

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}


