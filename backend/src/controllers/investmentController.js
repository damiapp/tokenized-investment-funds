const { Investment, Fund, User, KycStatus } = require("../models");

const investmentController = {
  async create(req, res) {
    try {
      const lpId = req.user.id;
      const { fundId, amount } = req.body;

      if (!fundId || !amount) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "fundId and amount are required",
          },
        });
      }

      if (amount <= 0) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Investment amount must be greater than 0",
          },
        });
      }

      const kycStatus = await KycStatus.findOne({ where: { userId: lpId } });
      if (!kycStatus || kycStatus.status !== "approved") {
        return res.status(403).json({
          error: {
            code: "KYC_NOT_APPROVED",
            message: "KYC verification must be approved before investing",
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

      if (fund.status !== "active") {
        return res.status(400).json({
          error: {
            code: "INVALID_STATE",
            message: "Fund is not accepting investments",
          },
        });
      }

      if (parseFloat(amount) < parseFloat(fund.minimumInvestment)) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: `Minimum investment is ${fund.minimumInvestment}`,
          },
        });
      }

      const newRaisedAmount = parseFloat(fund.raisedAmount) + parseFloat(amount);
      if (newRaisedAmount > parseFloat(fund.targetAmount)) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Investment would exceed fund target amount",
          },
        });
      }

      const investment = await Investment.create({
        fundId,
        lpId,
        amount,
        status: "pending",
      });

      await fund.update({
        raisedAmount: newRaisedAmount,
      });

      res.status(201).json({
        data: {
          investment,
          message: "Investment created successfully",
        },
      });
    } catch (error) {
      console.error("Investment creation error:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Failed to create investment",
        },
      });
    }
  },

  async getAll(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const { fundId, status } = req.query;

      const where = {};
      if (fundId) {
        where.fundId = fundId;
      }
      if (status) {
        where.status = status;
      }

      if (userRole === "LP") {
        where.lpId = userId;
      }

      const investments = await Investment.findAll({
        where,
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
          {
            model: User,
            as: "limitedPartner",
            attributes: ["id", "email"],
          },
        ],
        order: [["investedAt", "DESC"]],
      });

      res.status(200).json({
        data: {
          investments,
          count: investments.length,
        },
      });
    } catch (error) {
      console.error("Get investments error:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Failed to retrieve investments",
        },
      });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const investment = await Investment.findByPk(id, {
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
          {
            model: User,
            as: "limitedPartner",
            attributes: ["id", "email"],
          },
        ],
      });

      if (!investment) {
        return res.status(404).json({
          error: {
            code: "NOT_FOUND",
            message: "Investment not found",
          },
        });
      }

      if (investment.lpId !== userId && investment.fund.gpId !== userId) {
        return res.status(403).json({
          error: {
            code: "FORBIDDEN",
            message: "Access denied",
          },
        });
      }

      res.status(200).json({
        data: { investment },
      });
    } catch (error) {
      console.error("Get investment error:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Failed to retrieve investment",
        },
      });
    }
  },

  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, transactionHash, tokensIssued } = req.body;

      if (!status) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Status is required",
          },
        });
      }

      const investment = await Investment.findByPk(id, {
        include: [{ model: Fund, as: "fund" }],
      });

      if (!investment) {
        return res.status(404).json({
          error: {
            code: "NOT_FOUND",
            message: "Investment not found",
          },
        });
      }

      if (investment.fund.gpId !== req.user.id) {
        return res.status(403).json({
          error: {
            code: "FORBIDDEN",
            message: "Only the fund GP can update investment status",
          },
        });
      }

      const updates = { status };
      if (transactionHash) {
        updates.transactionHash = transactionHash;
      }
      if (tokensIssued) {
        updates.tokensIssued = tokensIssued;
      }

      await investment.update(updates);

      res.status(200).json({
        data: {
          investment,
          message: "Investment status updated successfully",
        },
      });
    } catch (error) {
      console.error("Investment update error:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Failed to update investment",
        },
      });
    }
  },
};

module.exports = investmentController;
