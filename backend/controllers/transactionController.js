const Transaction = require("../models/Transaction");
const Item = require("../models/Item");

exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      order: [["transaction_date", "DESC"]],
    });
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};

exports.createTransaction = async (req, res) => {
  try {
    const { item_id, transaction_type, quantity, notes } = req.body;
    const item = await Item.findByPk(item_id);

    if (!item) return res.status(404).json({ error: "Item not found" });

    // Update item quantity
    let newQty =
      transaction_type === "IN"
        ? item.quantity + Number(quantity)
        : item.quantity - Number(quantity);

    if (newQty < 0)
      return res.status(400).json({ error: "Insufficient stock" });

    await item.update({ quantity: newQty });

    // Create transaction record
    const transaction = await Transaction.create({
      item_id,
      item_name: item.item_name,
      transaction_type,
      quantity,
      notes,
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(500).json({ error: "Failed to create transaction" });
  }
};
