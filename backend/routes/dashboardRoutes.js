// routes/dashboardRoutes.js
const express = require("express");
const router = express.Router();
const { getDashboardData,getTransactionStats } = require("../controllers/dashboardController");

router.get("/get", getDashboardData);
router.get("/stats" , getTransactionStats)

module.exports = router;
