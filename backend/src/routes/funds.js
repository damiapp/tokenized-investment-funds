const express = require("express");
const authMiddleware = require("../middleware/auth");
const fundController = require("../controllers/fundController");

const router = express.Router();

router.use(authMiddleware);

router.post("/", fundController.create);
router.get("/", fundController.getAll);
router.get("/my-funds", fundController.getMyFunds);
router.get("/:id", fundController.getById);
router.put("/:id", fundController.update);
router.delete("/:id", fundController.delete);

module.exports = router;
