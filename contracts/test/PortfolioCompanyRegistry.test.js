const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PortfolioCompanyRegistry", function () {
  let registry;
  let owner, manager, gp, user1;

  beforeEach(async function () {
    [owner, manager, gp, user1] = await ethers.getSigners();

    const PortfolioCompanyRegistry = await ethers.getContractFactory("PortfolioCompanyRegistry");
    registry = await PortfolioCompanyRegistry.deploy();
    await registry.deployed();

    const managerRole = await registry.FUND_MANAGER_ROLE();
    await registry.grantRole(managerRole, manager.address);
  });

  describe("Deployment", function () {
    it("Should set the correct admin", async function () {
      const adminRole = await registry.DEFAULT_ADMIN_ROLE();
      expect(await registry.hasRole(adminRole, owner.address)).to.be.true;
    });

    it("Should initialize with zero companies", async function () {
      expect(await registry.companyCount()).to.equal(0);
    });
  });

  describe("Company Registration", function () {
    it("Should register a new company", async function () {
      const tx = await registry.connect(manager).registerCompany(
        "TechCorp",
        "Technology",
        "USA",
        2020
      );

      await expect(tx)
        .to.emit(registry, "CompanyRegistered")
        .withArgs(0, "TechCorp", "Technology", manager.address);

      expect(await registry.companyCount()).to.equal(1);
    });

    it("Should store correct company details", async function () {
      await registry.connect(manager).registerCompany(
        "TechCorp",
        "Technology",
        "USA",
        2020
      );

      const company = await registry.getCompany(0);
      expect(company.name).to.equal("TechCorp");
      expect(company.industry).to.equal("Technology");
      expect(company.country).to.equal("USA");
      expect(company.foundedYear).to.equal(2020);
      expect(company.registeredBy).to.equal(manager.address);
      expect(company.active).to.be.true;
    });

    it("Should add company to active companies list", async function () {
      await registry.connect(manager).registerCompany("TechCorp", "Technology", "USA", 2020);
      
      const activeCompanies = await registry.getActiveCompanies();
      expect(activeCompanies.length).to.equal(1);
      expect(activeCompanies[0]).to.equal(0);
    });

    it("Should revert if name is empty", async function () {
      await expect(
        registry.connect(manager).registerCompany("", "Technology", "USA", 2020)
      ).to.be.revertedWith("Name required");
    });

    it("Should revert if caller is not fund manager", async function () {
      await expect(
        registry.connect(user1).registerCompany("TechCorp", "Technology", "USA", 2020)
      ).to.be.reverted;
    });
  });

  describe("Investment Recording", function () {
    beforeEach(async function () {
      await registry.connect(manager).registerCompany("TechCorp", "Technology", "USA", 2020);
    });

    it("Should record an investment", async function () {
      const tx = await registry.connect(manager).recordInvestment(
        0, // companyId
        1, // fundId
        ethers.utils.parseEther("100000"), // amount
        2000, // 20% equity (basis points)
        ethers.utils.parseEther("500000") // valuation
      );

      await expect(tx)
        .to.emit(registry, "InvestmentRecorded")
        .withArgs(0, 1, ethers.utils.parseEther("100000"), 2000, ethers.utils.parseEther("500000"));
    });

    it("Should add company to fund portfolio", async function () {
      await registry.connect(manager).recordInvestment(
        0, 1, ethers.utils.parseEther("100000"), 2000, ethers.utils.parseEther("500000")
      );

      const portfolio = await registry.getFundPortfolio(1);
      expect(portfolio.length).to.equal(1);
      expect(portfolio[0]).to.equal(0);
    });

    it("Should not duplicate company in portfolio", async function () {
      await registry.connect(manager).recordInvestment(
        0, 1, ethers.utils.parseEther("100000"), 2000, ethers.utils.parseEther("500000")
      );
      await registry.connect(manager).recordInvestment(
        0, 1, ethers.utils.parseEther("50000"), 1000, ethers.utils.parseEther("500000")
      );

      const portfolio = await registry.getFundPortfolio(1);
      expect(portfolio.length).to.equal(1);
    });

    it("Should store investment details", async function () {
      await registry.connect(manager).recordInvestment(
        0, 1, ethers.utils.parseEther("100000"), 2000, ethers.utils.parseEther("500000")
      );

      const investments = await registry.getCompanyInvestments(0);
      expect(investments.length).to.equal(1);
      expect(investments[0].fundId).to.equal(1);
      expect(investments[0].amount).to.equal(ethers.utils.parseEther("100000"));
      expect(investments[0].equityPercentage).to.equal(2000);
      expect(investments[0].active).to.be.true;
    });

    it("Should revert if company is inactive", async function () {
      await registry.connect(manager).deactivateCompany(0);

      await expect(
        registry.connect(manager).recordInvestment(
          0, 1, ethers.utils.parseEther("100000"), 2000, ethers.utils.parseEther("500000")
        )
      ).to.be.revertedWith("Company not active");
    });

    it("Should revert if amount is zero", async function () {
      await expect(
        registry.connect(manager).recordInvestment(0, 1, 0, 2000, ethers.utils.parseEther("500000"))
      ).to.be.revertedWith("Amount must be positive");
    });

    it("Should revert if equity is invalid", async function () {
      await expect(
        registry.connect(manager).recordInvestment(
          0, 1, ethers.utils.parseEther("100000"), 0, ethers.utils.parseEther("500000")
        )
      ).to.be.revertedWith("Invalid equity");

      await expect(
        registry.connect(manager).recordInvestment(
          0, 1, ethers.utils.parseEther("100000"), 10001, ethers.utils.parseEther("500000")
        )
      ).to.be.revertedWith("Invalid equity");
    });
  });

  describe("Valuation Updates", function () {
    beforeEach(async function () {
      await registry.connect(manager).registerCompany("TechCorp", "Technology", "USA", 2020);
      await registry.connect(manager).recordInvestment(
        0, 1, ethers.utils.parseEther("100000"), 2000, ethers.utils.parseEther("500000")
      );
    });

    it("Should update valuation", async function () {
      const newValuation = ethers.utils.parseEther("750000");
      const tx = await registry.connect(manager).updateValuation(0, 1, 0, newValuation);

      await expect(tx)
        .to.emit(registry, "ValuationUpdated")
        .withArgs(0, 1, ethers.utils.parseEther("500000"), newValuation);
    });

    it("Should store updated valuation", async function () {
      await registry.connect(manager).updateValuation(0, 1, 0, ethers.utils.parseEther("750000"));

      const investments = await registry.getCompanyInvestments(0);
      expect(investments[0].valuation).to.equal(ethers.utils.parseEther("750000"));
    });

    it("Should revert if fund mismatch", async function () {
      await expect(
        registry.connect(manager).updateValuation(0, 2, 0, ethers.utils.parseEther("750000"))
      ).to.be.revertedWith("Fund mismatch");
    });
  });

  describe("Company Deactivation", function () {
    beforeEach(async function () {
      await registry.connect(manager).registerCompany("TechCorp", "Technology", "USA", 2020);
    });

    it("Should deactivate a company", async function () {
      const tx = await registry.connect(manager).deactivateCompany(0);

      await expect(tx).to.emit(registry, "CompanyDeactivated").withArgs(0);

      const company = await registry.getCompany(0);
      expect(company.active).to.be.false;
    });

    it("Should remove from active companies", async function () {
      await registry.connect(manager).deactivateCompany(0);

      const activeCompanies = await registry.getActiveCompanies();
      expect(activeCompanies.length).to.equal(0);
    });

    it("Should reactivate a company", async function () {
      await registry.connect(manager).deactivateCompany(0);
      const tx = await registry.connect(manager).reactivateCompany(0);

      await expect(tx).to.emit(registry, "CompanyReactivated").withArgs(0);

      const company = await registry.getCompany(0);
      expect(company.active).to.be.true;
    });
  });

  describe("Query Functions", function () {
    beforeEach(async function () {
      await registry.connect(manager).registerCompany("TechCorp", "Technology", "USA", 2020);
      await registry.connect(manager).registerCompany("BioTech", "Healthcare", "UK", 2019);
      
      await registry.connect(manager).recordInvestment(
        0, 1, ethers.utils.parseEther("100000"), 2000, ethers.utils.parseEther("500000")
      );
      await registry.connect(manager).recordInvestment(
        0, 1, ethers.utils.parseEther("50000"), 1000, ethers.utils.parseEther("500000")
      );
      await registry.connect(manager).recordInvestment(
        1, 1, ethers.utils.parseEther("200000"), 3000, ethers.utils.parseEther("1000000")
      );
    });

    it("Should return total investment in company", async function () {
      const total = await registry.getTotalInvestmentInCompany(0);
      expect(total).to.equal(ethers.utils.parseEther("150000"));
    });

    it("Should return fund equity in company", async function () {
      const equity = await registry.getFundEquityInCompany(1, 0);
      expect(equity).to.equal(3000); // 20% + 10%
    });

    it("Should return fund portfolio", async function () {
      const portfolio = await registry.getFundPortfolio(1);
      expect(portfolio.length).to.equal(2);
      expect(portfolio[0]).to.equal(0);
      expect(portfolio[1]).to.equal(1);
    });

    it("Should return active companies", async function () {
      const activeCompanies = await registry.getActiveCompanies();
      expect(activeCompanies.length).to.equal(2);
    });

    it("Should return company investments", async function () {
      const investments = await registry.getCompanyInvestments(0);
      expect(investments.length).to.equal(2);
    });
  });

  describe("Access Control", function () {
    it("Should prevent non-managers from registering companies", async function () {
      await expect(
        registry.connect(user1).registerCompany("TechCorp", "Technology", "USA", 2020)
      ).to.be.reverted;
    });

    it("Should prevent non-managers from recording investments", async function () {
      await registry.connect(manager).registerCompany("TechCorp", "Technology", "USA", 2020);
      
      await expect(
        registry.connect(user1).recordInvestment(
          0, 1, ethers.utils.parseEther("100000"), 2000, ethers.utils.parseEther("500000")
        )
      ).to.be.reverted;
    });
  });
});
