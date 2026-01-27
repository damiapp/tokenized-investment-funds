const { Fund, User, Investment } = require("../models");
const { Op } = require("sequelize");
const contractService = require("../services/contractService");

const fundController = {
  async create(req, res) {
    try {
      const gpId = req.user.id;
      
      if (req.user.role !== "GP") {
        return res.status(403).json({
          error: {
            code: "FORBIDDEN",
            message: "Only General Partners can create funds",
          },
        });
      }

      const {
        name,
        description,
        targetAmount,
        minimumInvestment,
        managementFee,
        performanceFee,
        investmentStrategy,
        riskLevel,
        fundingDeadline,
        tokenSymbol,
        terms,
      } = req.body;

      if (!name || !description || !targetAmount || !minimumInvestment || !managementFee || !performanceFee || !investmentStrategy || !riskLevel) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Missing required fields",
          },
        });
      }

      const fund = await Fund.create({
        name,
        description,
        gpId,
        targetAmount,
        minimumInvestment,
        managementFee,
        performanceFee,
        investmentStrategy,
        riskLevel,
        fundingDeadline,
        tokenSymbol,
        terms,
        status: "draft",
      });

      res.status(201).json({
        data: {
          fund,
          message: "Fund created successfully",
        },
      });
    } catch (error) {
      console.error("Fund creation error:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Failed to create fund",
        },
      });
    }
  },

  async getAll(req, res) {
    try {
      const { status, riskLevel, gpId } = req.query;
      const where = {};

      if (status) {
        where.status = status;
      }
      if (riskLevel) {
        where.riskLevel = riskLevel;
      }
      if (gpId) {
        where.gpId = gpId;
      }

      const funds = await Fund.findAll({
        where,
        include: [
          {
            model: User,
            as: "generalPartner",
            attributes: ["id", "email", "role"],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      res.status(200).json({
        data: {
          funds,
          count: funds.length,
        },
      });
    } catch (error) {
      console.error("Get funds error:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Failed to retrieve funds",
        },
      });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;

      const fund = await Fund.findByPk(id, {
        include: [
          {
            model: User,
            as: "generalPartner",
            attributes: ["id", "email", "role"],
          },
          {
            model: Investment,
            as: "investments",
            include: [
              {
                model: User,
                as: "limitedPartner",
                attributes: ["id", "email"],
              },
            ],
          },
        ],
      });

      if (!fund) {
        return res.status(404).json({
          error: {
            code: "NOT_FOUND",
            message: "Fund not found",
          },
        });
      }

      res.status(200).json({
        data: { fund },
      });
    } catch (error) {
      console.error("Get fund error:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Failed to retrieve fund",
        },
      });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const gpId = req.user.id;

      const fund = await Fund.findByPk(id);

      if (!fund) {
        return res.status(404).json({
          error: {
            code: "NOT_FOUND",
            message: "Fund not found",
          },
        });
      }

      if (fund.gpId !== gpId) {
        return res.status(403).json({
          error: {
            code: "FORBIDDEN",
            message: "Only the fund creator can update this fund",
          },
        });
      }

      const allowedUpdates = [
        "name",
        "description",
        "targetAmount",
        "minimumInvestment",
        "managementFee",
        "performanceFee",
        "investmentStrategy",
        "riskLevel",
        "status",
        "fundingDeadline",
        "tokenSymbol",
        "terms",
      ];

      const updates = {};
      allowedUpdates.forEach((field) => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      // Deploy token contract when activating fund
      let tokenDeployment = null;
      if (updates.status === "active" && fund.status !== "active" && !fund.contractAddress) {
        tokenDeployment = await fundController.deployTokenForFund(fund);
        if (tokenDeployment.success) {
          updates.contractAddress = tokenDeployment.address;
          // Use provided tokenSymbol or generate one
          if (!updates.tokenSymbol && !fund.tokenSymbol) {
            updates.tokenSymbol = tokenDeployment.symbol;
          }
        }
      }

      await fund.update(updates);

      res.status(200).json({
        data: {
          fund,
          tokenDeployment,
          message: "Fund updated successfully",
        },
      });
    } catch (error) {
      console.error("Fund update error:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Failed to update fund",
        },
      });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      const gpId = req.user.id;

      const fund = await Fund.findByPk(id);

      if (!fund) {
        return res.status(404).json({
          error: {
            code: "NOT_FOUND",
            message: "Fund not found",
          },
        });
      }

      if (fund.gpId !== gpId) {
        return res.status(403).json({
          error: {
            code: "FORBIDDEN",
            message: "Only the fund creator can delete this fund",
          },
        });
      }

      if (fund.status !== "draft") {
        return res.status(400).json({
          error: {
            code: "INVALID_STATE",
            message: "Only draft funds can be deleted",
          },
        });
      }

      await fund.destroy();

      res.status(200).json({
        data: {
          message: "Fund deleted successfully",
        },
      });
    } catch (error) {
      console.error("Fund deletion error:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Failed to delete fund",
        },
      });
    }
  },

  // Deploy a token contract for a fund via FundFactory
  async deployTokenForFund(fund) {
    try {
      // Initialize contract service if needed
      if (!contractService.isInitialized()) {
        await contractService.initialize();
      }

      if (!contractService.isInitialized()) {
        console.warn("Cannot deploy token: Contract service not initialized");
        return { success: false, reason: "contract_service_not_initialized" };
      }

      // Get GP wallet address
      const gp = await fund.getGeneralPartner();
      if (!gp?.walletAddress) {
        console.warn("Cannot deploy token: GP has no wallet address");
        return { success: false, reason: "gp_no_wallet" };
      }

      // Auto-approve GP if not already approved (for demo purposes)
      try {
        const isApproved = await contractService.isApprovedGP(gp.walletAddress);
        if (!isApproved) {
          console.log(`Auto-approving GP ${gp.walletAddress} in FundFactory...`);
          await contractService.approveGP(gp.walletAddress);
          console.log(`✓ GP auto-approved in FundFactory`);
        }
      } catch (error) {
        console.warn("Could not auto-approve GP:", error.message);
        return { success: false, reason: "gp_approval_failed", error: error.message };
      }

      // Generate token name and symbol from fund name
      const tokenName = `${fund.name} Token`;
      const tokenSymbol = fund.tokenSymbol || fund.name.substring(0, 4).toUpperCase().replace(/\s/g, "");

      // Use FundFactory to deploy the token
      const result = await contractService.deployFundViaFactory(
        tokenName,
        tokenSymbol,
        fund.targetAmount || 1000000, // Default target amount if not set
        fund.minimumInvestment || 1000 // Default minimum investment if not set
      );

      // Update fund with on-chain fund ID
      await fund.update({
        onChainFundId: result.fundId,
      });

      return {
        success: true,
        address: result.tokenAddress,
        fundId: result.fundId,
        name: tokenName,
        symbol: tokenSymbol,
        txHash: result.txHash,
      };
    } catch (error) {
      console.error("Token deployment error:", error.message);
      return { success: false, reason: "deployment_failed", error: error.message };
    }
  },

  async getMyFunds(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      let funds;

      if (userRole === "GP") {
        funds = await Fund.findAll({
          where: { gpId: userId },
          include: [
            {
              model: Investment,
              as: "investments",
            },
          ],
          order: [["createdAt", "DESC"]],
        });
      } else {
        const investments = await Investment.findAll({
          where: { lpId: userId },
          include: [
            {
              model: Fund,
              as: "fund",
              include: [
                {
                  model: User,
                  as: "generalPartner",
                  attributes: ["id", "email"],
                },
              ],
            },
          ],
        });

        funds = investments.map((inv) => inv.fund);
      }

      res.status(200).json({
        data: {
          funds,
          count: funds.length,
        },
      });
    } catch (error) {
      console.error("Get my funds error:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Failed to retrieve funds",
        },
      });
    }
  },

  // Discover funds from on-chain FundFactory
  async discoverFunds(req, res) {
    try {
      const { offset = 0, limit = 10 } = req.query;

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

      const funds = await contractService.getActiveFunds(
        parseInt(offset),
        parseInt(limit)
      );

      const totalCount = await contractService.getFundCount();

      res.status(200).json({
        data: {
          funds,
          count: funds.length,
          totalCount,
          offset: parseInt(offset),
          limit: parseInt(limit),
        },
      });
    } catch (error) {
      console.error("Discover funds error:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Failed to discover funds",
          details: error.message,
        },
      });
    }
  },

  // Get on-chain fund by ID
  async getOnChainFund(req, res) {
    try {
      const { fundId } = req.params;

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

      const fund = await contractService.getOnChainFund(parseInt(fundId));

      res.status(200).json({
        data: { fund },
      });
    } catch (error) {
      console.error("Get on-chain fund error:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Failed to get on-chain fund",
          details: error.message,
        },
      });
    }
  },

  // Get funds by GP address
  async getFundsByGP(req, res) {
    try {
      const { gpAddress } = req.params;

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

      const fundIds = await contractService.getFundsByGP(gpAddress);

      // Fetch full fund details for each ID
      const funds = await Promise.all(
        fundIds.map(id => contractService.getOnChainFund(id))
      );

      res.status(200).json({
        data: {
          funds,
          count: funds.length,
        },
      });
    } catch (error) {
      console.error("Get funds by GP error:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Failed to get funds by GP",
          details: error.message,
        },
      });
    }
  },
};

module.exports = fundController;
