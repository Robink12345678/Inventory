const { Sequelize } = require('sequelize');
const sequelize = require('../config/db');
const Item = require('./Item');
const Transaction = require('./Transaction');

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.Item = Item;
db.Transaction = Transaction;

// Define associations
Item.hasMany(Transaction, { foreignKey: 'item_id', as: 'Transactions' });
Transaction.belongsTo(Item, { foreignKey: 'item_id', as: 'Item' });

module.exports = db;