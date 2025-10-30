const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("erp", "root", "root", {
  host: "10.36.137.239",
  dialect: "mysql",
  port: "3306",
  logging: false,
});

sequelize
  .authenticate()
  .then(() => console.log("Database connected..."))
  .catch((err) => console.error("Error: " + err));

module.exports = sequelize;