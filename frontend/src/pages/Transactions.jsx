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
      console.log("📦 Transactions data:", res.data);

      const data =
        Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.data)
            ? res.data.data
            : [];

      setTransactions(data);
      calculateStatsFromTransactions(data);
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
      console.log("📦 Items data:", res.data);

      const data =
        Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.data)
            ? res.data.data
            : Array.isArray(res.data.items)
              ? res.data.items
              : [];

      // Calculate current stock from transactions
      const itemsWithStock = data.map((item) => ({
        ...item,
        stock: item.quantity || 0, // Use quantity from items table as initial stock
      }));

      setItems(itemsWithStock);
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

    // Initialize with current quantities from items
    items.forEach(item => {
      stockMap[item.id] = item.quantity || 0;
    });

    // Apply transactions
    transactionsData.forEach((tx) => {
      const itemId = tx.item_id;
      if (!stockMap[itemId]) stockMap[itemId] = 0;
      if (tx.transaction_type === "IN") stockMap[itemId] += Number(tx.quantity) || 0;
      if (tx.transaction_type === "OUT") stockMap[itemId] -= Number(tx.quantity) || 0;
    });

    const updatedItems = items.map((item) => ({
      ...item,
      stock: Math.max(0, stockMap[item.id] || 0), // Ensure stock doesn't go negative
    }));

    setItems(updatedItems);
  };

  // ✅ Handle input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Update item stock validation when item selection changes
    if (name === 'item_id') {
      const selectedItem = items.find(item => item.id == value);
      if (selectedItem) {
        console.log(`Selected item stock: ${selectedItem.stock}`);
      }
    }
  };

  // ✅ Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.item_id) {
      setError("Please select an item");
      return;
    }

    if (!formData.quantity || formData.quantity < 1) {
      setError("Please enter a valid quantity");
      return;
    }

    const selectedItem = items.find(item => item.id == formData.item_id);

    // Stock validation for OUT transactions
    if (formData.transaction_type === "OUT" && selectedItem) {
      const currentStock = selectedItem.stock || 0;
      if (currentStock < formData.quantity) {
        setError(`Insufficient stock! Available: ${currentStock}, Requested: ${formData.quantity}`);
        return;
      }
    }

    try {
      console.log("🔄 Creating transaction:", formData);
      const response = await axios.post("http://localhost:5000/api/transactions", formData);
      console.log("✅ Transaction created:", response.data);

      setError("✅ Transaction created successfully!");
      setShowModal(false);
      setFormData({
        item_id: "",
        transaction_type: "IN",
        quantity: "",
        notes: "",
      });

      // Refresh both items & transactions
      await fetchAllData();

      // Trigger dashboard refresh
      window.dispatchEvent(new Event('dashboardRefresh'));

      setTimeout(() => setError(null), 3000);
    } catch (err) {
      console.error("❌ Error creating transaction", err);
      console.error("❌ Error details:", err.response?.data);
      setError(err.response?.data?.message || "Failed to create transaction");
    }
  };

  // Get category color for items
  const getCategoryColor = (category) => {
    if (!category) return 'bg-gray-100 text-gray-700';

    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('electronic') || categoryLower.includes('tech'))
      return 'bg-purple-100 text-purple-700';
    if (categoryLower.includes('office') || categoryLower.includes('supply'))
      return 'bg-green-100 text-green-700';
    if (categoryLower.includes('furniture') || categoryLower.includes('decor'))
      return 'bg-orange-100 text-orange-700';
    if (categoryLower.includes('tool') || categoryLower.includes('equipment'))
      return 'bg-red-100 text-red-700';

    return 'bg-blue-100 text-blue-700';
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
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
        >
          <span>+</span>
          <span>New Transaction</span>
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
          <div key={i} className={`p-4 rounded-lg border ${s.color === 'blue' ? 'bg-blue-50 border-blue-100' :
              s.color === 'green' ? 'bg-green-50 border-green-100' :
                s.color === 'red' ? 'bg-red-50 border-red-100' :
                  'bg-purple-50 border-purple-100'
            }`}>
            <h3 className={`text-sm font-medium ${s.color === 'blue' ? 'text-blue-800' :
                s.color === 'green' ? 'text-green-800' :
                  s.color === 'red' ? 'text-red-800' :
                    'text-purple-800'
              }`}>
              {s.label}
            </h3>
            <p className={`text-2xl font-bold ${s.color === 'blue' ? 'text-blue-600' :
                s.color === 'green' ? 'text-green-600' :
                  s.color === 'red' ? 'text-red-600' :
                    'text-purple-600'
              }`}>
              {s.value}
            </p>
            <p className={`text-xs mt-1 ${s.color === 'blue' ? 'text-blue-600' :
                s.color === 'green' ? 'text-green-600' :
                  s.color === 'red' ? 'text-red-600' :
                    'text-purple-600'
              }`}>
              {s.note}
            </p>
          </div>
        ))}
      </div>

      {/* Error box */}
      {error && (
        <div
          className={`mb-4 p-4 rounded-md ${error.toLowerCase().includes("success") || error.startsWith("✅")
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
                <th className="px-6 py-3 text-left text-sm text-gray-600 font-normal">Category</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600 font-normal">Type</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600 font-normal">Quantity</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600 font-normal">Date</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600 font-normal">Notes</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {tx.item_name || tx.item?.item_name || "Unknown"}
                    </td>
                    <td className="px-6 py-4">
                      {tx.item?.category ? (
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(tx.item.category)}`}>
                          {tx.item.category}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${tx.transaction_type === "IN"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                          }`}
                      >
                        {tx.transaction_type === "IN" ? "📥 IN" : "📤 OUT"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {tx.quantity}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {tx.transaction_date ? new Date(tx.transaction_date).toLocaleString() : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {tx.notes || "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400 text-sm">
                    <div className="flex flex-col items-center">
                      <span className="text-4xl mb-3">📊</span>
                      <p>No transactions found</p>
                      <p className="text-xs mt-1">Create your first transaction to get started</p>
                    </div>
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  <option value="">Select Item</option>
                  {Array.isArray(items) && items.length > 0 ? (
                    items.map((item) => {
                      const stock = item.stock ?? item.quantity ?? 0;
                      return (
                        <option key={item.id} value={item.id}>
                          {item.item_name}
                          {item.category && ` (${item.category})`}
                          — Stock: {stock}
                        </option>
                      );
                    })
                  ) : (
                    <option disabled>No items found</option>
                  )}
                </select>
                {formData.item_id && (
                  <p className="text-xs text-gray-500 mt-1">
                    Selected item stock: {
                      items.find(item => item.id == formData.item_id)?.stock ??
                      items.find(item => item.id == formData.item_id)?.quantity ??
                      0
                    }
                  </p>
                )}
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Enter quantity"
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
                  placeholder="Optional notes (reason for transaction, etc.)"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition"
                ></textarea>
              </div>

              {/* Stock Warning */}
              {formData.transaction_type === "OUT" && formData.item_id && formData.quantity && (
                (() => {
                  const selectedItem = items.find(item => item.id == formData.item_id);
                  const currentStock = selectedItem?.stock ?? selectedItem?.quantity ?? 0;
                  const requestedQuantity = parseInt(formData.quantity);

                  if (currentStock < requestedQuantity) {
                    return (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700 font-medium">
                          ⚠️ Insufficient Stock!
                        </p>
                        <p className="text-xs text-red-600 mt-1">
                          Available: {currentStock}, Requested: {requestedQuantity}
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2.5 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 transform hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={formData.transaction_type === "OUT" && formData.item_id && formData.quantity &&
                    (items.find(item => item.id == formData.item_id)?.stock ?? 0) < parseInt(formData.quantity)}
                >
                  Create Transaction
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