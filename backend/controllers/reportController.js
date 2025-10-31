const Item = require("../models/Item");

// exports.getInventoryReport = async (req, res) => {
//   try {
//     // Fetch all items with category relationship
//     const items = await Item.findAll({
//       include: [{ model: Category, attributes: ["name"] }],
//     });

//     // Format item data for frontend
//     const itemData = items.map((item) => {
//       let status = "available";
//       if (item.quantity <= 0) status = "out";
//       else if (item.quantity <= item.reorder_level) status = "low";

//       return {
//         id: item.id,
//         item_name: item.item_name,
//         category: item.Category ? item.Category.name : "Uncategorized",
//         quantity: item.quantity,
//         reorder_level: item.reorder_level || 5,
//         status,
//       };
//     });

//     // Calculate category-level stats
//     const categories = await Category.findAll();
//     const categoryStats = await Promise.all(
//       categories.map(async (cat) => {
//         const categoryItems = items.filter(
//           (i) => i.Category && i.Category.name === cat.name
//         );

//         return {
//           name: cat.name,
//           totalItems: categoryItems.length,
//           lowStock: categoryItems.filter((i) => i.quantity <= i.reorder_level && i.quantity > 0).length,
//           outOfStock: categoryItems.filter((i) => i.quantity <= 0).length,
//         };
//       })
//     );

//     res.json({
//       items: itemData,
//       categories: categoryStats,
//     });
//   } catch (err) {
//     console.error("Error generating inventory report:", err);
//     res.status(500).json({ error: "Server error generating report" });
//   }
// };


exports.getReports = async (req, res) => {
  try {
    const reports = await Item.findAll()
    res.status(200).json(reports)
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Failed to get Items" })
  }
}