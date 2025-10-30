// controllers/dashboardController.js
const Item = require("../models/Item");
const Transaction = require("../models/Transaction");
const { Op, Sequelize } = require("sequelize");

// ============================================================
// 🧩 DASHBOARD OVERVIEW CONTROLLER
// ============================================================
exports.getDashboardData = async (req, res) => {
  try {
    // ✅ Fetch basic counts
    const totalItems = await Item.count();
    const lowStockItems = await Item.count({ where: { quantity: { [require("sequelize").Op.lt]: 5 } } });

    // ✅ Fetch total quantity and total value
    const { fn, col } = require("sequelize");
    const [summary] = await Item.findAll({
      attributes: [
        [fn("SUM", col("quantity")), "totalQuantity"],
        [fn("SUM", col("unit_price")), "totalValue"],
      ],
      raw: true,
    });

    // ✅ Example: transaction stats if available
    const totalTransactions = Transaction ? await Transaction.count() : 0;

    // ✅ Group items by category (since category is now a column)
    const categorySummary = await Item.findAll({
      attributes: [
        "category",
        [fn("COUNT", col("item_name")), "itemCount"],
        [fn("SUM", col("quantity")), "totalQuantity"],
      ],
      group: ["category"],
      raw: true,
    });

    res.json({
      success: true,
      data: {
        totalItems,
        lowStockItems,
        totalQuantity: summary.totalQuantity || 0,
        totalValue: summary.totalValue || 0,
        totalTransactions,
        categorySummary,
      },
    });
  } catch (error) {
    console.error("❌ Critical error in dashboard:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// 🧩 NEW: TRANSACTION STATS CONTROLLER (Fixes 404 Error)
// ============================================================
exports.getTransactionStats = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Totals
    const totalTransactions = await Transaction.count();
    const stockIn =
      (await Transaction.sum("quantity", { where: { transaction_type: "IN" } })) || 0;
    const stockOut =
      (await Transaction.sum("quantity", { where: { transaction_type: "OUT" } })) || 0;
    const todayTransactions = await Transaction.count({
      where: { transaction_date: { [Op.between]: [startOfToday, endOfToday] } },
    });

    res.json({
      totalTransactions,
      stockIn,
      stockOut,
      todayTransactions,
    });
  } catch (error) {
    console.error("Error fetching transaction stats:", error);
    res.status(500).json({ message: "Error fetching transaction stats" });
  }
};
