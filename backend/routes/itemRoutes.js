const express = require("express");
const router = express.Router();

module.exports = (db) => {
  const itemController = require("../controllers/itemController")(db);

  router.get("/", itemController.getItems);
  router.post("/", itemController.createItem);
  router.put("/:id", itemController.updateItem);
  router.delete("/:id", itemController.deleteItem);

  return router;
};
