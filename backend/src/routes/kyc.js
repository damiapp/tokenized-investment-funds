const express = require("express");
const authMiddleware = require("../middleware/auth");
const upload = require("../middleware/upload");
const kycController = require("../controllers/kycController");

const router = express.Router();

// All KYC routes require authentication
router.use(authMiddleware);

// Submit KYC documents (with file upload)
router.post("/submit", upload.array("documents", 10), kycController.submit);

// Get KYC status
router.get("/status", kycController.getStatus);

// Download a previously uploaded KYC document
router.get("/documents/:documentId/download", kycController.downloadDocument);

// Webhook for KYC provider updates
router.post("/webhook", kycController.webhook);

// Manually trigger blockchain sync for approved KYC
router.post("/sync-blockchain", kycController.manualBlockchainSync);

module.exports = router;
