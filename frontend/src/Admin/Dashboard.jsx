import React, { useState } from "react";
import WinApprove from "./WinApprove";
import WithdrawAdmin from "./AdminWithdraw";
import AdminKycApprove from "./AdminKycApprove";
import { Menu, X } from "lucide-react"; // or any icons
import { Link } from "react-router-dom";

const Dashboard = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`fixed z-20 inset-y-0 left-0 w-64 transition-transform transform bg-white shadow-lg lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Admin Panel</h2>
        </div>
        <nav className="p-4 space-y-4">
          <Link to={"/Win-Approve"}>
            <button className="w-full text-left text-gray-700">
              🏆 Win Approve
            </button>
          </Link>
          <Link to={"/Withdraw-admin"}>
            <button className="w-full text-left text-gray-700">
              💸 Withdraw
            </button>
          </Link>
          <Link to={"/Kyc-Admin"}>
            {" "}
            <button className="w-full text-left text-gray-700">
              📄 KYC Approve
            </button>
          </Link>
        </nav>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-30 lg:hidden z-10"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center justify-between p-4 bg-white shadow-md">
          <button
            className="lg:hidden text-gray-700"
            onClick={() => setSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h1 className="text-xl font-bold">Dashboard</h1>
        </header>

        {/* Content */}
        <main className="p-6 overflow-y-auto space-y-6">
          <div className="bg-white rounded-xl shadow-md p-4">
            <h2 className="text-lg font-semibold mb-4">Win Approve</h2>
            <WinApprove />
          </div>

          <div className="bg-white rounded-xl shadow-md p-4">
            <h2 className="text-lg font-semibold mb-4">Withdraw Requests</h2>
            <WithdrawAdmin />
          </div>

          <div className="bg-white rounded-xl shadow-md p-4">
            <h2 className="text-lg font-semibold mb-4">KYC Approve</h2>
            <AdminKycApprove />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
