const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FundFactory", function () {
  let fundFactory;
  let identityRegistry;
  let complianceModule;
  let owner;
  let gp1;
  let gp2;
  let investor;

  beforeEach(async function () {
    [owner, gp1, gp2, investor] = await ethers.getSigners();

    // Deploy IdentityRegistry
    const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
    identityRegistry = await IdentityRegistry.deploy();
    await identityRegistry.deployed();

    // Deploy ComplianceModule
    const ComplianceModule = await ethers.getContractFactory("ComplianceModule");
    complianceModule = await ComplianceModule.deploy(identityRegistry.address);
    await complianceModule.deployed();

    // Deploy FundFactory
    const FundFactory = await ethers.getContractFactory("FundFactory");
    fundFactory = await FundFactory.deploy(
      identityRegistry.address,
      complianceModule.address
    );
    await fundFactory.deployed();
  });

  describe("Deployment", function () {
    it("Should set the correct identity registry", async function () {
      expect(await fundFactory.identityRegistry()).to.equal(identityRegistry.address);
    });

    it("Should set the correct compliance module", async function () {
      expect(await fundFactory.complianceModule()).to.equal(complianceModule.address);
    });

    it("Should set the deployer as owner", async function () {
      expect(await fundFactory.owner()).to.equal(owner.address);
    });

    it("Should start with zero funds", async function () {
      expect(await fundFactory.getFundCount()).to.equal(0);
    });

    it("Should reject zero address for identity registry", async function () {
      const FundFactory = await ethers.getContractFactory("FundFactory");
      await expect(
        FundFactory.deploy(ethers.constants.AddressZero, complianceModule.address)
      ).to.be.revertedWith("Invalid identity registry");
    });

    it("Should reject zero address for compliance module", async function () {
      const FundFactory = await ethers.getContractFactory("FundFactory");
      await expect(
        FundFactory.deploy(identityRegistry.address, ethers.constants.AddressZero)
      ).to.be.revertedWith("Invalid compliance module");
    });
  });

  describe("GP Management", function () {
    it("Should allow owner to approve GP", async function () {
      await fundFactory.approveGP(gp1.address);
      expect(await fundFactory.isApprovedGP(gp1.address)).to.be.true;
    });

    it("Should emit GPApproved event", async function () {
      await expect(fundFactory.approveGP(gp1.address))
        .to.emit(fundFactory, "GPApproved")
        .withArgs(gp1.address);
    });

    it("Should allow owner to revoke GP", async function () {
      await fundFactory.approveGP(gp1.address);
      await fundFactory.revokeGP(gp1.address);
      expect(await fundFactory.isApprovedGP(gp1.address)).to.be.false;
    });

    it("Should emit GPRevoked event", async function () {
      await fundFactory.approveGP(gp1.address);
      await expect(fundFactory.revokeGP(gp1.address))
        .to.emit(fundFactory, "GPRevoked")
        .withArgs(gp1.address);
    });

    it("Should reject zero address for GP approval", async function () {
      await expect(
        fundFactory.approveGP(ethers.constants.AddressZero)
      ).to.be.revertedWithCustomError(fundFactory, "InvalidAddress");
    });

    it("Should only allow owner to approve GP", async function () {
      await expect(
        fundFactory.connect(gp1).approveGP(gp2.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should batch approve multiple GPs", async function () {
      await fundFactory.batchApproveGPs([gp1.address, gp2.address]);
      expect(await fundFactory.isApprovedGP(gp1.address)).to.be.true;
      expect(await fundFactory.isApprovedGP(gp2.address)).to.be.true;
    });

    it("Should skip zero addresses in batch approve", async function () {
      await fundFactory.batchApproveGPs([gp1.address, ethers.constants.AddressZero, gp2.address]);
      expect(await fundFactory.isApprovedGP(gp1.address)).to.be.true;
      expect(await fundFactory.isApprovedGP(gp2.address)).to.be.true;
    });
  });

  describe("Fund Creation", function () {
    beforeEach(async function () {
      await fundFactory.approveGP(gp1.address);
    });

    it("Should create a new fund", async function () {
      const tx = await fundFactory.connect(gp1).createFund(
        "Test Fund",
        "TF",
        ethers.utils.parseEther("1000"),
        ethers.utils.parseEther("10")
      );

      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "FundCreated");
      
      expect(event).to.not.be.undefined;
      expect(event.args.fundId).to.equal(1);
      expect(event.args.gp).to.equal(gp1.address);
      expect(event.args.name).to.equal("Test Fund");
      expect(event.args.symbol).to.equal("TF");
    });

    it("Should increment fund counter", async function () {
      await fundFactory.connect(gp1).createFund(
        "Test Fund 1",
        "TF1",
        ethers.utils.parseEther("1000"),
        ethers.utils.parseEther("10")
      );

      expect(await fundFactory.getFundCount()).to.equal(1);

      await fundFactory.connect(gp1).createFund(
        "Test Fund 2",
        "TF2",
        ethers.utils.parseEther("2000"),
        ethers.utils.parseEther("20")
      );

      expect(await fundFactory.getFundCount()).to.equal(2);
    });

    it("Should store fund information correctly", async function () {
      await fundFactory.connect(gp1).createFund(
        "Test Fund",
        "TF",
        ethers.utils.parseEther("1000"),
        ethers.utils.parseEther("10")
      );

      const fund = await fundFactory.getFund(1);
      expect(fund.id).to.equal(1);
      expect(fund.gp).to.equal(gp1.address);
      expect(fund.name).to.equal("Test Fund");
      expect(fund.symbol).to.equal("TF");
      expect(fund.targetAmount).to.equal(ethers.utils.parseEther("1000"));
      expect(fund.minimumInvestment).to.equal(ethers.utils.parseEther("10"));
      expect(fund.active).to.be.true;
    });

    it("Should deploy fund token with correct parameters", async function () {
      const tx = await fundFactory.connect(gp1).createFund(
        "Test Fund",
        "TF",
        ethers.utils.parseEther("1000"),
        ethers.utils.parseEther("10")
      );

      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "FundCreated");
      const tokenAddress = event.args.tokenAddress;

      const FundToken = await ethers.getContractFactory("FundTokenERC3643");
      const fundToken = FundToken.attach(tokenAddress);

      expect(await fundToken.name()).to.equal("Test Fund");
      expect(await fundToken.symbol()).to.equal("TF");
      expect(await fundToken.owner()).to.equal(gp1.address);
    });

    it("Should track funds by GP", async function () {
      await fundFactory.connect(gp1).createFund(
        "Fund 1",
        "F1",
        ethers.utils.parseEther("1000"),
        ethers.utils.parseEther("10")
      );

      await fundFactory.connect(gp1).createFund(
        "Fund 2",
        "F2",
        ethers.utils.parseEther("2000"),
        ethers.utils.parseEther("20")
      );

      const gp1Funds = await fundFactory.getFundsByGP(gp1.address);
      expect(gp1Funds.length).to.equal(2);
      expect(gp1Funds[0]).to.equal(1);
      expect(gp1Funds[1]).to.equal(2);
    });

    it("Should map token address to fund ID", async function () {
      const tx = await fundFactory.connect(gp1).createFund(
        "Test Fund",
        "TF",
        ethers.utils.parseEther("1000"),
        ethers.utils.parseEther("10")
      );

      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "FundCreated");
      const tokenAddress = event.args.tokenAddress;

      const fundId = await fundFactory.getFundIdByToken(tokenAddress);
      expect(fundId).to.equal(1);
    });

    it("Should reject fund creation from non-approved GP", async function () {
      await expect(
        fundFactory.connect(gp2).createFund(
          "Test Fund",
          "TF",
          ethers.utils.parseEther("1000"),
          ethers.utils.parseEther("10")
        )
      ).to.be.revertedWithCustomError(fundFactory, "NotApprovedGP");
    });

    it("Should reject empty name", async function () {
      await expect(
        fundFactory.connect(gp1).createFund(
          "",
          "TF",
          ethers.utils.parseEther("1000"),
          ethers.utils.parseEther("10")
        )
      ).to.be.revertedWithCustomError(fundFactory, "InvalidParameters");
    });

    it("Should reject empty symbol", async function () {
      await expect(
        fundFactory.connect(gp1).createFund(
          "Test Fund",
          "",
          ethers.utils.parseEther("1000"),
          ethers.utils.parseEther("10")
        )
      ).to.be.revertedWithCustomError(fundFactory, "InvalidParameters");
    });

    it("Should reject zero target amount", async function () {
      await expect(
        fundFactory.connect(gp1).createFund(
          "Test Fund",
          "TF",
          0,
          ethers.utils.parseEther("10")
        )
      ).to.be.revertedWithCustomError(fundFactory, "InvalidParameters");
    });

    it("Should reject zero minimum investment", async function () {
      await expect(
        fundFactory.connect(gp1).createFund(
          "Test Fund",
          "TF",
          ethers.utils.parseEther("1000"),
          0
        )
      ).to.be.revertedWithCustomError(fundFactory, "InvalidParameters");
    });
  });

  describe("Fund Queries", function () {
    beforeEach(async function () {
      await fundFactory.approveGP(gp1.address);
      await fundFactory.approveGP(gp2.address);

      // Create multiple funds
      await fundFactory.connect(gp1).createFund(
        "Fund 1",
        "F1",
        ethers.utils.parseEther("1000"),
        ethers.utils.parseEther("10")
      );

      await fundFactory.connect(gp1).createFund(
        "Fund 2",
        "F2",
        ethers.utils.parseEther("2000"),
        ethers.utils.parseEther("20")
      );

      await fundFactory.connect(gp2).createFund(
        "Fund 3",
        "F3",
        ethers.utils.parseEther("3000"),
        ethers.utils.parseEther("30")
      );
    });

    it("Should get fund by ID", async function () {
      const fund = await fundFactory.getFund(1);
      expect(fund.name).to.equal("Fund 1");
      expect(fund.symbol).to.equal("F1");
    });

    it("Should revert for invalid fund ID (zero)", async function () {
      await expect(
        fundFactory.getFund(0)
      ).to.be.revertedWithCustomError(fundFactory, "FundNotFound");
    });

    it("Should revert for non-existent fund ID", async function () {
      await expect(
        fundFactory.getFund(999)
      ).to.be.revertedWithCustomError(fundFactory, "FundNotFound");
    });

    it("Should get correct fund count", async function () {
      expect(await fundFactory.getFundCount()).to.equal(3);
    });

    it("Should get funds by GP", async function () {
      const gp1Funds = await fundFactory.getFundsByGP(gp1.address);
      expect(gp1Funds.length).to.equal(2);

      const gp2Funds = await fundFactory.getFundsByGP(gp2.address);
      expect(gp2Funds.length).to.equal(1);
    });

    it("Should return empty array for GP with no funds", async function () {
      const funds = await fundFactory.getFundsByGP(investor.address);
      expect(funds.length).to.equal(0);
    });

    it("Should get active funds with pagination", async function () {
      const funds = await fundFactory.getActiveFunds(0, 10);
      expect(funds.length).to.equal(3);
      expect(funds[0].name).to.equal("Fund 1");
      expect(funds[1].name).to.equal("Fund 2");
      expect(funds[2].name).to.equal("Fund 3");
    });

    it("Should handle pagination offset", async function () {
      const funds = await fundFactory.getActiveFunds(1, 10);
      expect(funds.length).to.equal(2);
      expect(funds[0].name).to.equal("Fund 2");
      expect(funds[1].name).to.equal("Fund 3");
    });

    it("Should handle pagination limit", async function () {
      const funds = await fundFactory.getActiveFunds(0, 2);
      expect(funds.length).to.equal(2);
      expect(funds[0].name).to.equal("Fund 1");
      expect(funds[1].name).to.equal("Fund 2");
    });

    it("Should return empty array for offset beyond range", async function () {
      const funds = await fundFactory.getActiveFunds(10, 10);
      expect(funds.length).to.equal(0);
    });

    it("Should reject invalid limit", async function () {
      await expect(
        fundFactory.getActiveFunds(0, 0)
      ).to.be.revertedWith("Invalid limit");

      await expect(
        fundFactory.getActiveFunds(0, 101)
      ).to.be.revertedWith("Invalid limit");
    });
  });

  describe("Fund Activation", function () {
    beforeEach(async function () {
      await fundFactory.approveGP(gp1.address);
      await fundFactory.connect(gp1).createFund(
        "Test Fund",
        "TF",
        ethers.utils.parseEther("1000"),
        ethers.utils.parseEther("10")
      );
    });

    it("Should deactivate fund by GP", async function () {
      await fundFactory.connect(gp1).deactivateFund(1);
      const fund = await fundFactory.getFund(1);
      expect(fund.active).to.be.false;
    });

    it("Should emit FundDeactivated event", async function () {
      await expect(fundFactory.connect(gp1).deactivateFund(1))
        .to.emit(fundFactory, "FundDeactivated")
        .withArgs(1);
    });

    it("Should reactivate fund by GP", async function () {
      await fundFactory.connect(gp1).deactivateFund(1);
      await fundFactory.connect(gp1).reactivateFund(1);
      const fund = await fundFactory.getFund(1);
      expect(fund.active).to.be.true;
    });

    it("Should emit FundReactivated event", async function () {
      await fundFactory.connect(gp1).deactivateFund(1);
      await expect(fundFactory.connect(gp1).reactivateFund(1))
        .to.emit(fundFactory, "FundReactivated")
        .withArgs(1);
    });

    it("Should only allow GP to deactivate their fund", async function () {
      await fundFactory.approveGP(gp2.address);
      await expect(
        fundFactory.connect(gp2).deactivateFund(1)
      ).to.be.revertedWith("Only GP can deactivate");
    });

    it("Should only allow GP to reactivate their fund", async function () {
      await fundFactory.connect(gp1).deactivateFund(1);
      await fundFactory.approveGP(gp2.address);
      await expect(
        fundFactory.connect(gp2).reactivateFund(1)
      ).to.be.revertedWith("Only GP can reactivate");
    });

    it("Should not deactivate already inactive fund", async function () {
      await fundFactory.connect(gp1).deactivateFund(1);
      await expect(
        fundFactory.connect(gp1).deactivateFund(1)
      ).to.be.revertedWith("Fund already inactive");
    });

    it("Should not reactivate already active fund", async function () {
      await expect(
        fundFactory.connect(gp1).reactivateFund(1)
      ).to.be.revertedWith("Fund already active");
    });

    it("Should exclude inactive funds from active funds query", async function () {
      await fundFactory.connect(gp1).createFund(
        "Fund 2",
        "F2",
        ethers.utils.parseEther("2000"),
        ethers.utils.parseEther("20")
      );

      await fundFactory.connect(gp1).deactivateFund(1);

      const activeFunds = await fundFactory.getActiveFunds(0, 10);
      expect(activeFunds.length).to.equal(1);
      expect(activeFunds[0].name).to.equal("Fund 2");
    });
  });

  describe("Configuration Updates", function () {
    it("Should update identity registry", async function () {
      const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
      const newRegistry = await IdentityRegistry.deploy();
      await newRegistry.deployed();

      await fundFactory.updateIdentityRegistry(newRegistry.address);
      expect(await fundFactory.identityRegistry()).to.equal(newRegistry.address);
    });

    it("Should emit IdentityRegistryUpdated event", async function () {
      const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
      const newRegistry = await IdentityRegistry.deploy();
      await newRegistry.deployed();

      await expect(fundFactory.updateIdentityRegistry(newRegistry.address))
        .to.emit(fundFactory, "IdentityRegistryUpdated")
        .withArgs(newRegistry.address);
    });

    it("Should update compliance module", async function () {
      const ComplianceModule = await ethers.getContractFactory("ComplianceModule");
      const newModule = await ComplianceModule.deploy(identityRegistry.address);
      await newModule.deployed();

      await fundFactory.updateComplianceModule(newModule.address);
      expect(await fundFactory.complianceModule()).to.equal(newModule.address);
    });

    it("Should emit ComplianceModuleUpdated event", async function () {
      const ComplianceModule = await ethers.getContractFactory("ComplianceModule");
      const newModule = await ComplianceModule.deploy(identityRegistry.address);
      await newModule.deployed();

      await expect(fundFactory.updateComplianceModule(newModule.address))
        .to.emit(fundFactory, "ComplianceModuleUpdated")
        .withArgs(newModule.address);
    });

    it("Should reject zero address for identity registry update", async function () {
      await expect(
        fundFactory.updateIdentityRegistry(ethers.constants.AddressZero)
      ).to.be.revertedWithCustomError(fundFactory, "InvalidAddress");
    });

    it("Should reject zero address for compliance module update", async function () {
      await expect(
        fundFactory.updateComplianceModule(ethers.constants.AddressZero)
      ).to.be.revertedWithCustomError(fundFactory, "InvalidAddress");
    });

    it("Should only allow owner to update identity registry", async function () {
      const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
      const newRegistry = await IdentityRegistry.deploy();
      await newRegistry.deployed();

      await expect(
        fundFactory.connect(gp1).updateIdentityRegistry(newRegistry.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should only allow owner to update compliance module", async function () {
      const ComplianceModule = await ethers.getContractFactory("ComplianceModule");
      const newModule = await ComplianceModule.deploy(identityRegistry.address);
      await newModule.deployed();

      await expect(
        fundFactory.connect(gp1).updateComplianceModule(newModule.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
