const express = require("express");
const router = express.Router();
const Item = require("../models").Item;

// @desc    Seed test data
// @route   POST /api/v1/dev/test-data
// @access  Development
router.post("/test-data", async (req, res) => {
  try {
    // Clear existing items
    await Item.destroy({ where: {} });

    // Create test items
    const testItems = [
      {
        item_name: "Laptop Dell XPS",
        category: "Electronics",
        quantity: 15,
        reorder_level: 5,
        unit_price: 1299.99,
        supplier: "Dell Technologies",
      },
      {
        item_name: "Office Chair",
        category: "Furniture",
        quantity: 8,
        reorder_level: 3,
        unit_price: 199.99,
        supplier: "Furniture World",
      },
      {
        item_name: "Wireless Mouse",
        category: "Electronics",
        quantity: 25,
        reorder_level: 10,
        unit_price: 29.99,
        supplier: "Tech Accessories Inc",
      },
    ];

    await Item.bulkCreate(testItems);

    res.json({
      success: true,
      message: "Test data created successfully",
      items: testItems,
    });
  } catch (error) {
    console.error("❌ Test data error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
