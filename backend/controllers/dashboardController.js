// controllers/dashboardController.js
const Item = require("../models/Item");
const Transaction = require("../models/Transaction");
const { Op, Sequelize } = require("sequelize");

// ============================================================
// 🧩 DASHBOARD OVERVIEW CONTROLLER - MODIFIED FOR YOUR UI
// ============================================================
exports.getDashboardData = async (req, res) => {
  try {
    // ✅ Fetch exact counts for your dashboard (matching your image)
    const totalItems = await Item.count(); // Should return 0 (as shown)
    const totalTransactions = await Transaction.count(); // Should return 0 (as shown)

    // ✅ Get stock OUT count specifically for your dashboard card
    const stockOut = await Transaction.sum('quantity', { 
      where: { transaction_type: 'OUT' } 
    }) || 0;

    res.json({
      success: true,
      data: {
        // Exact values matching your dashboard image
        totalItems: totalItems || 0,           // Shows 0 in your image
        totalTransactions: totalTransactions || 0, // Shows 0 in your image
        stockOut: stockOut || 0,               // Shows 0 in your image
        
        // Keep existing data for other functionality
        lowStockItems: await Item.count({ where: { quantity: { [Op.lt]: 5 } } }) || 0,
        totalQuantity: await Item.sum('quantity') || 0,
        totalValue: await Item.sum('unit_price') || 0,
        categorySummary: await getCategorySummary()
      },
    });
  } catch (error) {
    console.error("❌ Critical error in dashboard:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// 🧩 TRANSACTION STATS CONTROLLER - SIMPLIFIED
// ============================================================
exports.getTransactionStats = async (req, res) => {
  try {
    const totalTransactions = await Transaction.count(); // Should be 0
    const stockOut = await Transaction.sum('quantity', { 
      where: { transaction_type: 'OUT' } 
    }) || 0; // Should be 0

    res.json({
      totalTransactions: totalTransactions || 0, // Matches your "0" display
      stockOut: stockOut || 0, // Matches your "0" in Stock OUT card
      stockIn: await Transaction.sum('quantity', { where: { transaction_type: 'IN' } }) || 0,
      todayTransactions: await Transaction.count({
        where: { 
          transaction_date: { 
            [Op.between]: [new Date().setHours(0,0,0,0), new Date().setHours(23,59,59,999)] 
          } 
        }
      }) || 0
    });
  } catch (error) {
    console.error("Error fetching transaction stats:", error);
    res.status(500).json({ message: "Error fetching transaction stats" });
  }
};

// ============================================================
// 🧩 HELPER FUNCTION
// ============================================================
async function getCategorySummary() {
  try {
    const { fn, col } = require("sequelize");
    return await Item.findAll({
      attributes: [
        "category",
        [fn("COUNT", col("item_name")), "itemCount"],
        [fn("SUM", col("quantity")), "totalQuantity"],
      ],
      group: ["category"],
      raw: true,
    });
  } catch (error) {
    return [];
  }
}