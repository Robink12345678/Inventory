const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");

// Main reports endpoint
router.get("/get", reportController.getReports);

// Additional report endpoints
router.get("/stock-summary", reportController.getStockSummary);
router.get("/transaction-report", reportController.getTransactionReport);

module.exports = router;