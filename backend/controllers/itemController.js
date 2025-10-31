const db = require("../models");
const Item = db.Item;

// @desc    Get all items
// @route   GET /api/items/get
// @access  Public
const getItems = async (req, res) => {
  try {
    console.log("🔄 Fetching all items...");
    
    const items = await Item.findAll({
      order: [['createdAt', 'DESC']]
    });

    console.log(`✅ Found ${items.length} items`);
    console.log("📦 Sample item:", items.length > 0 ? {
      id: items[0].id,
      name: items[0].item_name,
      category: items[0].category,
      hasCategory: !!items[0].category
    } : "No items");
    
    res.json(items);
    
  } catch (err) {
    console.error("❌ Error fetching items:", err);
    res.status(500).json({ 
      message: "Server error fetching items",
      error: err.message 
    });
  }
};

// @desc    Create a new item
// @route   POST /api/items/create
// @access  Public
const createItem = async (req, res) => {
  try {
    const { item_name, category, quantity, reorder_level, unit_price, supplier } = req.body;

    console.log("🔄 Creating new item:", { item_name, category });

    // Validate required fields
    if (!item_name || item_name.trim() === "") {
      return res.status(400).json({ message: "Item name is required" });
    }

    // Create the item
    const newItem = await Item.create({
      item_name: item_name.trim(),
      category: category && category.trim() !== "" ? category.trim() : null,
      quantity: quantity !== undefined && quantity !== null && quantity !== "" ? Number(quantity) : 0,
      reorder_level: reorder_level !== undefined && reorder_level !== null && reorder_level !== "" ? Number(reorder_level) : 0,
      unit_price: unit_price !== undefined && unit_price !== null && unit_price !== "" ? parseFloat(unit_price) : 0,
      supplier: supplier && supplier.trim() !== "" ? supplier.trim() : null
    });

    console.log("✅ Item created successfully:", newItem.toJSON());
    
    res.status(201).json({
      message: "Item created successfully",
      item: newItem
    });

  } catch (err) {
    console.error("❌ Error creating item:", err);
    
    // Handle Sequelize validation errors
    if (err.name === 'SequelizeValidationError') {
      const errors = err.errors.map(error => error.message);
      return res.status(400).json({ 
        message: "Validation error",
        errors 
      });
    }
    
    // Handle duplicate entry
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        message: "Item with this name already exists" 
      });
    }

    res.status(500).json({ 
      message: "Server error creating item",
      error: err.message 
    });
  }
};

// @desc    Update an item
// @route   PUT /api/items/:id
// @access  Public
const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { item_name, category, quantity, reorder_level, unit_price, supplier } = req.body;

    console.log("🔄 Updating item ID:", id);
    console.log("📦 Request body:", req.body);

    // Validate ID
    if (!id) {
      return res.status(400).json({ message: "Item ID is required" });
    }

    // Find the item
    const item = await Item.findByPk(id);
    if (!item) {
      console.log("❌ Item not found:", id);
      return res.status(404).json({ message: "Item not found" });
    }

    console.log("✅ Found item:", item.toJSON());

    // Update fields only if provided
    const updateData = {};
    
    if (item_name !== undefined) {
      updateData.item_name = item_name.trim();
    }
    
    if (category !== undefined) {
      updateData.category = category && category.trim() !== "" ? category.trim() : null;
    }
    
    if (quantity !== undefined) {
      updateData.quantity = quantity === "" ? 0 : Number(quantity);
    }
    
    if (reorder_level !== undefined) {
      updateData.reorder_level = reorder_level === "" ? 0 : Number(reorder_level);
    }
    
    if (unit_price !== undefined) {
      updateData.unit_price = unit_price === "" ? 0 : parseFloat(unit_price);
    }
    
    if (supplier !== undefined) {
      updateData.supplier = supplier === "" ? null : supplier.trim();
    }

    console.log("📝 Update data:", updateData);

    // Update the item
    await Item.update(updateData, {
      where: { id }
    });

    // Fetch the updated item
    const updatedItem = await Item.findByPk(id);

    console.log("✅ Item updated successfully:", updatedItem.toJSON());
    
    res.json({
      message: "Item updated successfully",
      item: updatedItem
    });

  } catch (err) {
    console.error("❌ Error updating item:", err);
    
    // Handle Sequelize validation errors
    if (err.name === 'SequelizeValidationError') {
      const errors = err.errors.map(error => error.message);
      return res.status(400).json({ 
        message: "Validation error",
        errors 
      });
    }
    
    // Handle duplicate entry
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        message: "Item with this name already exists" 
      });
    }

    res.status(500).json({ 
      message: "Server error updating item",
      error: err.message 
    });
  }
};

// @desc    Delete an item
// @route   DELETE /api/items/:id
// @access  Public
const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("🔄 Deleting item ID:", id);

    // Validate ID
    if (!id) {
      return res.status(400).json({ message: "Item ID is required" });
    }

    // Find the item first to check if it exists
    const item = await Item.findByPk(id);
    if (!item) {
      console.log("❌ Item not found:", id);
      return res.status(404).json({ message: "Item not found" });
    }

    console.log("✅ Found item to delete:", item.item_name);

    // Delete the item
    await Item.destroy({
      where: { id }
    });

    console.log("✅ Item deleted successfully");
    
    res.json({
      message: "Item deleted successfully",
      deletedItem: {
        id: item.id,
        item_name: item.item_name
      }
    });

  } catch (err) {
    console.error("❌ Error deleting item:", err);
    res.status(500).json({ 
      message: "Server error deleting item",
      error: err.message 
    });
  }
};

module.exports = {
  getItems,
  createItem,
  updateItem,
  deleteItem
};