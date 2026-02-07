const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const { Investment, Fund, User } = require("../models");
const { Op } = require("sequelize");

router.get("/", authMiddleware, async (req, res) => {
  try {
    const {
      status,
      fundId,
      gpId,
      lpId,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      search,
      sortBy = "investedAt",
      sortOrder = "desc",
      page = 1,
      limit = 20,
    } = req.query;

    const where = {};

    if (status) {
      const statuses = Array.isArray(status) ? status : status.split(",");
      where.status = { [Op.in]: statuses };
    }

    if (fundId) {
      where.fundId = fundId;
    }

    if (lpId) {
      where.lpId = lpId;
    }

    if (startDate || endDate) {
      where.investedAt = {};
      if (startDate) {
        where.investedAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.investedAt[Op.lte] = new Date(endDate);
      }
    }

    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) {
        where.amount[Op.gte] = parseFloat(minAmount);
      }
      if (maxAmount) {
        where.amount[Op.lte] = parseFloat(maxAmount);
      }
    }

    const include = [
      {
        model: Fund,
        as: "fund",
        attributes: ["id", "name", "tokenSymbol", "gpId"],
        where: gpId ? { gpId } : undefined,
        include: [
          {
            model: User,
            as: "generalPartner",
            attributes: ["id", "email", "role"],
          },
        ],
      },
      {
        model: User,
        as: "limitedPartner",
        attributes: ["id", "email", "role"],
      },
    ];

    if (search) {
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const validSortFields = ["investedAt", "amount", "status", "createdAt"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "investedAt";
    const order = sortOrder.toLowerCase() === "asc" ? "ASC" : "DESC";

    const { count, rows: investments } = await Investment.findAndCountAll({
      where,
      include,
      order: [[sortField, order]],
      limit: parseInt(limit),
      offset,
    });

    let filteredInvestments = investments;
    let filteredCount = count;
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredInvestments = investments.filter((inv) => {
        const fundName = inv.fund?.name?.toLowerCase() || "";
        const gpEmail = inv.fund?.generalPartner?.email?.toLowerCase() || "";
        const lpEmail = inv.limitedPartner?.email?.toLowerCase() || "";
        const invId = inv.id?.toLowerCase() || "";
        
        return (
          fundName.includes(searchLower) ||
          gpEmail.includes(searchLower) ||
          lpEmail.includes(searchLower) ||
          invId.includes(searchLower)
        );
      });
      filteredCount = filteredInvestments.length;
    }

    const transactions = filteredInvestments.map((inv) => ({
      id: inv.id,
      fundId: inv.fundId,
      fundName: inv.fund?.name || "Unknown Fund",
      fundSymbol: inv.fund?.tokenSymbol || "N/A",
      gpId: inv.fund?.gpId,
      gpEmail: inv.fund?.generalPartner?.email || "Unknown",
      lpId: inv.lpId,
      lpEmail: inv.limitedPartner?.email || "Unknown",
      amount: inv.amount,
      tokensIssued: inv.tokensIssued || "0",
      status: inv.status,
      transactionHash: inv.transactionHash,
      investedAt: inv.investedAt,
      confirmedAt: inv.updatedAt,
      createdAt: inv.createdAt,
    }));

    const allInvestments = await Investment.findAll({
      where,
      include,
    });

    const summary = {
      totalTransactions: allInvestments.length,
      totalInvested: allInvestments
        .reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0)
        .toString(),
      totalTokensIssued: allInvestments
        .reduce((sum, inv) => sum + parseFloat(inv.tokensIssued || 0), 0)
        .toString(),
      confirmedCount: allInvestments.filter((inv) => inv.status === "confirmed").length,
      pendingCount: allInvestments.filter((inv) => inv.status === "pending").length,
      cancelledCount: allInvestments.filter((inv) => inv.status === "cancelled").length,
    };

    const totalPages = Math.ceil(filteredCount / parseInt(limit));

    res.json({
      data: {
        transactions,
        pagination: {
          total: filteredCount,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages,
        },
        summary,
      },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({
      error: {
        message: "Failed to fetch transactions",
        details: error.message,
      },
    });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const investment = await Investment.findByPk(id, {
      include: [
        {
          model: Fund,
          as: "fund",
          include: [
            {
              model: User,
              as: "generalPartner",
              attributes: ["id", "email", "role", "walletAddress"],
            },
          ],
        },
        {
          model: User,
          as: "limitedPartner",
          attributes: ["id", "email", "role", "walletAddress"],
        },
      ],
    });

    if (!investment) {
      return res.status(404).json({
        error: { message: "Transaction not found" },
      });
    }

    const transaction = {
      id: investment.id,
      fundId: investment.fundId,
      fundName: investment.fund?.name || "Unknown Fund",
      fundSymbol: investment.fund?.tokenSymbol || "N/A",
      fundDescription: investment.fund?.description,
      fundContractAddress: investment.fund?.contractAddress,
      gpId: investment.fund?.gpId,
      gpEmail: investment.fund?.generalPartner?.email || "Unknown",
      gpWallet: investment.fund?.generalPartner?.walletAddress,
      lpId: investment.lpId,
      lpEmail: investment.limitedPartner?.email || "Unknown",
      lpWallet: investment.limitedPartner?.walletAddress,
      amount: investment.amount,
      tokensIssued: investment.tokensIssued || "0",
      status: investment.status,
      transactionHash: investment.transactionHash,
      investedAt: investment.investedAt,
      confirmedAt: investment.updatedAt,
      createdAt: investment.createdAt,
      updatedAt: investment.updatedAt,
    };

    res.json({ data: transaction });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    res.status(500).json({
      error: {
        message: "Failed to fetch transaction",
        details: error.message,
      },
    });
  }
});

router.get("/export/csv", authMiddleware, async (req, res) => {
  try {
    const {
      status,
      fundId,
      gpId,
      lpId,
      startDate,
      endDate,
      minAmount,
      maxAmount,
    } = req.query;

    const where = {};

    if (status) {
      const statuses = Array.isArray(status) ? status : status.split(",");
      where.status = { [Op.in]: statuses };
    }

    if (fundId) where.fundId = fundId;
    if (lpId) where.lpId = lpId;

    if (startDate || endDate) {
      where.investedAt = {};
      if (startDate) where.investedAt[Op.gte] = new Date(startDate);
      if (endDate) where.investedAt[Op.lte] = new Date(endDate);
    }

    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) where.amount[Op.gte] = parseFloat(minAmount);
      if (maxAmount) where.amount[Op.lte] = parseFloat(maxAmount);
    }

    const include = [
      {
        model: Fund,
        as: "fund",
        where: gpId ? { gpId } : undefined,
        include: [
          {
            model: User,
            as: "generalPartner",
            attributes: ["email"],
          },
        ],
      },
      {
        model: User,
        as: "limitedPartner",
        attributes: ["email"],
      },
    ];

    const investments = await Investment.findAll({
      where,
      include,
      order: [["investedAt", "DESC"]],
    });

    const csvHeader = "Transaction ID,Date,Fund Name,Fund Symbol,GP Email,LP Email,Amount,Tokens Issued,Status,Transaction Hash\n";
    const csvRows = investments.map((inv) => {
      return [
        inv.id,
        new Date(inv.investedAt).toISOString(),
        `"${inv.fund?.name || ""}"`,
        inv.fund?.tokenSymbol || "",
        inv.fund?.generalPartner?.email || "",
        inv.limitedPartner?.email || "",
        inv.amount,
        inv.tokensIssued || "0",
        inv.status,
        inv.transactionHash || "",
      ].join(",");
    });

    const csv = csvHeader + csvRows.join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="transactions_${Date.now()}.csv"`
    );
    res.send(csv);
  } catch (error) {
    console.error("Error exporting transactions:", error);
    res.status(500).json({
      error: {
        message: "Failed to export transactions",
        details: error.message,
      },
    });
  }
});

module.exports = router;
