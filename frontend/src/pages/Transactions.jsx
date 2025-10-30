import React, { useEffect, useState } from "react";
import axios from "axios";

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    stockIn: 0,
    stockOut: 0,
    todayTransactions: 0
  });

  const [formData, setFormData] = useState({
    item_id: "",
    transaction_type: "IN",
    quantity: "",
    notes: ""
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    await fetchTransactions();
    await fetchItems();
  };

  const fetchTransactions = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/transactions");
      setTransactions(res.data);
      // Always calculate stats from transactions as fallback
      calculateStatsFromTransactions(res.data);
    } catch (err) {
      console.error("Error fetching transactions", err);
      setError("Failed to load transactions");
    }
  };

  const fetchItems = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/transactions");
      setItems(res.data);
    } catch (err) {
      console.error("Error fetching items", err);
    }
  };

  // Calculate stats from transactions data (reliable fallback)
  const calculateStatsFromTransactions = (transactionsData) => {
    if (!transactionsData || transactionsData.length === 0) {
      setStats({
        totalTransactions: 0,
        stockIn: 0,
        stockOut: 0,
        todayTransactions: 0
      });
      return;
    }

    const totalTransactions = transactionsData.length;
    const stockIn = transactionsData.filter(t => t.transaction_type === 'IN').length;
    const stockOut = transactionsData.filter(t => t.transaction_type === 'OUT').length;
    
    const today = new Date().toDateString();
    const todayTransactions = transactionsData.filter(t => {
      if (!t.transaction_date) return false;
      return new Date(t.transaction_date).toDateString() === today;
    }).length;

    setStats({
      totalTransactions,
      stockIn,
      stockOut,
      todayTransactions
    });
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/transactions", formData);
      await fetchTransactions(); // This will recalculate stats
      setShowModal(false);
      setFormData({
        item_id: "",
        transaction_type: "IN",
        quantity: "",
        notes: ""
      });
      setError("Transaction created successfully!");
      
      // Clear success message after 3 seconds
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      console.error("Error creating transaction", err);
      setError("Failed to create transaction");
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-1">Transactions</h2>
          <p className="text-gray-500 text-sm">Track inventory movements - Updates Dashboard & Reports</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
        >
          + New Transaction
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h3 className="text-sm font-medium text-blue-800">Total Transactions</h3>
          <p className="text-2xl font-bold text-blue-600">{stats.totalTransactions}</p>
          <p className="text-xs text-blue-600 mt-1">All time transactions</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <h3 className="text-sm font-medium text-green-800">Stock In</h3>
          <p className="text-2xl font-bold text-green-600">{stats.stockIn}</p>
          <p className="text-xs text-green-600 mt-1">Items received</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
          <h3 className="text-sm font-medium text-red-800">Stock Out</h3>
          <p className="text-2xl font-bold text-red-600">{stats.stockOut}</p>
          <p className="text-xs text-red-600 mt-1">Items issued</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <h3 className="text-sm font-medium text-purple-800">Today</h3>
          <p className="text-2xl font-bold text-purple-600">{stats.todayTransactions}</p>
          <p className="text-xs text-purple-600 mt-1">Today's activities</p>
        </div>
      </div>

      {/* Error/Success Display */}
      {error && (
        <div className={`mb-4 p-4 rounded-md ${
          error.includes('Successfully') ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex justify-between items-center">
            <span className="text-sm">{error}</span>
            <button 
              onClick={() => setError(null)}
              className="text-lg font-bold hover:opacity-70"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm text-gray-600 font-normal">Item Name</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600 font-normal">Type</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600 font-normal">Quantity</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600 font-normal">Date & Time</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600 font-normal">Notes</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-400 text-sm">
                    No transactions found. Create your first transaction to see data here.
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {transaction.item_name}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${
                        transaction.transaction_type === 'IN' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.transaction_type === 'IN' ? '📥 IN' : '📤 OUT'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-semibold">
                      {transaction.quantity}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(transaction.transaction_date).toLocaleDateString()}
                      <br />
                      <span className="text-xs text-gray-400">
                        {new Date(transaction.transaction_date).toLocaleTimeString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {transaction.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black- to-50% bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">New Transaction</h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
                  <select
                    name="item_id"
                    value={formData.item_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Item</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.item_name} (Current Stock: {item.quantity})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
                  <select
                    name="transaction_type"
                    value={formData.transaction_type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="IN">📥 IN (Stock In - Add to inventory)</option>
                    <option value="OUT">📤 OUT (Stock Out - Remove from inventory)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    onInput={(e) => (e.target.value = e.target.value.slice(0, 5))}  
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    min="1"
                    placeholder="Enter quantity"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder="Add any notes about this transaction..."
                  ></textarea>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Create Transaction
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div className="mt-4 text-right">
        <p className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Transactions update Dashboard statistics and Reports in real-time
        </p>
      </div>
    </div>
  );
};

export default Transactions;