require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { connectDB, sequelize } = require("./config/db");
const { deleteFile, ensureDirExists } = require("./utils/fileHandler");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const v1Router = require("./routes/v1");
app.use("/api/v1", v1Router);

// Root Route
app.get("/", (req, res) => {
  res.send("Inventory Management API running...");
});

// Centralized Error Handling
app.use((err, req, res, next) => {
  console.error("❌ Unhandled Error:", err.stack);
  res.status(500).json({ success: false, message: "Something went wrong!" });
});

const server = http.createServer(app);

// Graceful Shutdown
const gracefulShutdown = () => {
  console.log("Shutting down gracefully...");
  server.close(async () => {
    console.log("Server closed.");
    try {
      await sequelize.close();
      console.log("Database connection closed.");
    } catch (error) {
      console.error("Error closing database connection:", error);
    }
    process.exit(0);
  });
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// Start Server
const startServer = async () => {
  try {
    await connectDB();
    await sequelize.sync({ force: false });
    console.log("✅ Database synced successfully");

    // Ensure upload directory exists
    await ensureDirExists("uploads/");

    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server Startup Error:", error);
    process.exit(1);
  }
};

startServer();
