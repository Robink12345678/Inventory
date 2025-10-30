const express = require("express");
const router = express.Router();
const { getInventoryReport } = require("../controllers/inventoryController");

// ✅ Make sure this route exists
router.get("/", getInventoryReport);

module.exports = router;
