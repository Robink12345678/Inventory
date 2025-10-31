const db = require("../models");
const Transaction = db.Transaction;
const Item = db.Item;

exports.getTransactions = async (req, res) => {
  try {
    console.log("🔄 Fetching transactions...");
    
    // If you have associations with aliases, use the 'as' keyword
    // If you don't have associations, remove the include
    const transactions = await Transaction.findAll({
      // Remove the include if you don't have associations set up
      // include: [
      //   {
      //     model: Item,
      //     attributes: ['id', 'item_name', 'category', 'quantity'],
      //     required: false
      //   }
      // ],
      order: [["createdAt", "DESC"]],
    });

    console.log(`✅ Found ${transactions.length} transactions`);
    
    // If you need item data, fetch it separately and combine
    const transactionsWithItems = await Promise.all(
      transactions.map(async (transaction) => {
        const item = await Item.findByPk(transaction.item_id);
        return {
          id: transaction.id,
          item_id: transaction.item_id,
          item_name: transaction.item_name,
          category: item ? item.category : null,
          transaction_type: transaction.transaction_type,
          quantity: transaction.quantity,
          notes: transaction.notes,
          transaction_date: transaction.transaction_date || transaction.createdAt,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt,
          item: item ? {
            id: item.id,
            item_name: item.item_name,
            category: item.category,
            quantity: item.quantity
          } : null
        };
      })
    );

    res.json(transactionsWithItems);
  } catch (error) {
    console.error("❌ Error fetching transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};

exports.createTransaction = async (req, res) => {
  try {
    const { item_id, transaction_type, quantity, notes } = req.body;

    console.log("🔄 Creating transaction:", { item_id, transaction_type, quantity });

    // Validate required fields
    if (!item_id) {
      return res.status(400).json({ error: "Item ID is required" });
    }
    if (!transaction_type || !['IN', 'OUT'].includes(transaction_type)) {
      return res.status(400).json({ error: "Valid transaction type (IN/OUT) is required" });
    }
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: "Valid quantity is required" });
    }

    // Find the item
    const item = await Item.findByPk(item_id);
    if (!item) {
      console.log("❌ Item not found:", item_id);
      return res.status(404).json({ error: "Item not found" });
    }

    console.log("✅ Found item:", item.item_name, "Current quantity:", item.quantity);

    // Update item quantity based on transaction type
    const quantityNum = Number(quantity);
    let newQuantity;

    if (transaction_type === "IN") {
      newQuantity = item.quantity + quantityNum;
    } else {
      // Check stock for OUT transactions
      if (item.quantity < quantityNum) {
        console.log("❌ Insufficient stock:", item.quantity, "available, but", quantityNum, "requested");
        return res.status(400).json({ 
          error: `Insufficient stock! Available: ${item.quantity}, Requested: ${quantityNum}` 
        });
      }
      newQuantity = item.quantity - quantityNum;
    }

    // Update the item quantity
    await Item.update(
      { quantity: newQuantity },
      { where: { id: item_id } }
    );

    console.log("✅ Item quantity updated from", item.quantity, "to", newQuantity);

    // Create transaction record
    const transaction = await Transaction.create({
      item_id,
      item_name: item.item_name,
      transaction_type,
      quantity: quantityNum,
      notes: notes || null,
      transaction_date: new Date()
    });

    console.log("✅ Transaction created successfully:", transaction.id);

    // Fetch the created transaction
    const createdTransaction = await Transaction.findByPk(transaction.id);

    // Get item data for response
    const updatedItem = await Item.findByPk(item_id);

    // Transform response
    const responseTransaction = {
      id: createdTransaction.id,
      item_id: createdTransaction.item_id,
      item_name: createdTransaction.item_name,
      category: updatedItem ? updatedItem.category : null,
      transaction_type: createdTransaction.transaction_type,
      quantity: createdTransaction.quantity,
      notes: createdTransaction.notes,
      transaction_date: createdTransaction.transaction_date,
      createdAt: createdTransaction.createdAt,
      updatedAt: createdTransaction.updatedAt,
      item: updatedItem ? {
        id: updatedItem.id,
        item_name: updatedItem.item_name,
        category: updatedItem.category,
        quantity: updatedItem.quantity
      } : null
    };

    res.status(201).json({
      message: "Transaction created successfully",
      transaction: responseTransaction
    });

  } catch (error) {
    console.error("❌ Error creating transaction:", error);
    res.status(500).json({ 
      error: "Failed to create transaction",
      details: error.message 
    });
  }
};