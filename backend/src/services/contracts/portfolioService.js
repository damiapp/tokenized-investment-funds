const { ethers } = require("ethers");

class PortfolioService {
  constructor(portfolioRegistry, signer) {
    this.portfolioRegistry = portfolioRegistry;
    this.signer = signer;
  }

  async registerCompany(name, industry, country, foundedYear) {
    const tx = await this.portfolioRegistry.registerCompany(name, industry, country, foundedYear);
    const receipt = await tx.wait();
    
    const event = receipt.events.find(e => e.event === "CompanyRegistered");
    const companyId = event ? event.args.companyId.toNumber() : null;

    return {
      txHash: receipt.transactionHash,
      companyId,
    };
  }

  async recordInvestment(companyId, fundId, amount, equityPercentage, valuation) {
    const tx = await this.portfolioRegistry.recordInvestment(
      companyId,
      fundId,
      ethers.utils.parseEther(amount.toString()),
      equityPercentage,
      ethers.utils.parseEther(valuation.toString())
    );
    const receipt = await tx.wait();

    return {
      txHash: receipt.transactionHash,
    };
  }

  async updateValuation(companyId, fundId, investmentIndex, newValuation) {
    const tx = await this.portfolioRegistry.updateValuation(
      companyId,
      fundId,
      investmentIndex,
      ethers.utils.parseEther(newValuation.toString())
    );
    const receipt = await tx.wait();

    return {
      txHash: receipt.transactionHash,
    };
  }

  async deactivateCompany(companyId) {
    const tx = await this.portfolioRegistry.deactivateCompany(companyId);
    const receipt = await tx.wait();

    return {
      txHash: receipt.transactionHash,
    };
  }

  async reactivateCompany(companyId) {
    const tx = await this.portfolioRegistry.reactivateCompany(companyId);
    const receipt = await tx.wait();

    return {
      txHash: receipt.transactionHash,
    };
  }

  async getCompany(companyId) {
    const company = await this.portfolioRegistry.getCompany(companyId);
    return {
      name: company.name,
      industry: company.industry,
      country: company.country,
      foundedYear: company.foundedYear.toNumber(),
      registeredBy: company.registeredBy,
      registeredAt: company.registeredAt.toNumber(),
      active: company.active,
    };
  }

  async getCompanyInvestments(companyId) {
    const investments = await this.portfolioRegistry.getCompanyInvestments(companyId);
    return investments.map(inv => ({
      companyId: inv.companyId.toNumber(),
      fundId: inv.fundId.toNumber(),
      amount: ethers.utils.formatEther(inv.amount),
      equityPercentage: inv.equityPercentage.toNumber(),
      valuation: ethers.utils.formatEther(inv.valuation),
      investedAt: inv.investedAt.toNumber(),
      active: inv.active,
    }));
  }

  async getFundPortfolio(fundId) {
    const companyIds = await this.portfolioRegistry.getFundPortfolio(fundId);
    return companyIds.map(id => id.toNumber());
  }

  async getActiveCompanies() {
    const companyIds = await this.portfolioRegistry.getActiveCompanies();
    return companyIds.map(id => id.toNumber());
  }

  async getTotalInvestmentInCompany(companyId) {
    const total = await this.portfolioRegistry.getTotalInvestmentInCompany(companyId);
    return ethers.utils.formatEther(total);
  }

  async getFundEquityInCompany(fundId, companyId) {
    const equity = await this.portfolioRegistry.getFundEquityInCompany(fundId, companyId);
    return equity.toNumber();
  }

  async getCompanyCount() {
    const count = await this.portfolioRegistry.companyCount();
    return count.toNumber();
  }
}

module.exports = PortfolioService;
