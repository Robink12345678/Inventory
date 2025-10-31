const express = require("express");
const router = express.Router();
const itemController = require("../controllers/itemController");

router.get("/get", itemController.getItems);
router.post("/create", itemController.createItem);
router.put("/:id", itemController.updateItem);
router.delete("/:id", itemController.deleteItem);

module.exports = router;