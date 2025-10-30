import React, { useEffect, useState } from "react";
import axios from "axios";

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalItems: 0,
    totalTransactions: 0,
    totalCategories: 0,
    totalIn: 0,
    totalOut: 0,
    recentTransactions: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setError("");
      setLoading(true);

      console.log("🔄 Fetching dashboard data...");
      const res = await axios.get("http://localhost:5000/api/dashboard");

      console.log("✅ Dashboard data received:", res.data);
      setDashboardData({
        totalItems: res.data.totalItems || 0,
        totalTransactions: res.data.totalTransactions || 0,
        totalCategories: res.data.totalCategories || 0,
        totalIn: res.data.totalIn || 0,
        // ✅ Show total number of OUT transactions instead of quantity
        totalOut: res.data.totalOutCount || res.data.totalOut || 0,
        recentTransactions: res.data.recentTransactions || [],
      });
    } catch (err) {
      console.error("❌ Error fetching dashboard data:", err);

      if (err.response) {
        setError(
          `Server Error: ${err.response.status} - ${
            err.response.data?.error || "Unknown error"
          }`
        );
      } else if (err.request) {
        setError(
          "Network Error: Unable to connect to server. Please check if the backend is running."
        );
      } else {
        setError("Unexpected Error: " + err.message);
      }

      setDashboardData({
        totalItems: 0,
        totalTransactions: 0,
        totalCategories: 0,
        totalIn: 0,
        totalOut: 0,
        recentTransactions: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => fetchDashboardData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-1">Dashboard</h2>
          <p className="text-gray-500 text-sm">
            Overview of your inventory status
          </p>
        </div>
        <button
          onClick={refreshData}
          className="px-4 py-2 bg- text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          ↻ Refresh Data
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-red-600 mr-2">⚠️</span>
              <p className="text-red-600">{error}</p>
            </div>
            <button
              onClick={() => setError("")}
              className="text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Items */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Items</p>
              <p className="text-3xl font-bold text-gray-900">
                {dashboardData.totalItems}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📦</span>
            </div>
          </div>
        </div>

        {/* Total Transactions */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Transactions</p>
              <p className="text-3xl font-bold text-gray-900">
                {dashboardData.totalTransactions}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🔄</span>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-gray-600 text-sm mb-1">Categories</p>
              <p className="text-3xl font-bold text-gray-900">
                {dashboardData.totalCategories}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🗂️</span>
            </div>
          </div>
        </div>

        {/* Total Stock IN */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Stock IN</p>
              <p className="text-3xl font-bold text-green-600">
                {dashboardData.totalIn}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📥</span>
            </div>
          </div>
        </div>
      </div>

      {/* Total OUT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">
                Total Items OUT (by count)
              </p>
              <p className="text-2xl font-bold text-red-600">
                {dashboardData.totalOut}
              </p>
            </div>
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <span className="text-xl">📤</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">
            Recent Transactions
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm text-gray-600 font-normal">
                  Item Name
                </th>
                <th className="px-6 py-3 text-left text-sm text-gray-600 font-normal">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-sm text-gray-600 font-normal">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-sm text-gray-600 font-normal">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.recentTransactions.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-8 text-center text-gray-400 text-sm"
                  >
                    No recent transactions
                  </td>
                </tr>
              ) : (
                dashboardData.recentTransactions.map((transaction, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {transaction.itemName}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center text-xs font-medium ${
                          transaction.type === "IN"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.type === "IN" ? "↓" : "↑"}{" "}
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {transaction.quantity}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {transaction.date}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
