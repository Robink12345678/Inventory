import React, { useEffect, useState } from "react";
import axios from "axios";

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalItems: 0,
    totalTransactions: 0,
    totalOut: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
    
    // Listen for refresh events from Transactions component
    const handleRefresh = () => {
      console.log("🔄 Dashboard refresh triggered");
      fetchDashboardData();
    };
    
    window.addEventListener('dashboardRefresh', handleRefresh);
    
    return () => {
      window.removeEventListener('dashboardRefresh', handleRefresh);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setError("")
      setLoading(true);

      console.log("🔄 Fetching dashboard data...");
      const res = await axios.get("http://localhost:5000/api/dashboard");

      console.log("✅ Dashboard data received:", res.data);
      setDashboardData({
        totalItems: res.data.totalItems || 0,
        totalTransactions: res.data.totalTransactions || 0,
        totalOut: res.data.totalOutCount || res.data.totalOut || 0,
      });
    } catch (err) {
      console.error("❌ Error fetching dashboard data:", err);

      if (err.response) {
        setError(
          `Server Error: ${err.response.status} - ${err.response.data?.error || "Unknown error"
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
        totalOut: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    console.log("🔄 Manual refresh triggered");
    fetchDashboardData();
  };

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
            Overview of your inventory status - Updates automatically when new transactions are created
          </p>
        </div>
        <button
          onClick={refreshData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          <p className="text-xs text-gray-500">Unique items in inventory</p>
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
          <p className="text-xs text-gray-500">All stock movements</p>
        </div>

        {/* Total OUT Transactions */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-gray-600 text-sm mb-1">Stock OUT</p>
              <p className="text-3xl font-bold text-red-600">
                {dashboardData.totalOut}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📤</span>
            </div>
          </div>
          <p className="text-xs text-gray-500">Items issued out</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;