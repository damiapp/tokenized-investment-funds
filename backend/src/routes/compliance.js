const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const { Fund } = require("../models");
const contractService = require("../services/contractService");

router.post("/configure", authMiddleware, async (req, res) => {
  try {
    const { fundId, config } = req.body;

    if (!fundId || !config) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Fund ID and config are required",
        },
      });
    }

    const fund = await Fund.findByPk(fundId);
    if (!fund) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Fund not found",
        },
      });
    }

    if (fund.gpId !== req.user.id) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only the fund GP can configure compliance",
        },
      });
    }

    if (!fund.contractAddress) {
      return res.status(400).json({
        error: {
          code: "INVALID_STATE",
          message: "Fund does not have a token contract",
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

    const txHashes = await contractService.configureCompliance(fund.contractAddress, config);

    await fund.update({
      complianceConfig: config,
      complianceEnabled: true,
    });

    res.status(200).json({
      data: {
        message: "Compliance configured successfully",
        fundId,
        config,
        txHashes,
      },
    });
  } catch (error) {
    console.error("Configure compliance error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL",
        message: "Failed to configure compliance",
        details: error.message,
      },
    });
  }
});

router.get("/check", authMiddleware, async (req, res) => {
  try {
    const { token, from, to, amount } = req.query;

    if (!token || !from || !to || !amount) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Token address, from, to, and amount are required",
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

    const result = await contractService.checkTransferCompliance(
      token,
      from,
      to,
      parseFloat(amount)
    );

    res.status(200).json({
      data: {
        canTransfer: result.canTransfer,
        reason: result.reason,
        token,
        from,
        to,
        amount,
      },
    });
  } catch (error) {
    console.error("Check compliance error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL",
        message: "Failed to check compliance",
        details: error.message,
      },
    });
  }
});

router.get("/:fundId", authMiddleware, async (req, res) => {
  try {
    const { fundId } = req.params;

    const fund = await Fund.findByPk(fundId);
    if (!fund) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Fund not found",
        },
      });
    }

    res.status(200).json({
      data: {
        fundId,
        contractAddress: fund.contractAddress,
        complianceEnabled: fund.complianceEnabled || false,
        complianceConfig: fund.complianceConfig || {},
      },
    });
  } catch (error) {
    console.error("Get compliance config error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL",
        message: "Failed to get compliance config",
      },
    });
  }
});

router.put("/:fundId/enable", authMiddleware, async (req, res) => {
  try {
    const { fundId } = req.params;
    const { enabled } = req.body;

    if (enabled === undefined) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Enabled flag is required",
        },
      });
    }

    const fund = await Fund.findByPk(fundId);
    if (!fund) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Fund not found",
        },
      });
    }

    if (fund.gpId !== req.user.id) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only the fund GP can modify compliance settings",
        },
      });
    }

    await fund.update({ complianceEnabled: enabled });

    res.status(200).json({
      data: {
        message: `Compliance ${enabled ? "enabled" : "disabled"} successfully`,
        fundId,
        complianceEnabled: enabled,
      },
    });
  } catch (error) {
    console.error("Toggle compliance error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL",
        message: "Failed to toggle compliance",
      },
    });
  }
});

module.exports = router;
