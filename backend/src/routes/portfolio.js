const express = require("express");
const router = express.Router();
const portfolioController = require("../controllers/portfolioController");
const authMiddleware = require("../middleware/auth");

router.use(authMiddleware);

router.post("/companies", portfolioController.registerCompany);

router.post("/investments", portfolioController.recordInvestment);

router.put("/valuations", portfolioController.updateValuation);

router.get("/companies/:id", portfolioController.getCompany);

router.get("/companies/:id/investments", portfolioController.getCompanyInvestments);

router.get("/fund/:fundId", portfolioController.getFundPortfolio);

router.get("/companies", portfolioController.getActiveCompanies);

module.exports = router;
