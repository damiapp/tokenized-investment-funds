const express = require("express");
const authMiddleware = require("../middleware/auth");
const upload = require("../middleware/upload");
const kycController = require("../controllers/kycController");

const router = express.Router();

router.use(authMiddleware);

router.post("/submit", upload.array("documents", 10), kycController.submit);

router.get("/status", kycController.getStatus);

router.get("/documents/:documentId/download", kycController.downloadDocument);

router.post("/webhook", kycController.webhook);

router.post("/sync-blockchain", kycController.manualBlockchainSync);

module.exports = router;
