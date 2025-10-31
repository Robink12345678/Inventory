const { Op } = require("sequelize");

// @desc    Get all items with pagination and search
// @route   GET /api/items
// @access  Public
const getItems = (db) => async (req, res) => {
  const Item = db.Item;
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = search
      ? {
          [Op.or]: [
            { item_name: { [Op.like]: `%${search}%` } },
            { category: { [Op.like]: `%${search}%` } },
            { supplier: { [Op.like]: `%${search}%` } },
          ],
        }
      : {};

    const { count, rows } = await Item.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
      },
    });
  } catch (err) {
    console.error("❌ Error fetching items:", err);
    res.status(500).json({
      success: false,
      message: "Server error fetching items",
      error: err.message,
    });
  }
};

// @desc    Create a new item
// @route   POST /api/items
// @access  Public
const createItem = (db) => async (req, res) => {
  const Item = db.Item;
  try {
    const { item_name, category, quantity, reorder_level, unit_price, supplier } = req.body;

    if (!item_name || item_name.trim() === "") {
      return res.status(400).json({ success: false, message: "Item name is required" });
    }

    const newItem = await Item.create({
      item_name: item_name.trim(),
      category: category && category.trim() !== "" ? category.trim() : null,
      quantity: quantity || 0,
      reorder_level: reorder_level || 5,
      unit_price: unit_price || 0,
      supplier: supplier && supplier.trim() !== "" ? supplier.trim() : null,
    });

    res.status(201).json({
      success: true,
      message: "Item created successfully",
      data: newItem,
    });
  } catch (err) {
    console.error("❌ Error creating item:", err);
    res.status(500).json({
      success: false,
      message: "Server error creating item",
      error: err.message,
    });
  }
};

// @desc    Update an item
// @route   PUT /api/items/:id
// @access  Public
const updateItem = (db) => async (req, res) => {
  const Item = db.Item;
  try {
    const { id } = req.params;
    const item = await Item.findByPk(id);

    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    await item.update(req.body);

    res.json({
      success: true,
      message: "Item updated successfully",
      data: item,
    });
  } catch (err) {
    console.error("❌ Error updating item:", err);
    res.status(500).json({
      success: false,
      message: "Server error updating item",
      error: err.message,
    });
  }
};

// @desc    Delete an item
// @route   DELETE /api/items/:id
// @access  Public
const deleteItem = (db) => async (req, res) => {
  const Item = db.Item;
  try {
    const { id } = req.params;
    const item = await Item.findByPk(id);

    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    await item.destroy();

    res.json({ success: true, message: "Item deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting item:", err);
    res.status(500).json({
      success: false,
      message: "Server error deleting item",
      error: err.message,
    });
  }
};

module.exports = (db) => ({
  getItems: getItems(db),
  createItem: createItem(db),
  updateItem: updateItem(db),
  deleteItem: deleteItem(db),
});
