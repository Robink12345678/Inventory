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
    todayTransactions: 0,
  });

  const [formData, setFormData] = useState({
    item_id: "",
    transaction_type: "IN",
    quantity: "",
    notes: "",
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    await Promise.all([fetchItems(), fetchTransactions()]);
  };

  // ✅ Fetch transactions
  const fetchTransactions = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/transactions");
      const data =
        Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.data)
          ? res.data.data
          : [];

      setTransactions(data);
      calculateStatsFromTransactions(data);
      // recompute stock after transactions fetched
      computeCurrentStock(data);
    } catch (err) {
      console.error("❌ Error fetching transactions:", err);
      setTransactions([]);
    }
  };

  // ✅ Fetch items
  const fetchItems = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/items/get");
      const data =
        Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.data)
          ? res.data.data
          : Array.isArray(res.data.items)
          ? res.data.items
          : [];

      // Add a default stock = 0 initially
      const normalized = data.map((item) => ({
        ...item,
        stock: item.stock ?? 0,
      }));

      setItems(normalized);
    } catch (err) {
      console.error("❌ Error fetching items:", err);
      setItems([]);
    }
  };

  // ✅ Calculate statistics
  const calculateStatsFromTransactions = (transactionsData) => {
    if (!transactionsData?.length) {
      setStats({
        totalTransactions: 0,
        stockIn: 0,
        stockOut: 0,
        todayTransactions: 0,
      });
      return;
    }

    const totalTransactions = transactionsData.length;
    const stockIn = transactionsData.filter((t) => t.transaction_type === "IN").length;
    const stockOut = transactionsData.filter((t) => t.transaction_type === "OUT").length;

    const today = new Date().toDateString();
    const todayTransactions = transactionsData.filter((t) => {
      if (!t.transaction_date) return false;
      return new Date(t.transaction_date).toDateString() === today;
    }).length;

    setStats({ totalTransactions, stockIn, stockOut, todayTransactions });
  };

  // ✅ Compute live stock for each item
  const computeCurrentStock = (transactionsData) => {
    if (!Array.isArray(items) || items.length === 0) return;

    const stockMap = {};

    transactionsData.forEach((tx) => {
      const itemId = tx.item_id;
      if (!stockMap[itemId]) stockMap[itemId] = 0;
      if (tx.transaction_type === "IN") stockMap[itemId] += tx.quantity;
      if (tx.transaction_type === "OUT") stockMap[itemId] -= tx.quantity;
    });

    const updatedItems = items.map((item) => ({
      ...item,
      stock: stockMap[item.id] ?? 0,
    }));

    setItems(updatedItems);
  };

  // ✅ Handle input
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/transactions", formData);
      setError("Transaction created successfully!");
      setShowModal(false);
      setFormData({
        item_id: "",
        transaction_type: "IN",
        quantity: "",
        notes: "",
      });

      // Refresh both items & transactions
      await fetchAllData();

      setTimeout(() => setError(null), 3000);
    } catch (err) {
      console.error("❌ Error creating transaction", err);
      setError("Failed to create transaction");
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-1">Transactions</h2>
          <p className="text-gray-500 text-sm">
            Track inventory movements — Updates Dashboard & Reports
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
        >
          + New Transaction
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Transactions", value: stats.totalTransactions, color: "blue", note: "All time" },
          { label: "Stock In", value: stats.stockIn, color: "green", note: "Items received" },
          { label: "Stock Out", value: stats.stockOut, color: "red", note: "Items issued" },
          { label: "Today", value: stats.todayTransactions, color: "purple", note: "Today's activities" },
        ].map((s, i) => (
          <div key={i} className={`bg-${s.color}-50 p-4 rounded-lg border border-${s.color}-100`}>
            <h3 className={`text-sm font-medium text-${s.color}-800`}>{s.label}</h3>
            <p className={`text-2xl font-bold text-${s.color}-600`}>{s.value}</p>
            <p className={`text-xs text-${s.color}-600 mt-1`}>{s.note}</p>
          </div>
        ))}
      </div>

      {/* Error box */}
      {error && (
        <div
          className={`mb-4 p-4 rounded-md ${
            error.toLowerCase().includes("success")
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-sm">{error}</span>
            <button onClick={() => setError(null)} className="text-lg font-bold hover:opacity-70">
              ×
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm text-gray-600 font-normal">Item Name</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600 font-normal">Type</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600 font-normal">Quantity</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600 font-normal">Date</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600 font-normal">Notes</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-gray-100">
                    <td className="px-6 py-4 text-sm text-gray-900">{tx.item_name || "Unknown"}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${
                          tx.transaction_type === "IN"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{tx.quantity}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(tx.transaction_date).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{tx.notes || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-400 text-sm">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100">
      <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
        ➕ New Transaction
      </h3>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Item Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Item
          </label>
          <select
            name="item_id"
            value={formData.item_id}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          >
            <option value="">Select Item</option>
            {Array.isArray(items) && items.length > 0 ? (
              items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.item_name || item.name} — (Stock: {item.stock ?? 0})
                </option>
              ))
            ) : (
              <option disabled>No items found</option>
            )}
          </select>
        </div>

        {/* Transaction Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Transaction Type
          </label>
          <select
            name="transaction_type"
            value={formData.transaction_type}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          >
            <option value="IN">📥 IN (Add Stock)</option>
            <option value="OUT">📤 OUT (Reduce Stock)</option>
          </select>
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantity
          </label>
          <input
            type="number"
            name="quantity"
            min="1"
            value={formData.quantity}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows="2"
            placeholder="Optional notes..."
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none transition"
          ></textarea>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:from-emerald-700 hover:to-green-700 transform hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => setShowModal(false)}
            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl font-medium hover:bg-gray-200 transform hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
)}

    </div>
  );
};

export default Transactions;
