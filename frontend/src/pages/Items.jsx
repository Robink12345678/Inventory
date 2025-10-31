// Items.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

const ensureArray = (v) => (Array.isArray(v) ? v : []); // defensive helper

const Items = () => {
  const [items, setItems] = useState([]); // always hold an array
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  const [formData, setFormData] = useState({
    item_name: "",
    category: "",
    quantity: "",
    reorder_level: "",
    unit_price: "",
    supplier: "",
  });

  const [showExcelUpload, setShowExcelUpload] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const [error, setError] = useState(null); // user visible message (success or error)

  // Fetch items on mount
  useEffect(() => {
    fetchItems();
  }, []);

  // --- Fetch items with defensive handling of response shape ---
  const fetchItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE}/items/get`);
      // Debug log — see what's returned
      console.debug("fetchItems response.data:", res.data);

      // Many APIs wrap result in { data: [...] } or { items: [...] } — handle common shapes
      let payload = res.data;
      if (payload == null) {
        setItems([]);
        return;
      }

      if (Array.isArray(payload)) {
        setItems(payload);
      } else if (Array.isArray(payload.data)) {
        setItems(payload.data);
      } else if (Array.isArray(payload.items)) {
        setItems(payload.items);
      } else {
        // If payload is an object that itself should be treated as an array,
        // convert to array of values (rare), otherwise fallback to empty array.
        console.warn(
          "fetchItems: unexpected payload shape — expected array. Payload:",
          payload
        );
        setItems([]); // fallback
      }
    } catch (err) {
      console.error("Error fetching items", err);
      setError(
        err.response?.data?.message ||
        "Failed to fetch items. Check server or network."
      );
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Input change handler ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
  };

  // Basic client-side validation for item fields
  const validateItem = (data) => {
    if (!data.item_name || data.item_name.trim() === "")
      return "Item name is required.";
    // quantity, reorder_level and unit_price should be numbers (if provided)
    if (data.quantity !== "" && isNaN(Number(data.quantity)))
      return "Quantity must be a number.";
    if (data.reorder_level !== "" && isNaN(Number(data.reorder_level)))
      return "Reorder level must be a number.";
    if (data.unit_price !== "" && isNaN(Number(data.unit_price)))
      return "Unit price must be a number.";
    return null;
  };

  // --- Create / Update item ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // validate
    const validationErr = validateItem(formData);
    if (validationErr) {
      setError(validationErr);
      return;
    }

    // Prepare payload with casted numeric fields
    const payload = {
      item_name: formData.item_name,
      category: formData.category || null,
      quantity:
        formData.quantity === "" ? null : parseInt(Number(formData.quantity), 10),
      reorder_level:
        formData.reorder_level === ""
          ? null
          : parseInt(Number(formData.reorder_level), 10),
      unit_price:
        formData.unit_price === "" ? null : parseFloat(Number(formData.unit_price)),
      supplier: formData.supplier || null,
    };

    try {
      if (editMode && currentItem && currentItem.id != null) {
        // Update — adjust endpoint path if your backend expects a different route
        await axios.put(`${API_BASE}/items/${currentItem.id}`, payload);
        setError("✅ Item updated successfully");
      } else {
        // Create — adjust endpoint path if necessary
        // Some backends expect POST /items/create, others POST /items
        // change path to match your backend.
        await axios.post(`${API_BASE}/Items`, payload);
        setError("✅ Item created successfully");
      }
      fetchItems();
      closeModal();
    } catch (err) {
      console.error("Error saving item", err);
      setError(
        err.response?.data?.message || "Failed to save item. Check server logs."
      );
    }
  };

  // --- Edit item (prefill modal) ---
  const handleEdit = (item) => {
    setCurrentItem(item);
    setFormData({
      item_name: item.item_name ?? "",
      category: item.category ?? "",
      quantity: item.quantity ?? "",
      reorder_level: item.reorder_level ?? "",
      unit_price: item.unit_price ?? "",
      supplier: item.supplier ?? "",
    });
    setEditMode(true);
    setShowModal(true);
  };

  // --- Delete item ---
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    setError(null);
    try {
      await axios.delete(`${API_BASE}/items/${id}`);
      setError("✅ Item deleted");
      fetchItems();
    } catch (err) {
      console.error("Error deleting item", err);
      setError(
        err.response?.data?.message || "Failed to delete item. Check server."
      );
    }
  };

  // --- Modal helpers ---
  const openAddModal = () => {
    setFormData({
      item_name: "",
      category: "",
      quantity: "",
      reorder_level: "",
      unit_price: "",
      supplier: "",
    });
    setEditMode(false);
    setCurrentItem(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMode(false);
    setCurrentItem(null);
    setFormData({
      item_name: "",
      category: "",
      quantity: "",
      reorder_level: "",
      unit_price: "",
      supplier: "",
    });
  };

  // --- Excel Upload ---
  const handleExcelFileSelect = (e) => {
    setError(null);
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setExcelFile(null);
      return;
    }
    const validTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.oasis.opendocument.spreadsheet",
    ];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
      setError("Please select a valid Excel file (.xlsx or .xls)");
      return;
    }
    setExcelFile(file);
  };

  const handleExcelUpload = async () => {
    setError(null);
    if (!excelFile) {
      setError("Please select an Excel file first");
      return;
    }

    const excelForm = new FormData();
    excelForm.append("excelFile", excelFile);

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Adjust endpoint to your server's Excel upload route
      const res = await axios.post(`${API_BASE}/upload/items`, excelForm, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.lengthComputable) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percent);
          }
        },
      });

      console.debug("Excel upload response", res.data);
      setError(
        `✅ Successfully processed ${res.data?.processed ?? "unknown"} items`
      );
      fetchItems();
      setExcelFile(null);
      const el = document.getElementById("excel-file-input-items");
      if (el) el.value = "";
      setShowExcelUpload(false);
    } catch (err) {
      console.error("Excel upload error:", err);
      setError(
        err.response?.data?.message ||
        "Failed to upload Excel file. Please check the format and server."
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // --- Derived values with defensive checks ---
  const safeItems = ensureArray(items);
  const lowStockItems = safeItems.filter(
    (it) =>
      it &&
      it.quantity != null &&
      it.reorder_level != null &&
      Number(it.quantity) <= Number(it.reorder_level)
  );

  const categorySuggestions = Array.from(
    new Set(safeItems.map((i) => i.category).filter(Boolean))
  );

  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-1">Items</h2>
          <p className="text-gray-500 text-sm">Manage your inventory items</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowExcelUpload((s) => !s)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm font-medium flex items-center"
          >
            📊 Upload Excel
          </button>

          <button
            onClick={openAddModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            + Add Item
          </button>
        </div>
      </div>

      {/* Excel Upload Section */}
      {showExcelUpload && (
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Upload Items via Excel
          </h3>

          <div className="flex gap-2 items-center mb-3">
            <input
              id="excel-file-input-items"
              type="file"
              accept=".xlsx, .xls"
              onChange={handleExcelFileSelect}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {excelFile && (
            <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Selected: {excelFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(excelFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleExcelUpload}
                    disabled={isUploading}
                    className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 disabled:bg-green-400"
                  >
                    {isUploading ? `Uploading... ${uploadProgress}%` : "Upload"}
                  </button>
                  <button
                    onClick={() => {
                      setExcelFile(null);
                      const el = document.getElementById("excel-file-input-items");
                      if (el) el.value = "";
                    }}
                    disabled={isUploading}
                    className="bg-gray-500 text-white px-4 py-2 rounded text-sm hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {isUploading && (
                <div className="mt-2 text-xs text-gray-600">
                  Upload progress: {uploadProgress}%
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error / Success Display */}
      {error && (
        <div
          className={`mb-4 p-4 rounded-md ${error.includes("Successfully") || error.startsWith("✅")
            ? "bg-green-50 border border-green-200 text-green-800"
            : "bg-red-50 border border-red-200 text-red-800"
            }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-sm break-words">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-lg font-bold hover:opacity-70"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Low Stock */}
      {lowStockItems.length > 0 && (
        <div className="mb-4 bg-red-100 text-red-700 px-4 py-2 rounded-md text-sm font-medium">
          ⚠️ {lowStockItems.length} item
          {lowStockItems.length > 1 ? "s are" : " is"} below reorder level!
        </div>
      )}

      {/* Items Table */}
      {/* Items Table with Advanced Design */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row justify-between gap-3 items-center bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
          <input
            type="text"
            placeholder="🔍 Search items..."
            onChange={(e) => {
              const q = e.target.value.toLowerCase();
              setItems((prev) =>
                ensureArray(prev).filter(
                  (it) =>
                    it.item_name?.toLowerCase().includes(q) ||
                    it.category?.toLowerCase().includes(q) ||
                    it.supplier?.toLowerCase().includes(q)
                )
              );
            }}
            className="w-full sm:w-1/3 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />

          <div className="flex gap-2 items-center text-sm text-gray-600">
            <span className="font-medium">Total:</span>
            <span className="text-blue-700 font-semibold">{safeItems.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                {[
                  "Item Name",
                  "Category",
                  "Quantity",
                  "Reorder Level",
                  "Unit Price",
                  "Supplier",
                  "Actions",
                ].map((header, idx) => (
                  <th
                    key={idx}
                    className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:text-blue-600 transition-colors"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : safeItems.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-8 text-center text-gray-400 text-sm italic"
                  >
                    No items found
                  </td>
                </tr>
              ) : (
                safeItems.map((item) => (
                  <tr
                    key={item.id ?? `${item.item_name}_${Math.random()}`}
                    className={`hover:bg-blue-50 transition-all ${item.quantity != null &&
                      item.reorder_level != null &&
                      Number(item.quantity) <= Number(item.reorder_level)
                      ? "bg-red-50 border-l-4 border-red-400"
                      : "bg-white"
                      }`}
                  >
                    <td className="px-6 py-4 text-gray-900 font-medium">
                      {item.item_name}
                    </td>
                    <td className="px-6 py-4 text-gray-700">{item.category ?? "—"}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-semibold ${Number(item.quantity) <= Number(item.reorder_level)
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                          }`}
                      >
                        {item.quantity ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {item.reorder_level ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      ₹{item.unit_price ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {item.supplier ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer (optional for long lists) */}
        <div className="flex justify-between items-center px-6 py-4 border-t bg-gray-50 text-sm text-gray-600">
          <span>Showing {safeItems.length} entries</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100">
              ⬅ Prev
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100">
              Next ➡
            </button>
          </div>
        </div>
      </div>

     {/* Add/Edit Modal */}
{showModal && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 animate-fadeIn">
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-md transform transition-all scale-100 hover:scale-[1.01]">
      <div className="p-6">
        <h3 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center justify-between">
          {editMode ? "✏️ Edit Item" : "➕ Add New Item"}
          <button
            onClick={closeModal}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </h3>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Item Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
            <input
              type="text"
              name="item_name"
              placeholder="Enter item name"
              value={formData.item_name}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input
              list="category-list"
              name="category"
              placeholder="Select or type category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            />
            <datalist id="category-list">
              {categorySuggestions.map((cat, idx) => (
                <option key={idx} value={cat} />
              ))}
            </datalist>
          </div>

          {/* Quantity + Reorder Level (Side by Side) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                name="quantity"
                placeholder="0"
                value={formData.quantity}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
              <input
                type="number"
                name="reorder_level"
                placeholder="0"
                value={formData.reorder_level}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Unit Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
            <input
              type="number"
              step="0.01"
              name="unit_price"
              placeholder="0.00"
              value={formData.unit_price}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            />
          </div>

          {/* Supplier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
            <input
              type="text"
              name="supplier"
              placeholder="Supplier name"
              value={formData.supplier}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-5">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-200 active:scale-95 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-600 shadow-sm active:scale-95 transition-all"
            >
              {editMode ? "Update Item" : "Save Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
)}

    
    </div>
  );
};

export default Items;
