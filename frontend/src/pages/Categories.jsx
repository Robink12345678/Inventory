import React, { useEffect, useState } from "react";
import axios from "axios";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  // Default categories for educational institution
  const defaultCategories = [
    "Study Materials",
    "Furniture",
    "Lab Equipment",
    "Electronics",
    "Stationery",
    "Cleaning Supplies",
    "Office Equipment"
  ];

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data needed for calculations
      const [categoriesRes, itemsRes, transactionsRes] = await Promise.all([
        // axios.get("http://localhost:5000/api/categories"),
        axios.get("http://localhost:5000/api/items/get"),
        axios.get("http://localhost:5000/api/transactions")
      ]);

      setCategories(categoriesRes.data);
      setItems(itemsRes.data);
      setTransactions(transactionsRes.data);
      
    } catch (err) {
      console.error("Error fetching data", err);
      setError("Failed to fetch data from server.");
    } finally {
      setLoading(false);
    }
  };

  const addDefaultCategory = async (categoryName) => {
    try {
      setError(null);
      await axios.post("http://localhost:5000/api/categories", {
        name: categoryName,
        description: `${categoryName} category for inventory management`
      });
      
      // Refresh data after adding category
      fetchAllData();
      setNewCategory("");
      setShowAddCategory(false);
    } catch (err) {
      console.error("Error adding category", err);
      setError("Failed to add category. It might already exist.");
    }
  };

  const addCustomCategory = async () => {
    if (!newCategory.trim()) {
      setError("Please enter a category name");
      return;
    }
    
    await addDefaultCategory(newCategory.trim());
  };

  // Calculate REAL statistics based on actual items and transactions
  const calculateCategoryStats = () => {
    const categoryStats = {};
    
    // Initialize with categories from backend
    categories.forEach(cat => {
      categoryStats[cat.name] = {
        name: cat.name,
        itemCount: 0,
        totalQuantity: 0,
        totalTransactions: 0
      };
    });

    // Count items for each category
    items.forEach(item => {
      if (item.category && categoryStats[item.category]) {
        categoryStats[item.category].itemCount += 1;
        categoryStats[item.category].totalQuantity += parseInt(item.quantity) || 0;
      }
    });

    // Count transactions for each category
    transactions.forEach(transaction => {
      // Find the item for this transaction to get its category
      const item = items.find(i => i.id === transaction.item_id);
      if (item && item.category && categoryStats[item.category]) {
        categoryStats[item.category].totalTransactions += 1;
      }
    });

    return Object.values(categoryStats);
  };

  const displayCategories = calculateCategoryStats();

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-1">Categories</h2>
        <p className="text-gray-500 text-sm">Live category statistics based on your inventory</p>
      </div>

      {/* Add Category Section */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Manage Categories</h3>
          <button
            onClick={() => setShowAddCategory(!showAddCategory)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium flex items-center"
          >
            <span className="mr-2">+</span> Add Category
          </button>
        </div>

        {showAddCategory && (
          <div className="border-t border-gray-200 pt-4">
            {/* Quick Add Default Categories */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Add Common Categories:</h4>
              <div className="flex flex-wrap gap-2">
                {defaultCategories.map((category, index) => (
                  <button
                    key={index}
                    onClick={() => addDefaultCategory(category)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm transition-colors border border-gray-300"
                  >
                    + {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Category Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Enter custom category name..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && addCustomCategory()}
              />
              <button
                onClick={addCustomCategory}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm font-medium"
              >
                Add Custom
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm text-gray-600 font-normal">
                  Category Name
                </th>
                <th className="px-6 py-3 text-left text-sm text-gray-600 font-normal">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-sm text-gray-600 font-normal">
                  Total Stock
                </th>
                <th className="px-6 py-3 text-left text-sm text-gray-600 font-normal">
                  Transactions
                </th>
                <th className="px-6 py-3 text-left text-sm text-gray-600 font-normal">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-400 text-sm">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                      Loading categories...
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-red-500 text-sm">
                    <div className="flex items-center justify-center text-red-600">
                      <span className="mr-2">⚠️</span>
                      {error}
                    </div>
                  </td>
                </tr>
              ) : displayCategories.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="text-center">
                      <span className="text-4xl mb-3 block">📁</span>
                      <p className="text-gray-400 text-sm mb-2">No categories found</p>
                      <p className="text-gray-400 text-xs">Use the "Add Category" button above to get started</p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayCategories.map((category, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {category.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        category.itemCount > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {category.itemCount} {category.itemCount === 1 ? 'item' : 'items'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <span className="font-semibold">{category.totalQuantity}</span> units
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {category.totalTransactions} {category.totalTransactions === 1 ? 'transaction' : 'transactions'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        category.itemCount > 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {category.itemCount > 0 ? 'Active' : 'No Items'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    

      {/* Summary Cards */}
      {!loading && !error && displayCategories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="text-sm font-medium text-blue-800">Total Categories</h3>
            <p className="text-2xl font-bold text-blue-600">{displayCategories.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <h3 className="text-sm font-medium text-green-800">Total Items</h3>
            <p className="text-2xl font-bold text-green-600">
              {displayCategories.reduce((sum, cat) => sum + cat.itemCount, 0)}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <h3 className="text-sm font-medium text-purple-800">Total Stock</h3>
            <p className="text-2xl font-bold text-purple-600">
              {displayCategories.reduce((sum, cat) => sum + cat.totalQuantity, 0)}
            </p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
            <h3 className="text-sm font-medium text-orange-800">Active Categories</h3>
            <p className="text-2xl font-bold text-orange-600">
              {displayCategories.filter(cat => cat.itemCount > 0).length}
            </p>
          </div>
        </div>
      )}

   
      
    </div>
  );
};

export default Categories;