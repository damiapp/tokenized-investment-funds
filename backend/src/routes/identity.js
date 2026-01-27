const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const { User, KycStatus } = require("../models");
const contractService = require("../services/contractService");

// GET /api/identity/status - Get identity status for current user
router.get("/status", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "User not found",
        },
      });
    }

    if (!user.walletAddress) {
      return res.status(200).json({
        data: {
          registered: false,
          walletAddress: null,
          message: "No wallet connected",
        },
      });
    }

    // Check on-chain identity status
    let onChainStatus = null;
    if (contractService.isInitialized()) {
      try {
        const isVerified = await contractService.isKycVerified(user.walletAddress);
        onChainStatus = {
          verified: isVerified,
          walletAddress: user.walletAddress,
        };
      } catch (error) {
        console.error("Failed to check on-chain identity:", error.message);
      }
    }

    res.status(200).json({
      data: {
        registered: onChainStatus?.verified || false,
        walletAddress: user.walletAddress,
        onChain: onChainStatus,
      },
    });
  } catch (error) {
    console.error("Get identity status error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL",
        message: "Failed to get identity status",
      },
    });
  }
});

// POST /api/identity/register - Register identity on-chain
router.post("/register", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { walletAddress, countryCode } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Wallet address is required",
        },
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "User not found",
        },
      });
    }

    // Check if KYC is approved
    const kycStatus = await KycStatus.findOne({ where: { userId } });
    if (!kycStatus || kycStatus.status !== "approved") {
      return res.status(403).json({
        error: {
          code: "KYC_NOT_APPROVED",
          message: "KYC must be approved before registering identity",
        },
      });
    }

    if (!contractService.isInitialized()) {
      await contractService.initialize();
    }

    if (!contractService.isInitialized()) {
      return res.status(503).json({
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Contract service not initialized",
        },
      });
    }

    // Register identity
    const country = countryCode || 840; // Default to USA
    const txHash = await contractService.registerIdentity(walletAddress, country);

    // Add KYC claim
    const CLAIM_KYC_VERIFIED = 2;
    const claimTxHash = await contractService.addIdentityClaim(walletAddress, CLAIM_KYC_VERIFIED);

    // Update user wallet address if different
    if (user.walletAddress !== walletAddress) {
      await user.update({ walletAddress });
    }

    res.status(200).json({
      data: {
        message: "Identity registered successfully",
        walletAddress,
        countryCode: country,
        txHash,
        claimTxHash,
      },
    });
  } catch (error) {
    console.error("Register identity error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL",
        message: "Failed to register identity",
        details: error.message,
      },
    });
  }
});

// POST /api/identity/claim - Add claim to identity
router.post("/claim", authMiddleware, async (req, res) => {
  try {
    const { walletAddress, claimTopic } = req.body;

    if (!walletAddress || claimTopic === undefined) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Wallet address and claim topic are required",
        },
      });
    }

    // Only admin can add claims (you might want to add role check here)
    if (req.user.role !== "GP") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only administrators can add claims",
        },
      });
    }

    if (!contractService.isInitialized()) {
      await contractService.initialize();
    }

    if (!contractService.isInitialized()) {
      return res.status(503).json({
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Contract service not initialized",
        },
      });
    }

    const txHash = await contractService.addIdentityClaim(walletAddress, claimTopic);

    res.status(200).json({
      data: {
        message: "Claim added successfully",
        walletAddress,
        claimTopic,
        txHash,
      },
    });
  } catch (error) {
    console.error("Add claim error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL",
        message: "Failed to add claim",
        details: error.message,
      },
    });
  }
});

// GET /api/identity/:address - Get identity info for specific address
router.get("/:address", authMiddleware, async (req, res) => {
  try {
    const { address } = req.params;

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid wallet address",
        },
      });
    }

    if (!contractService.isInitialized()) {
      await contractService.initialize();
    }

    if (!contractService.isInitialized()) {
      return res.status(503).json({
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Contract service not initialized",
        },
      });
    }

    const isVerified = await contractService.isKycVerified(address);

    res.status(200).json({
      data: {
        address,
        verified: isVerified,
      },
    });
  } catch (error) {
    console.error("Get identity error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL",
        message: "Failed to get identity info",
      },
    });
  }
});

module.exports = router;
