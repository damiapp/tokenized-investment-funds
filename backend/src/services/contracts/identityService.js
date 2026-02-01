const { ethers } = require("ethers");

class IdentityService {
  constructor(identityRegistry, signer) {
    this.identityRegistry = identityRegistry;
    this.signer = signer;
  }

  async isKycVerified(walletAddress) {
    return this.identityRegistry.isVerified(walletAddress);
  }

  async registerIdentity(walletAddress, countryCode = 840) {
    const tx = await this.identityRegistry.registerIdentity(walletAddress, countryCode);
    const receipt = await tx.wait();
    return receipt.transactionHash;
  }

  async removeIdentity(walletAddress) {
    const tx = await this.identityRegistry.removeIdentity(walletAddress);
    const receipt = await tx.wait();
    return receipt.transactionHash;
  }

  async addIdentityClaim(walletAddress, claimTopic) {
    const tx = await this.identityRegistry.addClaim(walletAddress, claimTopic);
    const receipt = await tx.wait();
    return receipt.transactionHash;
  }

  async removeIdentityClaim(walletAddress, claimTopic) {
    const tx = await this.identityRegistry.removeClaim(walletAddress, claimTopic);
    const receipt = await tx.wait();
    return receipt.transactionHash;
  }

  async setKycVerified(walletAddress, verified) {
    const CLAIM_KYC_VERIFIED = 2;
    
    if (verified) {
      const isRegistered = await this.identityRegistry.isVerified(walletAddress);
      if (!isRegistered) {
        await this.registerIdentity(walletAddress, 840);
      }
      return this.addIdentityClaim(walletAddress, CLAIM_KYC_VERIFIED);
    } else {
      return this.removeIdentityClaim(walletAddress, CLAIM_KYC_VERIFIED);
    }
  }

  async hasClaim(walletAddress, claimTopic) {
    return this.identityRegistry.hasClaim(walletAddress, claimTopic);
  }

  async getCountry(walletAddress) {
    const country = await this.identityRegistry.getCountry(walletAddress);
    return country.toNumber();
  }

  async getIdentity(walletAddress) {
    return this.identityRegistry.getIdentity(walletAddress);
  }

  async getRegisteredIdentitiesCount() {
    const count = await this.identityRegistry.getRegisteredIdentitiesCount();
    return count.toNumber();
  }

  async getRegisteredIdentityAt(index) {
    return this.identityRegistry.getRegisteredIdentityAt(index);
  }
}

module.exports = IdentityService;
