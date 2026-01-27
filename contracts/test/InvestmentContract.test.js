const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("InvestmentContract", function () {
  let investmentContract;
  let identityRegistry;
  let complianceModule;
  let fundToken;
  let owner, gp, investor1, investor2, investor3;

  beforeEach(async function () {
    [owner, gp, investor1, investor2, investor3] = await ethers.getSigners();

    // Deploy IdentityRegistry
    const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
    identityRegistry = await IdentityRegistry.deploy();
    await identityRegistry.deployed();

    // Deploy ComplianceModule
    const ComplianceModule = await ethers.getContractFactory("ComplianceModule");
    complianceModule = await ComplianceModule.deploy(identityRegistry.address);
    await complianceModule.deployed();

    // Deploy InvestmentContract
    const InvestmentContract = await ethers.getContractFactory("InvestmentContract");
    investmentContract = await InvestmentContract.deploy(identityRegistry.address);
    await investmentContract.deployed();

    // Deploy a mock fund token
    const FundTokenERC3643 = await ethers.getContractFactory("FundTokenERC3643");
    fundToken = await FundTokenERC3643.deploy(
      "Test Fund Token",
      "TFT",
      identityRegistry.address,
      complianceModule.address
    );
    await fundToken.deployed();

    // Register and verify investors
    await identityRegistry.registerIdentity(investor1.address, 840);
    await identityRegistry.registerIdentity(investor2.address, 840);
    await identityRegistry.registerIdentity(investor3.address, 840);
  });

  describe("Deployment", function () {
    it("Should set the correct identity registry", async function () {
      expect(await investmentContract.identityRegistry()).to.equal(identityRegistry.address);
    });

    it("Should grant admin role to deployer", async function () {
      const adminRole = await investmentContract.DEFAULT_ADMIN_ROLE();
      expect(await investmentContract.hasRole(adminRole, owner.address)).to.be.true;
    });

    it("Should grant fund manager role to deployer", async function () {
      const managerRole = await investmentContract.FUND_MANAGER_ROLE();
      expect(await investmentContract.hasRole(managerRole, owner.address)).to.be.true;
    });

    it("Should initialize with zero funds", async function () {
      expect(await investmentContract.fundCount()).to.equal(0);
    });

    it("Should initialize with zero investment volume", async function () {
      expect(await investmentContract.totalInvestmentVolume()).to.equal(0);
    });
  });

  describe("Fund Registration", function () {
    it("Should register a new fund", async function () {
      const tx = await investmentContract.registerFund(
        fundToken.address,
        gp.address,
        ethers.utils.parseEther("1000000"), // 1M target
        ethers.utils.parseEther("10000") // 10k minimum
      );

      await expect(tx)
        .to.emit(investmentContract, "FundRegistered")
        .withArgs(0, fundToken.address, gp.address, ethers.utils.parseEther("1000000"), ethers.utils.parseEther("10000"));

      expect(await investmentContract.fundCount()).to.equal(1);
    });

    it("Should grant GP role to the general partner", async function () {
      await investmentContract.registerFund(
        fundToken.address,
        gp.address,
        ethers.utils.parseEther("1000000"),
        ethers.utils.parseEther("10000")
      );

      const gpRole = await investmentContract.GP_ROLE();
      expect(await investmentContract.hasRole(gpRole, gp.address)).to.be.true;
    });

    it("Should store correct fund details", async function () {
      await investmentContract.registerFund(
        fundToken.address,
        gp.address,
        ethers.utils.parseEther("1000000"),
        ethers.utils.parseEther("10000")
      );

      const fund = await investmentContract.getFund(0);
      expect(fund.fundToken).to.equal(fundToken.address);
      expect(fund.gp).to.equal(gp.address);
      expect(fund.targetAmount).to.equal(ethers.utils.parseEther("1000000"));
      expect(fund.minimumInvestment).to.equal(ethers.utils.parseEther("10000"));
      expect(fund.active).to.be.true;
      expect(fund.investorCount).to.equal(0);
      expect(fund.raisedAmount).to.equal(0);
    });

    it("Should revert if fund token is zero address", async function () {
      await expect(
        investmentContract.registerFund(
          ethers.constants.AddressZero,
          gp.address,
          ethers.utils.parseEther("1000000"),
          ethers.utils.parseEther("10000")
        )
      ).to.be.revertedWith("Invalid fund token");
    });

    it("Should revert if GP is zero address", async function () {
      await expect(
        investmentContract.registerFund(
          fundToken.address,
          ethers.constants.AddressZero,
          ethers.utils.parseEther("1000000"),
          ethers.utils.parseEther("10000")
        )
      ).to.be.revertedWith("Invalid GP address");
    });

    it("Should revert if target amount is zero", async function () {
      await expect(
        investmentContract.registerFund(
          fundToken.address,
          gp.address,
          0,
          ethers.utils.parseEther("10000")
        )
      ).to.be.revertedWith("Target amount must be positive");
    });

    it("Should revert if caller is not fund manager", async function () {
      await expect(
        investmentContract.connect(investor1).registerFund(
          fundToken.address,
          gp.address,
          ethers.utils.parseEther("1000000"),
          ethers.utils.parseEther("10000")
        )
      ).to.be.reverted;
    });
  });

  describe("Investment Recording", function () {
    beforeEach(async function () {
      await investmentContract.registerFund(
        fundToken.address,
        gp.address,
        ethers.utils.parseEther("1000000"),
        ethers.utils.parseEther("10000")
      );
    });

    it("Should record a new investment", async function () {
      const amount = ethers.utils.parseEther("50000");
      const tokenAmount = ethers.utils.parseEther("50000");

      const tx = await investmentContract.recordInvestment(
        0,
        investor1.address,
        amount,
        tokenAmount,
        "0xabc123"
      );

      await expect(tx)
        .to.emit(investmentContract, "InvestmentRecorded")
        .withArgs(0, 0, investor1.address, amount, tokenAmount);
    });

    it("Should store correct investment details", async function () {
      const amount = ethers.utils.parseEther("50000");
      const tokenAmount = ethers.utils.parseEther("50000");

      await investmentContract.recordInvestment(
        0,
        investor1.address,
        amount,
        tokenAmount,
        "0xabc123"
      );

      const investment = await investmentContract.getInvestment(0, 0);
      expect(investment.investor).to.equal(investor1.address);
      expect(investment.fundToken).to.equal(fundToken.address);
      expect(investment.amount).to.equal(amount);
      expect(investment.tokenAmount).to.equal(tokenAmount);
      expect(investment.status).to.equal(0); // Pending
      expect(investment.txHash).to.equal("0xabc123");
    });

    it("Should track investor funds", async function () {
      await investmentContract.recordInvestment(
        0,
        investor1.address,
        ethers.utils.parseEther("50000"),
        ethers.utils.parseEther("50000"),
        "0xabc123"
      );

      const investorFunds = await investmentContract.getInvestorFunds(investor1.address);
      expect(investorFunds.length).to.equal(1);
      expect(investorFunds[0]).to.equal(0);
    });

    it("Should revert if investor is not verified", async function () {
      const unverifiedInvestor = investor3;
      await identityRegistry.removeIdentity(unverifiedInvestor.address);

      await expect(
        investmentContract.recordInvestment(
          0,
          unverifiedInvestor.address,
          ethers.utils.parseEther("50000"),
          ethers.utils.parseEther("50000"),
          "0xabc123"
        )
      ).to.be.revertedWith("Investor not verified");
    });

    it("Should revert if amount is below minimum investment", async function () {
      await expect(
        investmentContract.recordInvestment(
          0,
          investor1.address,
          ethers.utils.parseEther("5000"), // Below 10k minimum
          ethers.utils.parseEther("5000"),
          "0xabc123"
        )
      ).to.be.revertedWith("Below minimum investment");
    });

    it("Should revert if fund is not active", async function () {
      await investmentContract.closeFund(0);

      await expect(
        investmentContract.recordInvestment(
          0,
          investor1.address,
          ethers.utils.parseEther("50000"),
          ethers.utils.parseEther("50000"),
          "0xabc123"
        )
      ).to.be.revertedWith("Fund not active");
    });

    it("Should revert if fund ID is invalid", async function () {
      await expect(
        investmentContract.recordInvestment(
          999,
          investor1.address,
          ethers.utils.parseEther("50000"),
          ethers.utils.parseEther("50000"),
          "0xabc123"
        )
      ).to.be.revertedWith("Invalid fund ID");
    });
  });

  describe("Investment Confirmation", function () {
    beforeEach(async function () {
      await investmentContract.registerFund(
        fundToken.address,
        gp.address,
        ethers.utils.parseEther("1000000"),
        ethers.utils.parseEther("10000")
      );

      await investmentContract.recordInvestment(
        0,
        investor1.address,
        ethers.utils.parseEther("50000"),
        ethers.utils.parseEther("50000"),
        "0xabc123"
      );
    });

    it("Should confirm an investment", async function () {
      const tx = await investmentContract.confirmInvestment(0, 0);

      await expect(tx)
        .to.emit(investmentContract, "InvestmentConfirmed")
        .withArgs(0, 0, investor1.address);

      await expect(tx)
        .to.emit(investmentContract, "CapitalContributed")
        .withArgs(0, investor1.address, ethers.utils.parseEther("50000"));
    });

    it("Should update investment status to confirmed", async function () {
      await investmentContract.confirmInvestment(0, 0);

      const investment = await investmentContract.getInvestment(0, 0);
      expect(investment.status).to.equal(1); // Confirmed
    });

    it("Should update fund raised amount", async function () {
      await investmentContract.confirmInvestment(0, 0);

      const fund = await investmentContract.getFund(0);
      expect(fund.raisedAmount).to.equal(ethers.utils.parseEther("50000"));
    });

    it("Should update investor count", async function () {
      await investmentContract.confirmInvestment(0, 0);

      const fund = await investmentContract.getFund(0);
      expect(fund.investorCount).to.equal(1);
    });

    it("Should not increment investor count for repeat investments", async function () {
      await investmentContract.confirmInvestment(0, 0);

      await investmentContract.recordInvestment(
        0,
        investor1.address,
        ethers.utils.parseEther("25000"),
        ethers.utils.parseEther("25000"),
        "0xdef456"
      );

      await investmentContract.confirmInvestment(0, 1);

      const fund = await investmentContract.getFund(0);
      expect(fund.investorCount).to.equal(1);
      expect(fund.raisedAmount).to.equal(ethers.utils.parseEther("75000"));
    });

    it("Should update total investment volume", async function () {
      await investmentContract.confirmInvestment(0, 0);

      expect(await investmentContract.totalInvestmentVolume()).to.equal(
        ethers.utils.parseEther("50000")
      );
    });

    it("Should track investor total investment", async function () {
      await investmentContract.confirmInvestment(0, 0);

      const total = await investmentContract.getInvestorTotal(0, investor1.address);
      expect(total).to.equal(ethers.utils.parseEther("50000"));
    });

    it("Should revert if investment is not pending", async function () {
      await investmentContract.confirmInvestment(0, 0);

      await expect(
        investmentContract.confirmInvestment(0, 0)
      ).to.be.revertedWith("Investment not pending");
    });
  });

  describe("Investment Cancellation", function () {
    beforeEach(async function () {
      await investmentContract.registerFund(
        fundToken.address,
        gp.address,
        ethers.utils.parseEther("1000000"),
        ethers.utils.parseEther("10000")
      );

      await investmentContract.recordInvestment(
        0,
        investor1.address,
        ethers.utils.parseEther("50000"),
        ethers.utils.parseEther("50000"),
        "0xabc123"
      );
    });

    it("Should allow fund manager to cancel investment", async function () {
      const tx = await investmentContract.cancelInvestment(0, 0);

      await expect(tx)
        .to.emit(investmentContract, "InvestmentCancelled")
        .withArgs(0, 0, investor1.address);

      const investment = await investmentContract.getInvestment(0, 0);
      expect(investment.status).to.equal(2); // Cancelled
    });

    it("Should allow investor to cancel their own investment", async function () {
      const tx = await investmentContract.connect(investor1).cancelInvestment(0, 0);

      await expect(tx)
        .to.emit(investmentContract, "InvestmentCancelled")
        .withArgs(0, 0, investor1.address);
    });

    it("Should revert if caller is not authorized", async function () {
      await expect(
        investmentContract.connect(investor2).cancelInvestment(0, 0)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should revert if investment is not pending", async function () {
      await investmentContract.confirmInvestment(0, 0);

      await expect(
        investmentContract.cancelInvestment(0, 0)
      ).to.be.revertedWith("Investment not pending");
    });
  });

  describe("Fund Closure", function () {
    beforeEach(async function () {
      await investmentContract.registerFund(
        fundToken.address,
        gp.address,
        ethers.utils.parseEther("1000000"),
        ethers.utils.parseEther("10000")
      );
    });

    it("Should allow fund manager to close fund", async function () {
      const tx = await investmentContract.closeFund(0);

      await expect(tx)
        .to.emit(investmentContract, "FundClosed")
        .withArgs(0, 0);

      const fund = await investmentContract.getFund(0);
      expect(fund.active).to.be.false;
    });

    it("Should allow GP to close fund", async function () {
      const tx = await investmentContract.connect(gp).closeFund(0);

      await expect(tx)
        .to.emit(investmentContract, "FundClosed")
        .withArgs(0, 0);
    });

    it("Should revert if caller is not authorized", async function () {
      await expect(
        investmentContract.connect(investor1).closeFund(0)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should revert if fund is already closed", async function () {
      await investmentContract.closeFund(0);

      await expect(
        investmentContract.closeFund(0)
      ).to.be.revertedWith("Fund already closed");
    });
  });

  describe("Query Functions", function () {
    beforeEach(async function () {
      await investmentContract.registerFund(
        fundToken.address,
        gp.address,
        ethers.utils.parseEther("1000000"),
        ethers.utils.parseEther("10000")
      );

      await investmentContract.recordInvestment(
        0,
        investor1.address,
        ethers.utils.parseEther("50000"),
        ethers.utils.parseEther("50000"),
        "0xabc123"
      );

      await investmentContract.recordInvestment(
        0,
        investor2.address,
        ethers.utils.parseEther("30000"),
        ethers.utils.parseEther("30000"),
        "0xdef456"
      );
    });

    it("Should return correct fund investment count", async function () {
      const count = await investmentContract.getFundInvestmentCount(0);
      expect(count).to.equal(2);
    });

    it("Should return investor funds", async function () {
      const funds = await investmentContract.getInvestorFunds(investor1.address);
      expect(funds.length).to.equal(1);
      expect(funds[0]).to.equal(0);
    });

    it("Should return investor total for fund", async function () {
      await investmentContract.confirmInvestment(0, 0);

      const total = await investmentContract.getInvestorTotal(0, investor1.address);
      expect(total).to.equal(ethers.utils.parseEther("50000"));
    });
  });

  describe("Access Control", function () {
    it("Should allow admin to update identity registry", async function () {
      const newRegistry = await (await ethers.getContractFactory("IdentityRegistry")).deploy();
      await newRegistry.deployed();

      await investmentContract.setIdentityRegistry(newRegistry.address);
      expect(await investmentContract.identityRegistry()).to.equal(newRegistry.address);
    });

    it("Should revert if non-admin tries to update identity registry", async function () {
      const newRegistry = await (await ethers.getContractFactory("IdentityRegistry")).deploy();
      await newRegistry.deployed();

      await expect(
        investmentContract.connect(investor1).setIdentityRegistry(newRegistry.address)
      ).to.be.reverted;
    });
  });

  describe("Complex Scenarios", function () {
    it("Should handle multiple funds and investments", async function () {
      // Register two funds
      await investmentContract.registerFund(
        fundToken.address,
        gp.address,
        ethers.utils.parseEther("1000000"),
        ethers.utils.parseEther("10000")
      );

      const fundToken2 = await (await ethers.getContractFactory("FundTokenERC3643")).deploy(
        "Fund 2",
        "F2",
        identityRegistry.address,
        complianceModule.address
      );
      await fundToken2.deployed();

      await investmentContract.registerFund(
        fundToken2.address,
        gp.address,
        ethers.utils.parseEther("500000"),
        ethers.utils.parseEther("5000")
      );

      // Record investments in both funds
      await investmentContract.recordInvestment(
        0,
        investor1.address,
        ethers.utils.parseEther("50000"),
        ethers.utils.parseEther("50000"),
        "0xabc"
      );

      await investmentContract.recordInvestment(
        1,
        investor1.address,
        ethers.utils.parseEther("25000"),
        ethers.utils.parseEther("25000"),
        "0xdef"
      );

      // Confirm both
      await investmentContract.confirmInvestment(0, 0);
      await investmentContract.confirmInvestment(1, 0);

      // Check investor funds
      const investorFunds = await investmentContract.getInvestorFunds(investor1.address);
      expect(investorFunds.length).to.equal(2);

      // Check totals
      expect(await investmentContract.totalInvestmentVolume()).to.equal(
        ethers.utils.parseEther("75000")
      );
    });
  });
});
