// controllers/itemController.js
const Item = require("../models/Item");
//const Category = require("../models/Category"); // ✅ Added missing import
const XLSX = require("xlsx");

// ✅ Get all items
const getItems = async (req, res) => {
  try {
    const items = await Item.findAll();
    res.status(200).json({
      success: true,
      items, // frontend expects items array
    });
  } catch (error) {
    console.error("Error fetching items:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch items",
    });
  }
};

// ✅ Create new item
const createItem = async (req, res) => {
  try {
    const { item_name, quantity, reorder_level, unit_price, supplier, name } = req.body;

    // Optional category creation (not required to change logic)
    const categoryObj = await Category.create({
      item_name,
      quantity,
      reorder_level,
      unit_price,
      supplier,
      name,
    });

    if (!categoryObj)
      return res.status(400).json({ message: "Category does not exist" });

    const newItem = await Item.create({
      item_name,
      name: name || "",
      quantity: Number(quantity) || 0,
      reorder_level: Number(reorder_level) || 0,
      unit_price: Number(unit_price) || 0,
      supplier: supplier || "",
    });

    res.status(201).json(newItem);
  } catch (err) {
    console.error("Error creating item:", err);
    res.status(500).json({ message: "Server error creating item" });
  }
};

// ✅ Update existing item
const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { item_name, category, quantity, reorder_level, unit_price, supplier } = req.body;

    const item = await Item.findByPk(id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (category) {
      const categoryObj = await Category.findOne({ where: { name: category } });
      if (!categoryObj)
        return res.status(400).json({ message: "Category does not exist" });
      item.categoryId = categoryObj.id;
    }

    item.item_name = item_name || item.item_name;
    item.quantity = Number(quantity) || item.quantity;
    item.reorder_level = Number(reorder_level) || item.reorder_level;
    item.unit_price = Number(unit_price) || item.unit_price;
    item.supplier = supplier || item.supplier;

    await item.save();
    res.json(item);
  } catch (err) {
    console.error("Error updating item:", err);
    res.status(500).json({ message: "Server error updating item" });
  }
};

// ✅ Delete item
const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Item.findByPk(id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    await item.destroy();
    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    console.error("Error deleting item:", err);
    res.status(500).json({ message: "Server error deleting item" });
  }
};

// ✅ Upload Excel file (auto-create or update items)
const uploadItemsFromExcel = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "No Excel file uploaded" });

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    let createdCount = 0;
    let updatedCount = 0;

    for (const row of rows) {
      if (!row.item_name || !row.Category) continue; // ✅ fixed field name

      const categoryName = String(row.Category).trim();
      const quantity = Number(row.quantity) || 0;
      const reorder_level = Number(row.reorder_level) || 0;
      const unit_price = Number(row.unit_price) || 0;
      const supplier = row.supplier ? String(row.supplier).trim() : "";

      // Find or create category
      let category = await Category.findOne({ where: { name: categoryName } });
      if (!category) category = await Category.create({ name: categoryName });

      // Check if item exists
      const existingItem = await Item.findOne({
        where: { item_name: row.item_name },
      });

      if (existingItem) {
        await existingItem.update({
          categoryId: category.id,
          quantity,
          reorder_level,
          unit_price,
          supplier,
        });
        updatedCount++;
      } else {
        await Item.create({
          item_name: row.item_name,
          categoryId: category.id,
          quantity,
          reorder_level,
          unit_price,
          supplier,
        });
        createdCount++;
      }
    }

    res.json({
      message: `✅ Excel processed successfully`,
      created: createdCount,
      updated: updatedCount,
      total: createdCount + updatedCount,
    });
  } catch (err) {
    console.error("Excel upload error:", err);
    res.status(500).json({
      message: "Failed to process Excel file",
      error: err.message,
    });
  }
};

module.exports = {
  getItems,
  createItem,
  updateItem,
  deleteItem,
  uploadItemsFromExcel,
};
