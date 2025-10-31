// import React, { useEffect, useState } from "react";
// import axios from "axios";

// const Categories = () => {
//   const [categories, setCategories] = useState([]); // always array
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [showModal, setShowModal] = useState(false);
//   const [editMode, setEditMode] = useState(false);
//   const [currentCategory, setCurrentCategory] = useState(null);
//   const [formData, setFormData] = useState({ name: "" });

//   // ✅ Fetch categories from backend
//   useEffect(() => {
//     fetchAllData();
//   }, []);

//   const fetchAllData = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const res = await axios.get("http://localhost:5000/api/inventory/get");

//       // ✅ Defensive parsing - handle multiple backend shapes
//       const categoryList = Array.isArray(res?.data)
//         ? res.data
//         : Array.isArray(res?.data?.categories)
//           ? res.data.categories
//           : [];

//       setCategories(categoryList);
//     } catch (err) {
//       console.error("Error fetching data", err);
//       setError("Failed to fetch categories. Please check backend.");
//       setCategories([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ✅ Handle input
//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   // ✅ Add or Update Category
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       if (editMode && currentCategory) {
//         await axios.put(
//           `http://localhost:5000/api/categories/${currentCategory.id}`,
//           formData
//         );
//       } else {
//         await axios.post("http://localhost:5000/api/categories/create", formData);
//       }
//       fetchAllData();
//       closeModal();
//     } catch (err) {
//       console.error("Error saving category", err);
//       setError("Failed to save category. Please try again.");
//     }
//   };

//   // ✅ Edit
//   const handleEdit = (cat) => {
//     setCurrentCategory(cat);
//     setFormData({ name: cat.name });
//     setEditMode(true);
//     setShowModal(true);
//   };

//   // ✅ Delete
//   const handleDelete = async (id) => {
//     if (!window.confirm("Are you sure you want to delete this category?")) return;
//     try {
//       await axios.delete(`http://localhost:5000/api/categories/${id}`);
//       fetchAllData();
//     } catch (err) {
//       console.error("Error deleting category", err);
//       setError("Failed to delete category.");
//     }
//   };

//   // ✅ Modal Control
//   const openAddModal = () => {
//     setFormData({ name: "" });
//     setEditMode(false);
//     setShowModal(true);
//   };

//   const closeModal = () => {
//     setShowModal(false);
//     setEditMode(false);
//     setCurrentCategory(null);
//   };

//   // ✅ Optional Stats (safe to run only on arrays)
//   const calculateCategoryStats = () => {
//     if (!Array.isArray(categories)) return { total: 0 };
//     return { total: categories.length };
//   };

//   const stats = calculateCategoryStats();

//   // ✅ UI Rendering
//   return (
//     <div className="p-8">
//       <div className="flex justify-between items-center mb-6">
//         <div>
//           <h2 className="text-3xl font-bold text-gray-900 mb-1">Categories</h2>
//           <p className="text-gray-500 text-sm">
//             Manage and track your category data
//           </p>
//         </div>
//         <button
//           onClick={openAddModal}
//           className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
//         >
//           + Add Category
//         </button>
//       </div>

//       {/* ✅ Error / Loading */}
//       {loading && (
//         <div className="text-gray-500 text-sm mb-3">Loading categories...</div>
//       )}
//       {error && (
//         <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
//           {error}
//         </div>
//       )}

//       {/* ✅ Stats */}
//       <div className="mb-4 text-sm text-gray-600">
//         Total Categories: <strong>{stats.total}</strong>
//       </div>

//       {/* ✅ Table */}
//       <div className="bg-white rounded-lg shadow-sm border border-gray-100">
//         <div className="overflow-x-auto">
//           <table className="min-w-full">
//             <thead className="bg-gray-50 border-b border-gray-200">
//               <tr>
//                 <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
//                   Category Name
//                 </th>
//                 <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
//                   Actions
//                 </th>
//               </tr>
//             </thead>
//             <tbody>
//               {(!Array.isArray(categories) || categories.length === 0) && !loading ? (
//                 <tr>
//                   <td
//                     colSpan="2"
//                     className="px-6 py-8 text-center text-gray-400 text-sm"
//                   >
//                     No categories found
//                   </td>
//                 </tr>
//               ) : (
//                 categories.map((cat) => (
//                   <tr key={cat.id} className="border-b hover:bg-gray-50">
//                     <td className="px-6 py-3 text-gray-800">{cat.name}</td>
//                     <td className="px-6 py-3">
//                       <button
//                         onClick={() => handleEdit(cat)}
//                         className="text-blue-600 hover:text-blue-800 mr-3"
//                       >
//                         Edit
//                       </button>
//                       <button
//                         onClick={() => handleDelete(cat.id)}
//                         className="text-red-600 hover:text-red-800"
//                       >
//                         Delete
//                       </button>
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* ✅ Modal */}
//       {showModal && (
//         <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30">
//           <div className="bg-white rounded-lg p-6 w-full max-w-md">
//             <h3 className="text-xl font-bold mb-4">
//               {editMode ? "Edit Category" : "Add Category"}
//             </h3>
//             <form onSubmit={handleSubmit} className="space-y-4">
//               <input
//                 type="text"
//                 name="name"
//                 placeholder="Category Name"
//                 value={formData.name}
//                 onChange={handleChange}
//                 required
//                 className="w-full px-3 py-2 border rounded-md"
//               />
//               <div className="flex justify-end gap-2">
//                 <button
//                   type="button"
//                   onClick={closeModal}
//                   className="px-4 py-2 bg-gray-300 rounded-md"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="px-4 py-2 bg-blue-600 text-white rounded-md"
//                 >
//                   {editMode ? "Update" : "Save"}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Categories;
