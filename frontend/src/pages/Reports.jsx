import React, { useEffect, useState } from "react";
import axios from "axios";

const Reports = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch all data from backend
      const [itemsRes, categoriesRes, transactionsRes] = await Promise.all([
        axios.get("http://localhost:5000/api/items"),
        axios.get("http://localhost:5000/api/categories"),
        axios.get("http://localhost:5000/api/transactions")
      ]);

      setItems(itemsRes.data || []);
      setCategories(categoriesRes.data || []);
      setTransactions(transactionsRes.data || []);

    } catch (err) {
      console.error("Error fetching reports data:", err);
      setError("Failed to fetch reports data. Please check if the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate dynamic category statistics
  const calculateCategoryStats = () => {
    if (!items.length || !categories.length) return [];

    return categories.map(category => {
      // Find items belonging to this category
      const categoryItems = items.filter(item => 
        item.category_id === category.id || item.category === category.name
      );

      // Calculate statistics
      const totalItems = categoryItems.length;
      const outOfStock = categoryItems.filter(item => 
        (item.quantity || 0) === 0
      ).length;

      return {
        name: category.name || category.category_name,
        totalItems,
        outOfStock
      };
    });
  };

  // Calculate item status dynamically
  const getItemStatus = (item) => {
    const quantity = item.quantity || 0;
    if (quantity === 0) return "out-of-stock";
    return "available";
  };

  // Get category name for an item
  const getItemCategoryName = (item) => {
    if (item.category) return item.category;
    
    const category = categories.find(cat => cat.id === item.category_id);
    return category ? category.name : "Uncategorized";
  };

  // Generate report data
  const categoryStatistics = calculateCategoryStats();
  const totalOutOfStockItems = items.filter(item => 
    (item.quantity || 0) === 0
  ).length;

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading reports data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <header className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Inventory Reports</h1>
            <p className="text-gray-500 text-sm">
              Dynamic inventory insights and analytics
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={fetchData}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm font-medium flex items-center"
            >
              <span className="mr-2">↻</span> Refresh
            </button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium">
              Export Report
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-red-600 mr-2">⚠️</span>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{items.length}</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <span className="text-xl">📦</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Categories</p>
              <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
            </div>
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <span className="text-xl">🗂️</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{totalOutOfStockItems}</p>
            </div>
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <span className="text-xl">❌</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Summary */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Stock Summary</h2>
          <p className="text-sm text-gray-500 mt-1">Current inventory status across all items</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm text-gray-600 font-normal">
                  Item Name
                </th>
                <th className="px-6 py-3 text-left text-sm text-gray-600 font-normal">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-sm text-gray-600 font-normal">
                  Current Stock
                </th>
                <th className="px-6 py-3 text-left text-sm text-gray-600 font-normal">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-12 text-center text-gray-400 text-sm"
                  >
                    <div className="text-center">
                      <span className="text-4xl mb-3 block">📊</span>
                      <p>No inventory items found</p>
                      <p className="text-xs mt-1">Add items to see reports</p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const status = getItemStatus(item);
                  const statusConfig = {
                    "available": { class: "bg-green-100 text-green-700", label: "Available" },
                    "out-of-stock": { class: "bg-red-100 text-red-700", label: "Out of Stock" }
                  };

                  return (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {item.item_name || item.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {getItemCategoryName(item)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <span className="font-semibold">{item.quantity || 0}</span> units
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2 py-1 text-xs font-medium rounded ${statusConfig[status].class}`}
                        >
                          {statusConfig[status].label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Statistics */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Category Statistics
          </h2>
          <p className="text-sm text-gray-500 mt-1">Item distribution across categories</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm text-gray-600 font-normal">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-sm text-gray-600 font-normal">
                  Total Items
                </th>
                <th className="px-6 py-3 text-left text-sm text-gray-600 font-normal">
                  Out of Stock
                </th>
                <th className="px-6 py-3 text-left text-sm text-gray-600 font-normal">
                  Health
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {categoryStatistics.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-12 text-center text-gray-400 text-sm"
                  >
                    <div className="text-center">
                      <span className="text-4xl mb-3 block">📈</span>
                      <p>No category statistics available</p>
                      <p className="text-xs mt-1">Add categories and items to see statistics</p>
                    </div>
                  </td>
                </tr>
              ) : (
                categoryStatistics.map((cat) => {
                  const healthPercentage = cat.totalItems > 0 
                    ? ((cat.totalItems - cat.outOfStock) / cat.totalItems) * 100 
                    : 0;
                  
                  const healthStatus = healthPercentage >= 80 ? "Good" : 
                                    healthPercentage >= 50 ? "Fair" : "Poor";

                  const healthConfig = {
                    "Good": { class: "bg-green-100 text-green-700", emoji: "✅" },
                    "Fair": { class: "bg-yellow-100 text-yellow-700", emoji: "⚠️" },
                    "Poor": { class: "bg-red-100 text-red-700", emoji: "❌" }
                  };

                  return (
                    <tr key={cat.name} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {cat.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <span className="font-semibold">{cat.totalItems}</span> items
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <span className="text-red-600 font-medium">{cat.outOfStock}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${healthConfig[healthStatus].class}`}
                        >
                          <span className="mr-1">{healthConfig[healthStatus].emoji}</span>
                          {healthStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Last Updated */}
      <div className="mt-4 text-right">
        <p className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default Reports;