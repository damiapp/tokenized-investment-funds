const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FundTokenERC3643", function () {
  let identityRegistry;
  let complianceModule;
  let fundToken;
  let owner;
  let user1;
  let user2;
  let user3;

  const CLAIM_KYC_VERIFIED = 2;
  const CLAIM_ACCREDITED_INVESTOR = 1;
  const COUNTRY_USA = 840;
  const COUNTRY_UK = 826;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
    identityRegistry = await IdentityRegistry.deploy();
    await identityRegistry.deployed();

    const ComplianceModule = await ethers.getContractFactory("ComplianceModule");
    complianceModule = await ComplianceModule.deploy(identityRegistry.address);
    await complianceModule.deployed();

    const FundTokenERC3643 = await ethers.getContractFactory("FundTokenERC3643");
    fundToken = await FundTokenERC3643.deploy(
      "Test Fund Token",
      "TFT",
      identityRegistry.address,
      complianceModule.address
    );
    await fundToken.deployed();

    await identityRegistry.registerIdentity(owner.address, COUNTRY_USA);
    await identityRegistry.addClaim(owner.address, CLAIM_KYC_VERIFIED);
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await fundToken.name()).to.equal("Test Fund Token");
      expect(await fundToken.symbol()).to.equal("TFT");
    });

    it("Should set the identity registry", async function () {
      expect(await fundToken.identityRegistry()).to.equal(identityRegistry.address);
    });

    it("Should set the compliance module", async function () {
      expect(await fundToken.complianceModule()).to.equal(complianceModule.address);
    });

    it("Should enable compliance by default", async function () {
      expect(await fundToken.complianceEnabled()).to.equal(true);
    });
  });

  describe("Minting", function () {
    it("Should mint tokens to verified address", async function () {
      await fundToken.mint(owner.address, ethers.utils.parseEther("100"));
      expect(await fundToken.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("100"));
    });

    it("Should only allow owner to mint", async function () {
      await expect(
        fundToken.connect(user1).mint(user1.address, ethers.utils.parseEther("100"))
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should batch mint to multiple addresses", async function () {
      await identityRegistry.registerIdentity(user1.address, COUNTRY_USA);
      await identityRegistry.addClaim(user1.address, CLAIM_KYC_VERIFIED);
      await identityRegistry.registerIdentity(user2.address, COUNTRY_USA);
      await identityRegistry.addClaim(user2.address, CLAIM_KYC_VERIFIED);

      const recipients = [user1.address, user2.address];
      const amounts = [ethers.utils.parseEther("50"), ethers.utils.parseEther("75")];

      await fundToken.batchMint(recipients, amounts);

      expect(await fundToken.balanceOf(user1.address)).to.equal(ethers.utils.parseEther("50"));
      expect(await fundToken.balanceOf(user2.address)).to.equal(ethers.utils.parseEther("75"));
    });
  });

  describe("Transfers with Compliance", function () {
    beforeEach(async function () {
      await identityRegistry.registerIdentity(user1.address, COUNTRY_USA);
      await identityRegistry.addClaim(user1.address, CLAIM_KYC_VERIFIED);
      await identityRegistry.registerIdentity(user2.address, COUNTRY_USA);
      await identityRegistry.addClaim(user2.address, CLAIM_KYC_VERIFIED);

      await fundToken.mint(user1.address, ethers.utils.parseEther("100"));
    });

    it("Should allow transfer between verified addresses", async function () {
      await fundToken.connect(user1).transfer(user2.address, ethers.utils.parseEther("50"));
      expect(await fundToken.balanceOf(user2.address)).to.equal(ethers.utils.parseEther("50"));
    });

    it("Should reject transfer to unverified address", async function () {
      await expect(
        fundToken.connect(user1).transfer(user3.address, ethers.utils.parseEther("50"))
      ).to.be.revertedWithCustomError(fundToken, "NotVerified");
    });

    it("Should allow transfer when compliance is disabled", async function () {
      await fundToken.setComplianceEnabled(false);
      await fundToken.connect(user1).transfer(user3.address, ethers.utils.parseEther("50"));
      expect(await fundToken.balanceOf(user3.address)).to.equal(ethers.utils.parseEther("50"));
    });
  });

  describe("Account Freezing", function () {
    beforeEach(async function () {
      await identityRegistry.registerIdentity(user1.address, COUNTRY_USA);
      await identityRegistry.addClaim(user1.address, CLAIM_KYC_VERIFIED);
      await fundToken.mint(user1.address, ethers.utils.parseEther("100"));
    });

    it("Should freeze an account", async function () {
      await fundToken.freezeAccount(user1.address);
      expect(await fundToken.frozen(user1.address)).to.equal(true);
    });

    it("Should prevent transfers from frozen account", async function () {
      await identityRegistry.registerIdentity(user2.address, COUNTRY_USA);
      await identityRegistry.addClaim(user2.address, CLAIM_KYC_VERIFIED);

      await fundToken.freezeAccount(user1.address);
      await expect(
        fundToken.connect(user1).transfer(user2.address, ethers.utils.parseEther("50"))
      ).to.be.revertedWithCustomError(fundToken, "AccountFrozen");
    });

    it("Should unfreeze an account", async function () {
      await fundToken.freezeAccount(user1.address);
      await fundToken.unfreezeAccount(user1.address);
      expect(await fundToken.frozen(user1.address)).to.equal(false);
    });

    it("Should emit events", async function () {
      await expect(fundToken.freezeAccount(user1.address))
        .to.emit(fundToken, "AccountFrozen")
        .withArgs(user1.address);

      await expect(fundToken.unfreezeAccount(user1.address))
        .to.emit(fundToken, "AccountUnfrozen")
        .withArgs(user1.address);
    });
  });

  describe("Partial Token Freezing", function () {
    beforeEach(async function () {
      await identityRegistry.registerIdentity(user1.address, COUNTRY_USA);
      await identityRegistry.addClaim(user1.address, CLAIM_KYC_VERIFIED);
      await fundToken.mint(user1.address, ethers.utils.parseEther("100"));
    });

    it("Should freeze partial tokens", async function () {
      await fundToken.freezePartialTokens(user1.address, ethers.utils.parseEther("30"));
      expect(await fundToken.frozenTokens(user1.address)).to.equal(ethers.utils.parseEther("30"));
    });

    it("Should calculate available balance correctly", async function () {
      await fundToken.freezePartialTokens(user1.address, ethers.utils.parseEther("30"));
      expect(await fundToken.getAvailableBalance(user1.address)).to.equal(
        ethers.utils.parseEther("70")
      );
    });

    it("Should prevent transfer of frozen tokens", async function () {
      await identityRegistry.registerIdentity(user2.address, COUNTRY_USA);
      await identityRegistry.addClaim(user2.address, CLAIM_KYC_VERIFIED);

      await fundToken.freezePartialTokens(user1.address, ethers.utils.parseEther("30"));
      await expect(
        fundToken.connect(user1).transfer(user2.address, ethers.utils.parseEther("80"))
      ).to.be.revertedWithCustomError(fundToken, "InsufficientUnfrozenBalance");
    });

    it("Should allow transfer of unfrozen tokens", async function () {
      await identityRegistry.registerIdentity(user2.address, COUNTRY_USA);
      await identityRegistry.addClaim(user2.address, CLAIM_KYC_VERIFIED);

      await fundToken.freezePartialTokens(user1.address, ethers.utils.parseEther("30"));
      await fundToken.connect(user1).transfer(user2.address, ethers.utils.parseEther("50"));
      expect(await fundToken.balanceOf(user2.address)).to.equal(ethers.utils.parseEther("50"));
    });

    it("Should unfreeze partial tokens", async function () {
      await fundToken.freezePartialTokens(user1.address, ethers.utils.parseEther("30"));
      await fundToken.unfreezePartialTokens(user1.address, ethers.utils.parseEther("10"));
      expect(await fundToken.frozenTokens(user1.address)).to.equal(ethers.utils.parseEther("20"));
    });
  });

  describe("Forced Transfer", function () {
    beforeEach(async function () {
      await identityRegistry.registerIdentity(user1.address, COUNTRY_USA);
      await identityRegistry.addClaim(user1.address, CLAIM_KYC_VERIFIED);
      await identityRegistry.registerIdentity(user2.address, COUNTRY_USA);
      await identityRegistry.addClaim(user2.address, CLAIM_KYC_VERIFIED);
      await fundToken.mint(user1.address, ethers.utils.parseEther("100"));
    });

    it("Should allow owner to force transfer", async function () {
      await fundToken.forcedTransfer(
        user1.address,
        user2.address,
        ethers.utils.parseEther("50")
      );
      expect(await fundToken.balanceOf(user2.address)).to.equal(ethers.utils.parseEther("50"));
    });

    it("Should emit ForcedTransfer event", async function () {
      await expect(
        fundToken.forcedTransfer(user1.address, user2.address, ethers.utils.parseEther("50"))
      )
        .to.emit(fundToken, "ForcedTransfer")
        .withArgs(user1.address, user2.address, ethers.utils.parseEther("50"), owner.address);
    });

    it("Should only allow owner to force transfer", async function () {
      await expect(
        fundToken
          .connect(user1)
          .forcedTransfer(user1.address, user2.address, ethers.utils.parseEther("50"))
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Recovery Transfer", function () {
    beforeEach(async function () {
      await identityRegistry.registerIdentity(user1.address, COUNTRY_USA);
      await identityRegistry.addClaim(user1.address, CLAIM_KYC_VERIFIED);
      await identityRegistry.registerIdentity(user2.address, COUNTRY_USA);
      await identityRegistry.addClaim(user2.address, CLAIM_KYC_VERIFIED);
      await fundToken.mint(user1.address, ethers.utils.parseEther("100"));
    });

    it("Should recover tokens to new wallet", async function () {
      await fundToken.recoveryTransfer(
        user1.address,
        user2.address,
        ethers.utils.parseEther("100")
      );
      expect(await fundToken.balanceOf(user2.address)).to.equal(ethers.utils.parseEther("100"));
      expect(await fundToken.balanceOf(user1.address)).to.equal(0);
    });

    it("Should emit TokensRecovered event", async function () {
      await expect(
        fundToken.recoveryTransfer(user1.address, user2.address, ethers.utils.parseEther("100"))
      )
        .to.emit(fundToken, "TokensRecovered")
        .withArgs(user1.address, user2.address, ethers.utils.parseEther("100"));
    });

    it("Should require new wallet to be verified", async function () {
      await expect(
        fundToken.recoveryTransfer(user1.address, user3.address, ethers.utils.parseEther("100"))
      ).to.be.revertedWith("New wallet not verified");
    });
  });

  describe("Compliance Checks", function () {
    beforeEach(async function () {
      await identityRegistry.registerIdentity(user1.address, COUNTRY_USA);
      await identityRegistry.addClaim(user1.address, CLAIM_KYC_VERIFIED);
      await identityRegistry.registerIdentity(user2.address, COUNTRY_USA);
      await identityRegistry.addClaim(user2.address, CLAIM_KYC_VERIFIED);
      await fundToken.mint(user1.address, ethers.utils.parseEther("100"));
    });

    it("Should check if transfer is possible", async function () {
      const [canTransfer, reason] = await fundToken.canTransfer(
        user1.address,
        user2.address,
        ethers.utils.parseEther("50")
      );
      expect(canTransfer).to.equal(true);
    });

    it("Should return false for frozen account", async function () {
      await fundToken.freezeAccount(user1.address);
      const [canTransfer, reason] = await fundToken.canTransfer(
        user1.address,
        user2.address,
        ethers.utils.parseEther("50")
      );
      expect(canTransfer).to.equal(false);
      expect(reason).to.equal("Sender account frozen");
    });

    it("Should return false for insufficient unfrozen balance", async function () {
      await fundToken.freezePartialTokens(user1.address, ethers.utils.parseEther("60"));
      const [canTransfer, reason] = await fundToken.canTransfer(
        user1.address,
        user2.address,
        ethers.utils.parseEther("50")
      );
      expect(canTransfer).to.equal(false);
      expect(reason).to.equal("Insufficient unfrozen balance");
    });
  });

  describe("Batch Transfer", function () {
    beforeEach(async function () {
      await identityRegistry.registerIdentity(user1.address, COUNTRY_USA);
      await identityRegistry.addClaim(user1.address, CLAIM_KYC_VERIFIED);
      await identityRegistry.registerIdentity(user2.address, COUNTRY_USA);
      await identityRegistry.addClaim(user2.address, CLAIM_KYC_VERIFIED);
      await identityRegistry.registerIdentity(user3.address, COUNTRY_USA);
      await identityRegistry.addClaim(user3.address, CLAIM_KYC_VERIFIED);

      await fundToken.mint(owner.address, ethers.utils.parseEther("200"));
    });

    it("Should batch transfer to multiple recipients", async function () {
      const recipients = [user1.address, user2.address, user3.address];
      const amounts = [
        ethers.utils.parseEther("30"),
        ethers.utils.parseEther("40"),
        ethers.utils.parseEther("50"),
      ];

      await fundToken.batchTransfer(recipients, amounts);

      expect(await fundToken.balanceOf(user1.address)).to.equal(ethers.utils.parseEther("30"));
      expect(await fundToken.balanceOf(user2.address)).to.equal(ethers.utils.parseEther("40"));
      expect(await fundToken.balanceOf(user3.address)).to.equal(ethers.utils.parseEther("50"));
    });

    it("Should revert if arrays length mismatch", async function () {
      const recipients = [user1.address, user2.address];
      const amounts = [ethers.utils.parseEther("30")];

      await expect(fundToken.batchTransfer(recipients, amounts)).to.be.revertedWith(
        "Arrays length mismatch"
      );
    });
  });

  describe("Configuration", function () {
    it("Should update identity registry", async function () {
      const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
      const newRegistry = await IdentityRegistry.deploy();
      await newRegistry.deployed();

      await fundToken.setIdentityRegistry(newRegistry.address);
      expect(await fundToken.identityRegistry()).to.equal(newRegistry.address);
    });

    it("Should update compliance module", async function () {
      const ComplianceModule = await ethers.getContractFactory("ComplianceModule");
      const newModule = await ComplianceModule.deploy(identityRegistry.address);
      await newModule.deployed();

      await fundToken.setComplianceModule(newModule.address);
      expect(await fundToken.complianceModule()).to.equal(newModule.address);
    });

    it("Should toggle compliance", async function () {
      await fundToken.setComplianceEnabled(false);
      expect(await fundToken.complianceEnabled()).to.equal(false);

      await fundToken.setComplianceEnabled(true);
      expect(await fundToken.complianceEnabled()).to.equal(true);
    });

    it("Should emit events on configuration changes", async function () {
      const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
      const newRegistry = await IdentityRegistry.deploy();
      await newRegistry.deployed();

      await expect(fundToken.setIdentityRegistry(newRegistry.address))
        .to.emit(fundToken, "IdentityRegistrySet")
        .withArgs(newRegistry.address);

      await expect(fundToken.setComplianceEnabled(false))
        .to.emit(fundToken, "ComplianceEnabled")
        .withArgs(false);
    });
  });
});
