const express = require("express");
const contractService = require("../services/contractService");

const router = express.Router();

router.get("/", async (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

router.get("/blockchain", async (req, res) => {
  try {
    if (!contractService.isInitialized()) {
      await contractService.initialize();
    }

    const networkInfo = contractService.getNetworkInfo();
    const contractAddresses = await contractService.getContractAddresses();

    if (!contractService.isInitialized()) {
      return res.status(503).json({
        status: "unavailable",
        message: "Blockchain connection not available",
        networkInfo: null,
        contracts: null,
      });
    }

    let gasPrice = null;
    try {
      const gasPriceWei = await contractService.getGasPrice();
      if (gasPriceWei) {
        const { ethers } = require("ethers");
        gasPrice = ethers.utils.formatUnits(gasPriceWei, "gwei") + " gwei";
      }
    } catch (e) {
      gasPrice = "unavailable";
    }

    res.status(200).json({
      status: "connected",
      networkInfo,
      contracts: contractAddresses,
      gasPrice,
      signerAddress: contractService.signer?.address || null,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

module.exports = router;
