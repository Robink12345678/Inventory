const express = require("express");
const cors = require("cors");
const sequelize = require("./config/db");
const multer = require("multer");
const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls)$/)) {
    cb(null, true);
  } else {
    cb(new Error("Only Excel files are allowed!"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// ✅ Import models
const Item = require("./models/Item");

// ✅ Import routes
const itemRoutes = require("./routes/itemRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const reportRoutes = require("./routes/reportRoutes");

// ✅ Register routes
app.use("/api/items", itemRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/reports", reportRoutes);

// ✅ Excel Upload Route (no Category table)
app.post("/api/upload/items", upload.single("excelFile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    console.log("Processing items file:", req.file.filename);

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    let processedCount = 0;
    const errors = [];
    const savedItems = [];

    for (const row of data) {
      try {
        const itemData = {
          item_name:
            row.item_name ||
            row.name ||
            row["Item Name"] ||
            row["item name"] ||
            row.ItemName,
          category:
            row.category ||
            row.Category ||
            row["Category Name"] ||
            row.category_name,
          quantity:
            parseInt(row.quantity || row.Quantity || row.QTY || row.qty) || 0,
          reorder_level:
            parseInt(
              row.reorder_level ||
              row["Reorder Level"] ||
              row.reorderLevel ||
              row["reorder level"]
            ) || 5,
          unit_price:
            parseFloat(
              row.unit_price ||
              row["Unit Price"] ||
              row.unitPrice ||
              row["unit price"] ||
              row.price
            ) || 0,
          supplier: row.supplier || row.Supplier || row.vendor || "",
        };

        console.log("Processing row:", itemData);

        // ✅ Validation
        if (!itemData.item_name) throw new Error("Missing item_name");
        if (!itemData.category) throw new Error("Missing category");

        // ✅ Check if item already exists (by name)
        const existingItem = await Item.findOne({
          where: { item_name: itemData.item_name },
        });

        if (existingItem) {
          await Item.update(itemData, { where: { item_name: itemData.item_name } });
          console.log(`🔁 Updated existing item: ${itemData.item_name}`);
        } else {
          await Item.create(itemData);
          console.log(`✅ Added new item: ${itemData.item_name}`);
        }

        processedCount++;
        savedItems.push(itemData);
      } catch (rowError) {
        errors.push(`Row ${processedCount + 1}: ${rowError.message}`);
        console.error(`❌ Error processing row ${processedCount + 1}:`, rowError.message);
      }
    }

    // ✅ Clean up file after processing
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: `Processed ${processedCount} items${errors.length ? " with some errors" : ""
        }`,
      processed: processedCount,
      savedItems,
      errors: errors.length ? errors : undefined,
    });
  } catch (error) {
    console.error("❌ Items upload error:", error.message);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server running successfully",
    timestamp: new Date().toISOString(),
  });
});

// ✅ Root Route
app.get("/", (req, res) => {
  res.send("Inventory Management API running...");
});

// ✅ Error Handling Middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return res
      .status(400)
      .json({ success: false, message: "File too large. Max size is 10MB." });
  }
  res.status(500).json({ success: false, message: error.message });
});

// ✅ Start Server
sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("✅ Database synced successfully");
    app.listen(5000, () => console.log("✅ Server running on port 5000"));
  })
  .catch((err) => console.error("❌ DB Sync Error:", err.message));
