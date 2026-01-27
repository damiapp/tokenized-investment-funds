const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("IdentityRegistry", function () {
  let identityRegistry;
  let owner;
  let user1;
  let user2;
  let user3;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
    identityRegistry = await IdentityRegistry.deploy();
    await identityRegistry.deployed();
  });

  describe("Identity Registration", function () {
    it("Should register a new identity", async function () {
      await identityRegistry.registerIdentity(user1.address, 840);
      expect(await identityRegistry.isVerified(user1.address)).to.equal(true);
    });

    it("Should not allow duplicate registration", async function () {
      await identityRegistry.registerIdentity(user1.address, 840);
      await expect(
        identityRegistry.registerIdentity(user1.address, 840)
      ).to.be.revertedWith("Identity already registered");
    });

    it("Should not allow zero address", async function () {
      await expect(
        identityRegistry.registerIdentity(ethers.constants.AddressZero, 840)
      ).to.be.revertedWith("Invalid identity address");
    });

    it("Should emit IdentityRegistered event", async function () {
      await expect(identityRegistry.registerIdentity(user1.address, 840))
        .to.emit(identityRegistry, "IdentityRegistered")
        .withArgs(user1.address, 840);
    });

    it("Should store correct country code", async function () {
      await identityRegistry.registerIdentity(user1.address, 840);
      expect(await identityRegistry.getCountry(user1.address)).to.equal(840);
    });
  });

  describe("Batch Registration", function () {
    it("Should register multiple identities", async function () {
      const addresses = [user1.address, user2.address, user3.address];
      const countries = [840, 826, 276];

      await identityRegistry.batchRegisterIdentities(addresses, countries);

      expect(await identityRegistry.isVerified(user1.address)).to.equal(true);
      expect(await identityRegistry.isVerified(user2.address)).to.equal(true);
      expect(await identityRegistry.isVerified(user3.address)).to.equal(true);
    });

    it("Should revert if arrays length mismatch", async function () {
      const addresses = [user1.address, user2.address];
      const countries = [840];

      await expect(
        identityRegistry.batchRegisterIdentities(addresses, countries)
      ).to.be.revertedWith("Arrays length mismatch");
    });
  });

  describe("Identity Removal", function () {
    beforeEach(async function () {
      await identityRegistry.registerIdentity(user1.address, 840);
    });

    it("Should remove an identity", async function () {
      await identityRegistry.removeIdentity(user1.address);
      expect(await identityRegistry.isVerified(user1.address)).to.equal(false);
    });

    it("Should emit IdentityRemoved event", async function () {
      await expect(identityRegistry.removeIdentity(user1.address))
        .to.emit(identityRegistry, "IdentityRemoved")
        .withArgs(user1.address);
    });

    it("Should not allow removing non-existent identity", async function () {
      await expect(
        identityRegistry.removeIdentity(user2.address)
      ).to.be.revertedWith("Identity not registered");
    });
  });

  describe("Country Management", function () {
    beforeEach(async function () {
      await identityRegistry.registerIdentity(user1.address, 840);
    });

    it("Should update country", async function () {
      await identityRegistry.updateCountry(user1.address, 826);
      expect(await identityRegistry.getCountry(user1.address)).to.equal(826);
    });

    it("Should emit CountryUpdated event", async function () {
      await expect(identityRegistry.updateCountry(user1.address, 826))
        .to.emit(identityRegistry, "CountryUpdated")
        .withArgs(user1.address, 826);
    });
  });

  describe("Claims Management", function () {
    beforeEach(async function () {
      await identityRegistry.registerIdentity(user1.address, 840);
    });

    it("Should add a claim", async function () {
      const CLAIM_KYC = 2;
      await identityRegistry.addClaim(user1.address, CLAIM_KYC);
      expect(await identityRegistry.hasClaim(user1.address, CLAIM_KYC)).to.equal(true);
    });

    it("Should not allow duplicate claims", async function () {
      const CLAIM_KYC = 2;
      await identityRegistry.addClaim(user1.address, CLAIM_KYC);
      await expect(
        identityRegistry.addClaim(user1.address, CLAIM_KYC)
      ).to.be.revertedWith("Claim already exists");
    });

    it("Should remove a claim", async function () {
      const CLAIM_KYC = 2;
      await identityRegistry.addClaim(user1.address, CLAIM_KYC);
      await identityRegistry.removeClaim(user1.address, CLAIM_KYC);
      expect(await identityRegistry.hasClaim(user1.address, CLAIM_KYC)).to.equal(false);
    });

    it("Should emit ClaimAdded event", async function () {
      const CLAIM_KYC = 2;
      await expect(identityRegistry.addClaim(user1.address, CLAIM_KYC))
        .to.emit(identityRegistry, "ClaimAdded")
        .withArgs(user1.address, CLAIM_KYC);
    });
  });

  describe("Wallet Linking", function () {
    beforeEach(async function () {
      await identityRegistry.registerIdentity(user1.address, 840);
    });

    it("Should link a wallet to identity", async function () {
      await identityRegistry.linkWallet(user1.address, user2.address);
      expect(await identityRegistry.getIdentity(user2.address)).to.equal(user1.address);
    });

    it("Should verify linked wallet", async function () {
      await identityRegistry.linkWallet(user1.address, user2.address);
      expect(await identityRegistry.isVerified(user2.address)).to.equal(true);
    });

    it("Should emit WalletLinked event", async function () {
      await expect(identityRegistry.linkWallet(user1.address, user2.address))
        .to.emit(identityRegistry, "WalletLinked")
        .withArgs(user1.address, user2.address);
    });

    it("Should not allow zero address wallet", async function () {
      await expect(
        identityRegistry.linkWallet(user1.address, ethers.constants.AddressZero)
      ).to.be.revertedWith("Invalid wallet address");
    });
  });

  describe("Registry Enumeration", function () {
    it("Should return correct count", async function () {
      await identityRegistry.registerIdentity(user1.address, 840);
      await identityRegistry.registerIdentity(user2.address, 826);
      expect(await identityRegistry.getRegisteredIdentitiesCount()).to.equal(2);
    });

    it("Should return identity at index", async function () {
      await identityRegistry.registerIdentity(user1.address, 840);
      await identityRegistry.registerIdentity(user2.address, 826);
      expect(await identityRegistry.getRegisteredIdentityAt(0)).to.equal(user1.address);
      expect(await identityRegistry.getRegisteredIdentityAt(1)).to.equal(user2.address);
    });

    it("Should revert on out of bounds index", async function () {
      await expect(
        identityRegistry.getRegisteredIdentityAt(0)
      ).to.be.revertedWith("Index out of bounds");
    });
  });

  describe("Access Control", function () {
    it("Should only allow owner to register", async function () {
      await expect(
        identityRegistry.connect(user1).registerIdentity(user2.address, 840)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should only allow owner to remove", async function () {
      await identityRegistry.registerIdentity(user1.address, 840);
      await expect(
        identityRegistry.connect(user1).removeIdentity(user1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should only allow owner to add claims", async function () {
      await identityRegistry.registerIdentity(user1.address, 840);
      await expect(
        identityRegistry.connect(user1).addClaim(user1.address, 2)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
