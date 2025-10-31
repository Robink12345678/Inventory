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
const db = require("./models");
const Item = db.Item;

// ✅ Import routes
const itemRoutes = require("./routes/itemRoutes");
const transactionRoutes = require("./routes/transactionRoutes")
const reportRoutes = require("./routes/reportRoutes")
const dashboardRoutes = require("./routes/dashboardRoutes")

// ✅ Register routes
app.use("/api/items", itemRoutes);
app.use("/api/transactions", transactionRoutes)
app.use("/api/reports", reportRoutes)
app.use("/api/dashboard", dashboardRoutes)

// ✅ Excel Upload Route
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
            row.category_name ||
            null,
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
          supplier: row.supplier || row.Supplier || row.vendor || null,
        };

        console.log("Processing row:", itemData);

        // ✅ Validation
        if (!itemData.item_name) throw new Error("Missing item_name");

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

// ✅ Test Data Endpoint
app.post("/api/test-data", async (req, res) => {
  try {
    // Clear existing items
    await Item.destroy({ where: {} });

    // Create test items with categories
    const testItems = [
      {
        item_name: "Laptop Dell XPS",
        category: "Electronics",
        quantity: 15,
        reorder_level: 5,
        unit_price: 1299.99,
        supplier: "Dell Technologies"
      },
      {
        item_name: "Office Chair",
        category: "Furniture",
        quantity: 8,
        reorder_level: 3,
        unit_price: 199.99,
        supplier: "Furniture World"
      },
      {
        item_name: "Wireless Mouse",
        category: "Electronics",
        quantity: 25,
        reorder_level: 10,
        unit_price: 29.99,
        supplier: "Tech Accessories Inc"
      },
      {
        item_name: "Notebooks Pack",
        category: "Office Supplies",
        quantity: 50,
        reorder_level: 20,
        unit_price: 12.99,
        supplier: "Paper Products Co"
      },
      {
        item_name: "Desk Lamp",
        category: "Furniture",
        quantity: 12,
        reorder_level: 5,
        unit_price: 45.50,
        supplier: "Home Essentials"
      }
    ];

    await Item.bulkCreate(testItems);

    res.json({
      success: true,
      message: "Test data created successfully",
      items: testItems
    });
  } catch (error) {
    console.error("❌ Test data error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
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
  .sync({ force: false })
  .then(() => {
    console.log("✅ Database synced successfully");
    app.listen(5000, () => console.log("✅ Server running on port 5000"));
  })
  .catch((err) => console.error("❌ DB Sync Error:", err.message));