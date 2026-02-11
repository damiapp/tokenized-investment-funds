const express = require("express");
const router = express.Router();
const contractService = require("../services/contractService");
const authMiddleware = require("../middleware/auth");

router.get("/info", async (req, res) => {
  try {
    const addresses = await contractService.getContractAddresses();
    
    if (!addresses) {
      return res.status(503).json({
        error: {
          code: "CONTRACTS_NOT_DEPLOYED",
          message: "Smart contracts have not been deployed yet",
        },
      });
    }

    res.json({
      data: {
        ...addresses,
        initialized: contractService.isInitialized(),
      },
    });
  } catch (error) {
    console.error("Get contract info error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL",
        message: "Failed to get contract info",
      },
    });
  }
});

router.get("/kyc/:walletAddress", authMiddleware, async (req, res) => {
  try {
    if (!contractService.isInitialized()) {
      return res.status(503).json({
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Contract service not initialized",
        },
      });
    }

    const { walletAddress } = req.params;
    
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid wallet address",
        },
      });
    }

    const isVerified = await contractService.isKycVerified(walletAddress);

    res.json({
      data: {
        walletAddress,
        isVerified,
      },
    });
  } catch (error) {
    console.error("Check KYC verification error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL",
        message: "Failed to check KYC verification",
      },
    });
  }
});

router.post("/kyc/verify", authMiddleware, async (req, res) => {
  try {
    if (!contractService.isInitialized()) {
      return res.status(503).json({
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Contract service not initialized",
        },
      });
    }

    const { walletAddress, verified } = req.body;

    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid wallet address",
        },
      });
    }

    const txHash = await contractService.setKycVerified(walletAddress, verified !== false);

    res.json({
      data: {
        walletAddress,
        verified: verified !== false,
        transactionHash: txHash,
      },
    });
  } catch (error) {
    console.error("Set KYC verification error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL",
        message: "Failed to set KYC verification",
      },
    });
  }
});

router.get("/tokens/:walletAddress/balance", authMiddleware, async (req, res) => {
  try {
    if (!contractService.isInitialized()) {
      return res.status(503).json({
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Contract service not initialized",
        },
      });
    }

    const { walletAddress } = req.params;

    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid wallet address",
        },
      });
    }

    const balance = await contractService.getFundTokenBalance(walletAddress);

    res.json({
      data: {
        walletAddress,
        balance,
        symbol: "DFT",
      },
    });
  } catch (error) {
    console.error("Get token balance error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL",
        message: "Failed to get token balance",
      },
    });
  }
});

module.exports = router;
