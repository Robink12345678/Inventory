import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";

const MainLayout = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div
      className="flex min-h-screen"
      style={{
        backgroundColor: "#e9f7f2", // ✅ Soft background for full layout
        overflow: "hidden",
      }}
    >
      {/* Sidebar (Static - No Scroll) */}
      <div
        className="w-72 p-8 text-white flex flex-col"
        style={{
          backgroundColor: "#106b4c",
          fontSize: "1.1rem",
          flexShrink: 0, // ✅ Prevent sidebar from resizing
          height: "1700px", // ✅ Fixed height (no scroll)
          position: "sticky", // ✅ Stick to top
          top: 0,
        }}
      >
        <h2 className="text-xl font-semibold mb-10 text-white tracking-wide text-center">
          Inventory Management
        </h2>

        <ul className="space-y-4">
          <li>
            <Link
              to="/dashboard"
              className={`flex items-center gap-4 py-3 px-3 rounded-lg transition-all duration-200 ${
                isActive("/dashboard")
                  ? "bg-emerald-900 text-white font-semibold"
                  : "hover:bg-emerald-900 text-white"
              }`}
            >
              <span>📊</span>
              <span>Dashboard</span>
            </Link>
          </li>

          <li>
            <Link
              to="/items"
              className={`flex items-center gap-4 py-3 px-3 rounded-lg transition-all duration-200 ${
                isActive("/items")
                  ? "bg-emerald-900 text-white font-semibold"
                  : "hover:bg-emerald-900 text-white"
              }`}
            >
              <span>📦</span>
              <span>Items</span>
            </Link>
          </li>

          <li>
            <Link
              to="/transactions"
              className={`flex items-center gap-4 py-3 px-3 rounded-lg transition-all duration-200 ${
                isActive("/transactions")
                  ? "bg-emerald-900 text-white font-semibold"
                  : "hover:bg-emerald-900 text-white"
              }`}
            >
              <span>🔄</span>
              <span>Transactions</span>
            </Link>
          </li>

          <li>
            <Link
              to="/categories"
              className={`flex items-center gap-4 py-3 px-3 rounded-lg transition-all duration-200 ${
                isActive("/categories")
                  ? "bg-emerald-900 text-white font-semibold"
                  : "hover:bg-emerald-900 text-white"
              }`}
            >
              <span>🗂️</span>
              <span>Categories</span>
            </Link>
          </li>

          <li>
            <Link
              to="/reports"
              className={`flex items-center gap-4 py-3 px-3 rounded-lg transition-all duration-200 ${
                isActive("/reports")
                  ?"bg-emerald-900 text-white font-semibold"
                  : "hover:bg-emerald-900 text-white"
              }`}
            >
              <span>📑</span>
              <span>Reports</span>
            </Link>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-10 py-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded flex items-center justify-center">
              <span className="text-3xl">📋</span>
            </div>
            <h1 className="text-3xl font-semibold text-gray-900">
              Training Institute ERP
            </h1>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-10 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
