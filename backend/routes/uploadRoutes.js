const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const path = require("path");
const { deleteFile } = require("../utils/fileHandler");
const Item = require("../models").Item;

const router = express.Router();

const storage = multer.diskStorage({
  destination: "uploads/",
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

router.post("/items", upload.single("excelFile"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }

  const filePath = req.file.path;

  try {
    console.log("Processing items file:", req.file.filename);

    const workbook = xlsx.readFile(filePath);
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

        if (!itemData.item_name) throw new Error("Missing item_name");

        const existingItem = await Item.findOne({
          where: { item_name: itemData.item_name },
        });

        if (existingItem) {
          await Item.update(itemData, { where: { item_name: itemData.item_name } });
        } else {
          await Item.create(itemData);
        }

        processedCount++;
        savedItems.push(itemData);
      } catch (rowError) {
        errors.push(`Row ${processedCount + 1}: ${rowError.message}`);
      }
    }

    res.json({
      success: true,
      message: `Processed ${processedCount} items${errors.length ? " with some errors" : ""}`,
      processed: processedCount,
      savedItems,
      errors: errors.length ? errors : undefined,
    });
  } catch (error) {
    console.error("❌ Items upload error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    // Asynchronously delete the file
    deleteFile(filePath);
  }
});

module.exports = router;
