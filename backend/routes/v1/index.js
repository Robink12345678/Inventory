const express = require('express');
const router = express.Router();

module.exports = (db) => {
  const itemRoutes = require('../itemRoutes')(db);
  const transactionRoutes = require('../transactionRoutes');
  const reportRoutes = require('../reportRoutes');
  const dashboardRoutes = require('../dashboardRoutes');
  const uploadRoutes = require('../uploadRoutes');

  router.use('/items', itemRoutes);
  router.use('/transactions', transactionRoutes);
  router.use('/reports', reportRoutes);
  router.use('/dashboard', dashboardRoutes);
  router.use('/upload', uploadRoutes);

  // Dev routes (should not be available in production)
  if (process.env.NODE_ENV === "development") {
    const devRoutes = require("../devRoutes");
    router.use("/dev", devRoutes);
  }

  // Health Check Endpoint for v1
  router.get("/health", (req, res) => {
      res.json({
          success: true,
          message: "API v1 is running successfully",
          timestamp: new Date().toISOString(),
      });
  });

  return router;
}
