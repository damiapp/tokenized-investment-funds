const express = require("express");
const authMiddleware = require("../middleware/auth");
const investmentController = require("../controllers/investmentController");

const router = express.Router();

router.use(authMiddleware);

router.post("/", investmentController.create);
router.get("/", investmentController.getAll);
router.get("/:id", investmentController.getById);
router.put("/:id/status", investmentController.updateStatus);

module.exports = router;
