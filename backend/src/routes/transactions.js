const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const { Investment, Fund, User } = require("../models");
const { Op } = require("sequelize");

// GET /api/transactions - Get all transactions with filtering
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

    // Build where clause for filtering
    const where = {};

    // Status filter (can be multiple)
    if (status) {
      const statuses = Array.isArray(status) ? status : status.split(",");
      where.status = { [Op.in]: statuses };
    }

    // Fund filter
    if (fundId) {
      where.fundId = fundId;
    }

    // LP filter
    if (lpId) {
      where.lpId = lpId;
    }

    // Date range filter
    if (startDate || endDate) {
      where.investedAt = {};
      if (startDate) {
        where.investedAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.investedAt[Op.lte] = new Date(endDate);
      }
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) {
        where.amount[Op.gte] = parseFloat(minAmount);
      }
      if (maxAmount) {
        where.amount[Op.lte] = parseFloat(maxAmount);
      }
    }

    // Include filters for Fund and GP
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

    // Search filter (search in fund name, GP email, or LP email)
    if (search) {
      // We'll handle search via having clause after the query
      // For now, we'll fetch and filter in memory for simplicity
    }

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Sorting
    const validSortFields = ["investedAt", "amount", "status", "createdAt"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "investedAt";
    const order = sortOrder.toLowerCase() === "asc" ? "ASC" : "DESC";

    // Execute query
    const { count, rows: investments } = await Investment.findAndCountAll({
      where,
      include,
      order: [[sortField, order]],
      limit: parseInt(limit),
      offset,
    });

    // Filter by search if provided
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

    // Format transactions for response
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

    // Calculate summary statistics
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

    // Pagination info
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

// GET /api/transactions/:id - Get single transaction details
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

// GET /api/transactions/export/csv - Export transactions to CSV
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

    // Build where clause (same as main query)
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

    // Generate CSV
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
