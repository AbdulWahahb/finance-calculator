import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { FiMenu, FiX, FiSettings } from "react-icons/fi";

import {
  FiLogOut,
} from "react-icons/fi";
const Navbar: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname === `/sales`;
  };

  const navLinks = [
    { path: "/", label: "Sales" },
    { path: "/dashboard", label: "Dashboard" },
    { path: "/settings", label: "Settings", icon: FiSettings },
  ];

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center sticky top-0 z-40">
        <h1 className="text-xl font-bold text-blue-600">📊 Sales Tracker</h1>
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          {isSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-blue-600 to-blue-700 text-white w-64 transform transition-transform duration-300 ease-in-out z-40 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          } lg:relative lg:translate-x-0`}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-blue-500">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-3xl">📊</span>
            <span>Sales Tracker</span>
          </h1>
          <p className="text-blue-100 text-sm mt-1">Sales Management System</p>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-2">
          {navLinks.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive(path)
                ? "bg-white text-blue-600 font-semibold shadow-lg"
                : "text-blue-100 hover:bg-blue-500 hover:text-white"
                }`}
            >
              {/* <Icon size={20} /> */}
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* Divider */}
        <div className="mx-4 border-t border-blue-500" />

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-blue-500">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-blue-100 hover:bg-blue-500 hover:text-white transition-all duration-200 group">
            <FiLogOut size={20} />
            <span>Logout</span>
          </button>

          {/* User Info */}
          <div className="mt-4 p-3 bg-blue-500 rounded-lg text-sm">
            <p className="text-blue-100">Logged in as</p>
            <p className="font-semibold text-white">Admin User</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Navbar;
