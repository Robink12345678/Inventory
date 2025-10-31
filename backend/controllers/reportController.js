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


const db = require("../models");
const Transaction = db.Transaction;

exports.getReports = async (req, res) => {
  try {
    console.log("📊 Generating reports...");
    
    // Fetch items and transactions in parallel
    const [items, transactions] = await Promise.all([
      Item.findAll({
        order: [['item_name', 'ASC']]
      }),
      Transaction.findAll({
        order: [['createdAt', 'DESC']],
        limit: 100 // Limit to recent transactions
      })
    ]);

    console.log(`✅ Found ${items.length} items and ${transactions.length} transactions for report`);

    // Calculate report statistics
    const totalItems = items.length;
    const totalTransactions = transactions.length;
    
    const outOfStockItems = items.filter(item => (item.quantity || 0) === 0).length;
    const lowStockItems = items.filter(item => {
      const quantity = item.quantity || 0;
      const reorderLevel = item.reorder_level || 0;
      return quantity > 0 && quantity <= reorderLevel;
    }).length;

    const stockInTransactions = transactions.filter(t => t.transaction_type === 'IN').length;
    const stockOutTransactions = transactions.filter(t => t.transaction_type === 'OUT').length;

    // Get categories
    const categories = [...new Set(items.map(item => item.category).filter(Boolean))];

    // Prepare response
    const reportData = {
      summary: {
        totalItems,
        totalTransactions,
        outOfStockItems,
        lowStockItems,
        stockInTransactions,
        stockOutTransactions,
        totalCategories: categories.length
      },
      items: items.map(item => ({
        id: item.id,
        item_name: item.item_name,
        category: item.category,
        quantity: item.quantity || 0,
        reorder_level: item.reorder_level || 0,
        unit_price: item.unit_price || 0,
        supplier: item.supplier,
        status: (item.quantity || 0) === 0 ? 'out-of-stock' : 
                (item.quantity || 0) <= (item.reorder_level || 0) ? 'low-stock' : 'available'
      })),
      transactions: transactions.map(transaction => ({
        id: transaction.id,
        item_id: transaction.item_id,
        item_name: transaction.item_name,
        transaction_type: transaction.transaction_type,
        quantity: transaction.quantity,
        notes: transaction.notes,
        date: transaction.transaction_date || transaction.createdAt,
        createdAt: transaction.createdAt
      })),
      categories,
      generatedAt: new Date().toISOString()
    };

    res.json(reportData);

  } catch (error) {
    console.error("❌ Error generating reports:", error);
    res.status(500).json({ 
      error: "Failed to generate reports",
      details: error.message 
    });
  }
};

// Additional report endpoints
exports.getStockSummary = async (req, res) => {
  try {
    const items = await Item.findAll({
      order: [['item_name', 'ASC']]
    });

    const stockSummary = items.map(item => ({
      id: item.id,
      item_name: item.item_name,
      category: item.category,
      current_stock: item.quantity || 0,
      reorder_level: item.reorder_level || 0,
      unit_price: item.unit_price || 0,
      supplier: item.supplier,
      status: (item.quantity || 0) === 0 ? 'Out of Stock' : 
              (item.quantity || 0) <= (item.reorder_level || 0) ? 'Low Stock' : 'In Stock'
    }));

    res.json({
      totalItems: items.length,
      outOfStock: items.filter(item => (item.quantity || 0) === 0).length,
      lowStock: items.filter(item => {
        const quantity = item.quantity || 0;
        const reorderLevel = item.reorder_level || 0;
        return quantity > 0 && quantity <= reorderLevel;
      }).length,
      inStock: items.filter(item => (item.quantity || 0) > (item.reorder_level || 0)).length,
      items: stockSummary
    });

  } catch (error) {
    console.error("❌ Error generating stock summary:", error);
    res.status(500).json({ error: "Failed to generate stock summary" });
  }
};

exports.getTransactionReport = async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    
    let whereClause = {};
    
    // Date filter
    if (startDate && endDate) {
      whereClause.createdAt = {
        [db.Sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    // Transaction type filter
    if (type && ['IN', 'OUT'].includes(type)) {
      whereClause.transaction_type = type;
    }

    const transactions = await Transaction.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Item,
          attributes: ['id', 'item_name', 'category'],
          required: false
        }
      ]
    });

    const report = transactions.map(transaction => ({
      id: transaction.id,
      date: transaction.transaction_date || transaction.createdAt,
      item_name: transaction.item_name,
      category: transaction.Item?.category,
      type: transaction.transaction_type,
      quantity: transaction.quantity,
      notes: transaction.notes
    }));

    res.json({
      totalTransactions: transactions.length,
      stockIn: transactions.filter(t => t.transaction_type === 'IN').length,
      stockOut: transactions.filter(t => t.transaction_type === 'OUT').length,
      transactions: report
    });

  } catch (error) {
    console.error("❌ Error generating transaction report:", error);
    res.status(500).json({ error: "Failed to generate transaction report" });
  }
};