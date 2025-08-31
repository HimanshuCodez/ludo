import React, { useState } from "react";
import {
  Menu,
  X,
  Trophy,
  CreditCard,
  FileCheck,
  Bell,
  Settings,
  Home,
  BarChart3,
  Users,
  DollarSign,
  Barcode,
  IndianRupee,
} from "lucide-react";
import WinApprove from "./WinApprove";
import WithdrawAdmin from "./AdminWithdraw";
import AdminKycApprove from "./AdminKycApprove";
import TopUpConfirm from "./TopUpConfirm";
import NoticeChange from "./NoticeChange";
import AdminUpi from "./AdminUpi";
import CancellationApprovalList from "./CancellationApprovalList";

const Dashboard = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");

  const navigationItems = [
    {
      icon: Trophy,
      label: "Win Approve",
      key: "win-approve",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 hover:bg-yellow-100",
    },
    {
      icon: CreditCard,
      label: "Withdraw",
      key: "withdraw-admin",
      color: "text-green-600",
      bgColor: "bg-green-50 hover:bg-green-100",
    },
    {
      icon: FileCheck,
      label: "KYC Approve",
      key: "kyc-admin",
      color: "text-blue-600",
      bgColor: "bg-blue-50 hover:bg-blue-100",
    },
    {
      icon: DollarSign,
      label: "Top Up Requests",
      key: "top-up-admin",
      color: "text-pink-600",
      bgColor: "bg-pink-50 hover:bg-pink-100",
    },
    {
      icon: Bell,
      label: "Notice Change",
      key: "notice-change",
      color: "text-purple-600",
      bgColor: "bg-purple-50 hover:bg-purple-100",
    },
    {
      icon: Barcode,
      label: "UPI Manager",
      key: "admin-upi",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50 hover:bg-indigo-100",
    },
    {
      icon: Users, // Using Users icon for now, can be changed later
      label: "Cancellation Approvals",
      key: "cancellation-approvals",
      color: "text-red-600", // Red for attention
      bgColor: "bg-red-50 hover:bg-red-100",
    },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <div
        className={`fixed z-20 inset-y-0 left-0 w-72 transition-all duration-300 transform bg-white shadow-2xl lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Admin Panel</h2>
              <p className="text-blue-100 text-sm">Dashboard Control</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          <button
            onClick={() => setActiveSection("dashboard")}
            className={`group flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 w-full text-left ${
              activeSection === "dashboard"
                ? "bg-blue-50 border-blue-200 shadow-sm"
                : "bg-gray-50 hover:bg-gray-100 border-transparent hover:border-gray-200 hover:shadow-sm"
            } border`}
          >
            <div
              className={`p-2 rounded-lg ${
                activeSection === "dashboard"
                  ? "text-blue-600 bg-white"
                  : "text-gray-600 bg-white"
              } shadow-sm group-hover:shadow-md transition-shadow`}
            >
              <Home className="h-5 w-5" />
            </div>
            <span className="font-medium text-gray-700 group-hover:text-gray-900">Dashboard</span>
          </button>

          {navigationItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <button
                key={index}
                onClick={() => setActiveSection(item.key)}
                className={`group flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 w-full text-left ${
                  activeSection === item.key
                    ? `${item.bgColor.split(" ")[0]} border-${
                        item.color.split("-")[1]
                      }-200 shadow-sm`
                    : `${item.bgColor} border-transparent hover:border-gray-200 hover:shadow-sm`
                } border`}
              >
                <div
                  className={`p-2 rounded-lg ${item.color} bg-white shadow-sm group-hover:shadow-md transition-shadow`}
                >
                  <IconComponent className="h-5 w-5" />
                </div>
                <span className="font-medium text-gray-700 group-hover:text-gray-900">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm lg:hidden z-10 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-72">
        {/* Top Bar */}
        <header className="flex items-center justify-between p-6 bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <button
              className="lg:hidden p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
              onClick={() => setSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {activeSection === "dashboard" && "Dashboard"}
                  {activeSection === "win-approve" && "Win Approve"}
                  {activeSection === "withdraw-admin" && "Withdraw Management"}
                  {activeSection === "kyc-admin" && "KYC Approval"}
                  {activeSection === "top-up-admin" && "Top Up Requests"}
                  {activeSection === "notice-change" && "Notice Management"}
                  {activeSection === "admin-upi" && "UPI Management"}
                  {activeSection === "cancellation-approvals" && "Cancellation Approvals"}
                </h1>
                <p className="text-sm text-gray-500">
                  Welcome back, Imran Khan
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors relative">
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {activeSection === "dashboard" && (
              <div className="space-y-8">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-pink-50 to-pink-100 p-6 border-b border-pink-200">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-pink-500 rounded-xl">
                        <IndianRupee className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">
                          Top Up Requests
                        </h2>
                        <p className="text-gray-600">
                          Process user top-up requests
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <TopUpConfirm />
                  </div>
                </div>
              </div>
            )}

            {activeSection === "win-approve" && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-6 border-b border-yellow-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-yellow-500 rounded-xl">
                      <Trophy className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">Win Approve</h2>
                      <p className="text-gray-600">Manage winning approvals</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <WinApprove />
                </div>
              </div>
            )}

            {activeSection === "withdraw-admin" && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 border-b border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-500 rounded-xl">
                      <CreditCard className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">Withdraw Management</h2>
                      <p className="text-gray-600">Process withdrawal requests</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <WithdrawAdmin />
                </div>
              </div>
            )}

            {activeSection === "kyc-admin" && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 border-b border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-500 rounded-xl">
                      <FileCheck className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">KYC Approval</h2>
                      <p className="text-gray-600">Verify user documents</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <AdminKycApprove />
                </div>
              </div>
            )}

            {activeSection === "top-up-admin" && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-pink-50 to-pink-100 p-6 border-b border-pink-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-pink-500 rounded-xl">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">Top Up Requests</h2>
                      <p className="text-gray-600">Process user top-up requests</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <TopUpConfirm />
                </div>
              </div>
            )}

            {activeSection === "admin-upi" && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-6 border-b border-indigo-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-500 rounded-xl">
                      <Barcode className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">UPI Management</h2>
                      <p className="text-gray-600">Manage UPI payment settings</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <AdminUpi />
                </div>
              </div>
            )}

            {activeSection === "notice-change" && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 border-b border-purple-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-500 rounded-xl">
                      <Bell className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">Notice Management</h2>
                      <p className="text-gray-600">Update system notices</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <NoticeChange />
                </div>
              </div>
            )}

            {activeSection === "cancellation-approvals" && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-red-50 to-red-100 p-6 border-b border-red-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-500 rounded-xl">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">Cancellation Approvals</h2>
                      <p className="text-gray-600">Review and approve/reject cancellation requests</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <CancellationApprovalList />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;