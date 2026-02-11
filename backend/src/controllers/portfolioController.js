const contractService = require("../services/contractService");

const portfolioController = {
  async registerCompany(req, res) {
    try {
      const { name, industry, country, foundedYear } = req.body;

      if (!name || !industry || !country || !foundedYear) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "name, industry, country, and foundedYear are required",
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
            message: "Contract service not available",
          },
        });
      }

      const result = await contractService.portfolio.registerCompany(
        name,
        industry,
        country,
        foundedYear
      );

      res.status(201).json({
        data: {
          companyId: result.companyId,
          txHash: result.txHash,
          message: "Company registered successfully",
        },
      });
    } catch (error) {
      console.error("Register company error:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Failed to register company",
          details: error.message,
        },
      });
    }
  },

  async recordInvestment(req, res) {
    try {
      const { companyId, fundId, amount, equityPercentage, valuation } = req.body;

      if (companyId === undefined || fundId === undefined || !amount || !equityPercentage || !valuation) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "companyId, fundId, amount, equityPercentage, and valuation are required",
          },
        });
      }

      if (!contractService.isInitialized()) {
        await contractService.initialize();
      }

      const result = await contractService.portfolio.recordInvestment(
        companyId,
        fundId,
        amount,
        equityPercentage,
        valuation
      );

      res.status(201).json({
        data: {
          txHash: result.txHash,
          message: "Investment recorded successfully",
        },
      });
    } catch (error) {
      console.error("Record investment error:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Failed to record investment",
          details: error.message,
        },
      });
    }
  },

  async updateValuation(req, res) {
    try {
      const { companyId, fundId, investmentIndex, newValuation } = req.body;

      if (companyId === undefined || fundId === undefined || investmentIndex === undefined || !newValuation) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "companyId, fundId, investmentIndex, and newValuation are required",
          },
        });
      }

      if (!contractService.isInitialized()) {
        await contractService.initialize();
      }

      const result = await contractService.portfolio.updateValuation(
        companyId,
        fundId,
        investmentIndex,
        newValuation
      );

      res.status(200).json({
        data: {
          txHash: result.txHash,
          message: "Valuation updated successfully",
        },
      });
    } catch (error) {
      console.error("Update valuation error:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Failed to update valuation",
          details: error.message,
        },
      });
    }
  },

  async getCompany(req, res) {
    try {
      const { id } = req.params;

      if (!contractService.isInitialized()) {
        await contractService.initialize();
      }

      const company = await contractService.portfolio.getCompany(parseInt(id));

      res.status(200).json({
        data: { company },
      });
    } catch (error) {
      console.error("Get company error:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Failed to get company",
          details: error.message,
        },
      });
    }
  },

  async getFundPortfolio(req, res) {
    try {
      const { fundId } = req.params;

      if (!contractService.isInitialized()) {
        await contractService.initialize();
      }

      const companyIds = await contractService.portfolio.getFundPortfolio(parseInt(fundId));
      
      const companies = [];
      for (const companyId of companyIds) {
        try {
          const company = await contractService.portfolio.getCompany(companyId);
          const investments = await contractService.portfolio.getCompanyInvestments(companyId);
          const fundInvestments = investments.filter(inv => inv.fundId === parseInt(fundId));
          
          companies.push({
            companyId,
            ...company,
            investments: fundInvestments,
          });
        } catch (err) {
          console.warn(`Failed to get company ${companyId}:`, err.message);
        }
      }

      res.status(200).json({
        data: {
          fundId: parseInt(fundId),
          companies,
          count: companies.length,
        },
      });
    } catch (error) {
      console.error("Get fund portfolio error:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Failed to get fund portfolio",
          details: error.message,
        },
      });
    }
  },

  async getActiveCompanies(req, res) {
    try {
      if (!contractService.isInitialized()) {
        await contractService.initialize();
      }

      const companyIds = await contractService.portfolio.getActiveCompanies();
      
      const companies = [];
      for (const companyId of companyIds) {
        try {
          const company = await contractService.portfolio.getCompany(companyId);
          companies.push({
            companyId,
            ...company,
          });
        } catch (err) {
          console.warn(`Failed to get company ${companyId}:`, err.message);
        }
      }

      res.status(200).json({
        data: {
          companies,
          count: companies.length,
        },
      });
    } catch (error) {
      console.error("Get active companies error:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Failed to get active companies",
          details: error.message,
        },
      });
    }
  },

  async getCompanyInvestments(req, res) {
    try {
      const { id } = req.params;

      if (!contractService.isInitialized()) {
        await contractService.initialize();
      }

      const investments = await contractService.portfolio.getCompanyInvestments(parseInt(id));

      res.status(200).json({
        data: {
          companyId: parseInt(id),
          investments,
          count: investments.length,
        },
      });
    } catch (error) {
      console.error("Get company investments error:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Failed to get company investments",
          details: error.message,
        },
      });
    }
  },
};

module.exports = portfolioController;
