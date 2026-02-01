const express = require("express");
const router = express.Router();
const portfolioController = require("../controllers/portfolioController");
const authMiddleware = require("../middleware/auth");

// All portfolio routes require authentication
router.use(authMiddleware);

// Register a new portfolio company
router.post("/companies", portfolioController.registerCompany);

// Record an investment in a company
router.post("/investments", portfolioController.recordInvestment);

// Update company valuation
router.put("/valuations", portfolioController.updateValuation);

// Get company details
router.get("/companies/:id", portfolioController.getCompany);

// Get company investments
router.get("/companies/:id/investments", portfolioController.getCompanyInvestments);

// Get fund portfolio (all companies in a fund)
router.get("/fund/:fundId", portfolioController.getFundPortfolio);

// Get all active companies
router.get("/companies", portfolioController.getActiveCompanies);

module.exports = router;
