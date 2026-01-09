const { ethers } = require("ethers");
const path = require("path");
const fs = require("fs");

class ContractService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.kycRegistry = null;
    this.fundToken = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Load deployed contract info
      const deployedPath = path.join(__dirname, "../../../shared/contracts/deployed.json");
      
      if (!fs.existsSync(deployedPath)) {
        console.warn("Contract deployment file not found. Run 'npm run deploy:local' in contracts folder first.");
        return;
      }

      const deployed = JSON.parse(fs.readFileSync(deployedPath, "utf8"));
      
      // Connect to local Hardhat node
      const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
      this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);

      // Use deployer private key for signing (Hardhat default account #0)
      const privateKey = process.env.DEPLOYER_PRIVATE_KEY || 
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // Hardhat default
      this.signer = new ethers.Wallet(privateKey, this.provider);

      // Initialize contracts
      const { KYCRegistry, FundToken } = deployed.contracts;

      this.kycRegistry = new ethers.Contract(
        KYCRegistry.address,
        KYCRegistry.abi,
        this.signer
      );

      this.fundToken = new ethers.Contract(
        FundToken.address,
        FundToken.abi,
        this.signer
      );

      this.initialized = true;
      console.log("Contract service initialized");
      console.log("  KYCRegistry:", KYCRegistry.address);
      console.log("  FundToken:", FundToken.address);
    } catch (error) {
      console.error("Failed to initialize contract service:", error.message);
    }
  }

  isInitialized() {
    return this.initialized;
  }

  async isKycVerified(walletAddress) {
    if (!this.initialized) {
      throw new Error("Contract service not initialized");
    }
    return this.kycRegistry.isVerified(walletAddress);
  }

  async setKycVerified(walletAddress, verified) {
    if (!this.initialized) {
      throw new Error("Contract service not initialized");
    }
    const tx = await this.kycRegistry.setVerified(walletAddress, verified);
    await tx.wait();
    return tx.hash;
  }

  async mintFundTokens(toAddress, amount) {
    if (!this.initialized) {
      throw new Error("Contract service not initialized");
    }
    const tx = await this.fundToken.mint(toAddress, ethers.utils.parseEther(amount.toString()));
    await tx.wait();
    return tx.hash;
  }

  async getFundTokenBalance(address) {
    if (!this.initialized) {
      throw new Error("Contract service not initialized");
    }
    const balance = await this.fundToken.balanceOf(address);
    return ethers.utils.formatEther(balance);
  }

  async getContractAddresses() {
    const deployedPath = path.join(__dirname, "../../../shared/contracts/deployed.json");
    
    if (!fs.existsSync(deployedPath)) {
      return null;
    }

    const deployed = JSON.parse(fs.readFileSync(deployedPath, "utf8"));
    return {
      network: deployed.network,
      chainId: deployed.chainId,
      kycRegistry: deployed.contracts.KYCRegistry.address,
      fundToken: deployed.contracts.FundToken.address,
    };
  }
}

const contractService = new ContractService();

module.exports = contractService;
