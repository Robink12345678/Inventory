const { Sequelize } = require("sequelize");
const initItemModel = require("../models/Item");

const sequelize = new Sequelize("sqlite::memory:", { logging: false });

const Item = initItemModel(sequelize);

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

module.exports = { sequelize, Item };
