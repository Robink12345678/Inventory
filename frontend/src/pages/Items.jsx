import React, { useEffect, useState, useCallback } from "react";
import { useQueryParams } from "../hooks/useQueryParams";
import * as itemService from "../services/itemService";
import Modal from "../components/Modal";

const Items = () => {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const { queryParams, setQuery } = useQueryParams();

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

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, pagination } = await itemService.getItems(queryParams);
      setItems(data);
      setPagination(pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      if (editMode) {
        await itemService.updateItem(currentItem.id, formData);
        setError("Item updated successfully");
      } else {
        await itemService.createItem(formData);
        setError("Item created successfully");
      }
      fetchItems();
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (item) => {
    setCurrentItem(item);
    setFormData(item);
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await itemService.deleteItem(id);
        setError("Item deleted successfully");
        fetchItems();
      } catch (err) {
        setError(err.message);
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
    setCurrentItem(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleExcelFileSelect = (e) => {
    setExcelFile(e.target.files[0]);
  };

  const handleExcelUpload = async () => {
    if (!excelFile) {
      setError("Please select an Excel file first");
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);
    try {
      await itemService.uploadItems(excelFile, (progressEvent) => {
        const percent = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadProgress(percent);
      });
      setError("Successfully processed items");
      fetchItems();
      setShowExcelUpload(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSearch = (e) => {
    setQuery({ search: e.target.value, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setQuery({ page: newPage });
  };

  const lowStockItems = items.filter(
    (item) => item.quantity <= item.reorder_level
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
            onClick={openAddModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            + Add Item
          </button>
          <button
            onClick={() => setShowExcelUpload(!showExcelUpload)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm font-medium"
          >
            Upload Excel
          </button>
        </div>
      </div>

      {showExcelUpload && (
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Upload Items via Excel
          </h3>
          <div className="flex gap-2 items-center mb-3">
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleExcelFileSelect}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {excelFile && (
            <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200">
              <div className="flex justify-between items-center">
                <button
                  onClick={handleExcelUpload}
                  disabled={isUploading}
                  className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 disabled:bg-green-400"
                >
                  {isUploading ? `Uploading... ${uploadProgress}%` : "Upload"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 rounded-md bg-red-50 border border-red-200 text-red-800">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        </div>
      )}

      {lowStockItems.length > 0 && (
        <div className="mb-4 bg-red-100 text-red-700 px-4 py-2 rounded-md">
          {lowStockItems.length} item(s) are below reorder level!
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-4 flex justify-between items-center">
          <input
            type="text"
            placeholder="Search items..."
            onChange={handleSearch}
            className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <div>Total: {pagination.totalItems}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                {["Item Name", "Category", "Quantity", "Reorder Level", "Unit Price", "Supplier", "Actions"].map((header) => (
                  <th key={header} className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8">
                    Loading...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8">
                    No items found.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className={item.quantity <= item.reorder_level ? "bg-red-50" : ""}>
                    <td className="px-6 py-4">{item.item_name}</td>
                    <td className="px-6 py-4">{item.category}</td>
                    <td className="px-6 py-4">{item.quantity}</td>
                    <td className="px-6 py-4">{item.reorder_level}</td>
                    <td className="px-6 py-4">{item.unit_price}</td>
                    <td className="px-6 py-4">{item.supplier}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleEdit(item)} className="mr-2">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(item.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 flex justify-between items-center">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
          >
            Previous
          </button>
          <span>
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
          >
            Next
          </button>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={closeModal} title={editMode ? "Edit Item" : "Add New Item"}>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <input
              type="text"
              name="item_name"
              placeholder="Item Name"
              value={formData.item_name}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border rounded-lg"
            />
            <input
              type="text"
              name="category"
              placeholder="Category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-lg"
            />
            <input
              type="number"
              name="quantity"
              placeholder="Quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-lg"
            />
            <input
              type="number"
              name="reorder_level"
              placeholder="Reorder Level"
              value={formData.reorder_level}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-lg"
            />
            <input
              type="number"
              step="0.01"
              name="unit_price"
              placeholder="Unit Price"
              value={formData.unit_price}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-lg"
            />
            <input
              type="text"
              name="supplier"
              placeholder="Supplier"
              value={formData.supplier}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-3 pt-5">
            <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-100 rounded-lg">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
              {editMode ? "Update Item" : "Save Item"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Items;
