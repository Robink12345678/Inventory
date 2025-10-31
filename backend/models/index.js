const { sequelize } = require("../config/db");
const Item = require("./Item")(sequelize);
const Transaction = require("./Transaction")(sequelize);

module.exports = {
  sequelize,
  Item,
  Transaction,
};
