// controllers/inventoryController.js
const getInventoryReport = async (req, res) => {
  try {
    res.status(200).json({
      items: [
        { id: 1, item_name: "Test Item", category: "Sample", quantity: 10, reorder_level: 5, status: "available" },
      ],
      categories: [
        { name: "Sample", totalItems: 1, lowStock: 0, outOfStock: 0 },
      ],
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching inventory report" });
  }
};

module.exports = { getInventoryReport };
