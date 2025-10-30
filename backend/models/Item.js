const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Item = sequelize.define("Item", {
  item_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  reorder_level: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  unit_price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  supplier: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = Item;
