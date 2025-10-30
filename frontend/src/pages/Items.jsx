import React, { useEffect, useState } from "react";
import axios from "axios";

const Items = () => {
  const [items, setItems] = useState([]);
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
  const [error, setError] = useState(null);

  // ✅ Fetch items
  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/items/get");
      setItems(res.data);
    } catch (err) {
      console.error("Error fetching items", err);
    }
  };

  // ✅ Handle input change
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ Create / Update item
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await axios.put(
          `http://localhost:5000/api/items/${currentItem.id}`,
          formData
        );
      } else {
        await axios.post("http://localhost:5000/api/items", formData);
      }
      fetchItems();
      closeModal();
    } catch (err) {
      console.error("Error saving item", err);
    }
  };

  // ✅ Edit item
  const handleEdit = (item) => {
    setCurrentItem(item);
    setFormData({
      item_name: item.item_name,
      category: item.category,
      quantity: item.quantity,
      reorder_level: item.reorder_level,
      unit_price: item.unit_price,
      supplier: item.supplier,
    });
    setEditMode(true);
    setShowModal(true);
  };

  // ✅ Delete item
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await axios.delete(`http://localhost:5000/api/items/${id}`);
        fetchItems();
      } catch (err) {
        console.error("Error deleting item", err);
      }
    }
  };

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
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMode(false);
    setCurrentItem(null);
  };

  // ✅ Excel Upload
  const handleExcelFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const validTypes = [
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.oasis.opendocument.spreadsheet",
      ];
      if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/)) {
        setError("Please select a valid Excel file (.xlsx or .xls)");
        return;
      }
      setExcelFile(file);
      setError(null);
    }
  };

  const handleExcelUpload = async () => {
    if (!excelFile) {
      setError("Please select an Excel file first");
      return;
    }

    const formData = new FormData();
    formData.append("excelFile", excelFile);

    try {
      setIsUploading(true);
      setUploadProgress(0);
      const response = await axios.post(
        "http://localhost:5000/api/upload/items",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percent);
          },
        }
      );
      setError(
        `✅ Successfully processed ${response.data.processed} items!`
      );
      fetchItems();
      setExcelFile(null);
      document.getElementById("excel-file-input-items").value = "";
      setShowExcelUpload(false);
    } catch (err) {
      console.error("Excel upload error:", err);
      setError(
        err.response?.data?.message ||
        "Failed to upload Excel file. Please check the format."
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // ✅ Calculate low stock items
  const lowStockItems = items.filter(
    (item) => item.quantity <= item.reorder_level
  );

  // Unique categories from existing items (for suggestions)
  const categorySuggestions = Array.from(
    new Set(items.map((i) => i.category).filter(Boolean))
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-1">Items</h2>
          <p className="text-gray-500 text-sm">Manage your inventory items</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowExcelUpload(!showExcelUpload)}
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
                      document.getElementById("excel-file-input-items").value =
                        "";
                    }}
                    disabled={isUploading}
                    className="bg-gray-500 text-white px-4 py-2 rounded text-sm hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div
          className={`mb-4 p-4 rounded-md ${error.includes("Successfully")
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
            }`}
        >
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

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="mb-4 bg-red-100 text-red-700 px-4 py-2 rounded-md text-sm font-medium">
          ⚠️ {lowStockItems.length} item
          {lowStockItems.length > 1 ? "s are" : " is"} below reorder level!
        </div>
      )}

      {/* Items Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Item Name", "Category", "Quantity", "Reorder Level", "Unit Price", "Supplier", "Actions"].map(
                  (header) => (
                    <th
                      key={header}
                      className="px-6 py-3 text-left text-sm text-gray-600 font-normal"
                    >
                      {header}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-8 text-center text-gray-400 text-sm"
                  >
                    No items found
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b ${item.quantity <= item.reorder_level
                        ? "bg-red-50 border-l-4 border-red-400"
                        : "bg-white"
                      }`}
                  >
                    <td className="px-6 py-4">{item.item_name}</td>
                    <td className="px-6 py-4">{item.category || "n/a"}</td>
                    <td className="px-6 py-4">{item.quantity}</td>
                    <td className="px-6 py-4">{item.reorder_level}</td>
                    <td className="px-6 py-4">{item.unit_price}</td>
                    <td className="px-6 py-4">{item.supplier}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">
              {editMode ? "Edit Item" : "Add New Item"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="item_name"
                placeholder="Item Name"
                value={formData.item_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border rounded-md"
              />

              {/* Category - text input with suggestion */}
              <input
                list="category-list"
                name="category"
                placeholder="Category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border rounded-md"
              />
              <datalist id="category-list">
                {categorySuggestions.map((cat, idx) => (
                  <option key={idx} value={cat} />
                ))}
              </datalist>

              <input
                type="number"
                name="quantity"
                placeholder="Quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
              />

              <input
                type="number"
                name="reorder_level"
                placeholder="Reorder Level"
                value={formData.reorder_level}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
              />

              <input
                type="number"
                step="0.01"
                name="unit_price"
                placeholder="Unit Price"
                value={formData.unit_price}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
              />

              <input
                type="text"
                name="supplier"
                placeholder="Supplier"
                value={formData.supplier}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
              />

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-300 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md"
                >
                  {editMode ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Items;
