const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Item = require("./Item");

const Transaction = sequelize.define("Transaction", {
  item_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  item_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  transaction_type: {
    type: DataTypes.ENUM("IN", "OUT"),
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  transaction_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  notes: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = Transaction;
