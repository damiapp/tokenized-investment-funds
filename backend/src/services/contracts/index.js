const { ethers } = require("ethers");
const path = require("path");
const fs = require("fs");
const IdentityService = require("./identityService");
const FundFactoryService = require("./fundFactoryService");
const InvestmentService = require("./investmentService");
const PortfolioService = require("./portfolioService");

class ContractService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.identityRegistry = null;
    this.complianceModule = null;
    this.trustedIssuersRegistry = null;
    this.fundFactory = null;
    this.investmentContract = null;
    this.portfolioRegistry = null;
    this.fundToken = null;
    this.initialized = false;
    this.networkInfo = null;
    
    this.identity = null;
    this.fundFactoryService = null;
    this.investment = null;
    this.portfolio = null;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      const deployedPath = path.join(__dirname, "../../../../shared/contracts/deployed.json");
      
      if (!fs.existsSync(deployedPath)) {
        console.warn("Contract deployment file not found. Run 'npm run deploy:local' in contracts folder first.");
        return;
      }

      const deployed = JSON.parse(fs.readFileSync(deployedPath, "utf8"));
      
      const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
      this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);

      try {
        const network = await this.provider.getNetwork();
        this.networkInfo = {
          chainId: network.chainId,
          name: network.name,
          rpcUrl,
        };
        console.log(`Connected to network: ${network.name} (chainId: ${network.chainId})`);
        
        const expectedChainId = process.env.CHAIN_ID ? parseInt(process.env.CHAIN_ID) : null;
        if (expectedChainId && network.chainId !== expectedChainId) {
          console.warn(`Chain ID mismatch! Expected ${expectedChainId}, got ${network.chainId}`);
        }
      } catch (networkError) {
        console.error("Failed to connect to blockchain:", networkError.message);
        return;
      }

      const privateKey = process.env.DEPLOYER_PRIVATE_KEY || 
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
      this.signer = new ethers.Wallet(privateKey, this.provider);

      console.log("Signer address:", this.signer.address);

      const { IdentityRegistry, ComplianceModule, TrustedIssuersRegistry, FundFactory, InvestmentContract, PortfolioCompanyRegistry, FundTokenERC3643 } = deployed.contracts;

      this.identityRegistry = new ethers.Contract(
        IdentityRegistry.address,
        IdentityRegistry.abi,
        this.signer
      );

      this.complianceModule = new ethers.Contract(
        ComplianceModule.address,
        ComplianceModule.abi,
        this.signer
      );

      this.trustedIssuersRegistry = new ethers.Contract(
        TrustedIssuersRegistry.address,
        TrustedIssuersRegistry.abi,
        this.signer
      );

      this.fundFactory = new ethers.Contract(
        FundFactory.address,
        FundFactory.abi,
        this.signer
      );

      this.investmentContract = new ethers.Contract(
        InvestmentContract.address,
        InvestmentContract.abi,
        this.signer
      );

      this.portfolioRegistry = new ethers.Contract(
        PortfolioCompanyRegistry.address,
        PortfolioCompanyRegistry.abi,
        this.signer
      );

      this.fundToken = new ethers.Contract(
        FundTokenERC3643.address,
        FundTokenERC3643.abi,
        this.signer
      );

      this.identity = new IdentityService(this.identityRegistry, this.signer);
      this.fundFactoryService = new FundFactoryService(this.fundFactory, this.signer);
      this.investment = new InvestmentService(this.investmentContract, this.signer);
      this.portfolio = new PortfolioService(this.portfolioRegistry, this.signer);

      this.initialized = true;
      console.log("Contract service initialized (ERC-3643 + FundFactory + InvestmentContract + Portfolio)");
      console.log("  IdentityRegistry:", IdentityRegistry.address);
      console.log("  ComplianceModule:", ComplianceModule.address);
      console.log("  TrustedIssuersRegistry:", TrustedIssuersRegistry.address);
      console.log("  FundFactory:", FundFactory.address);
      console.log("  InvestmentContract:", InvestmentContract.address);
      console.log("  PortfolioCompanyRegistry:", PortfolioCompanyRegistry.address);
      console.log("  FundTokenERC3643:", FundTokenERC3643.address);
    } catch (error) {
      console.error("Failed to initialize contract service:", error.message);
    }
  }

  getNetworkInfo() {
    return this.networkInfo;
  }

  isInitialized() {
    return this.initialized;
  }

  async isKycVerified(walletAddress) {
    return this.identity.isKycVerified(walletAddress);
  }

  async registerIdentity(walletAddress, countryCode) {
    return this.identity.registerIdentity(walletAddress, countryCode);
  }

  async setKycVerified(walletAddress, verified) {
    return this.identity.setKycVerified(walletAddress, verified);
  }

  async deployFundViaFactory(name, symbol, targetAmount, minimumInvestment) {
    return this.fundFactoryService.deployFundViaFactory(name, symbol, targetAmount, minimumInvestment);
  }

  async approveGP(gpAddress) {
    return this.fundFactoryService.approveGP(gpAddress);
  }

  async isApprovedGP(gpAddress) {
    return this.fundFactoryService.isApprovedGP(gpAddress);
  }

  async getOnChainFund(fundId) {
    return this.fundFactoryService.getOnChainFund(fundId);
  }

  async getActiveFunds(offset, limit) {
    return this.fundFactoryService.getActiveFunds(offset, limit);
  }

  async getFundsByGP(gpAddress) {
    return this.fundFactoryService.getFundsByGP(gpAddress);
  }

  async getFundCount() {
    return this.fundFactoryService.getFundCount();
  }

  async registerFundInInvestmentContract(fundToken, gp, targetAmount, minimumInvestment) {
    return this.investment.registerFund(fundToken, gp, targetAmount, minimumInvestment);
  }

  async recordInvestment(fundId, investor, amount, tokenAmount, txHash) {
    return this.investment.recordInvestment(fundId, investor, amount, tokenAmount, txHash);
  }

  async confirmInvestment(fundId, investmentId) {
    return this.investment.confirmInvestment(fundId, investmentId);
  }

  async cancelInvestment(fundId, investmentId) {
    return this.investment.cancelInvestment(fundId, investmentId);
  }

  async getInvestmentContractFund(fundId) {
    return this.investment.getFund(fundId);
  }

  async getInvestment(fundId, investmentId) {
    return this.investment.getInvestment(fundId, investmentId);
  }

  async getTotalInvestmentVolume() {
    return this.investment.getTotalInvestmentVolume();
  }

  async mintFundTokens(to, amount) {
    if (!this.initialized) {
      throw new Error("Contract service not initialized");
    }

    const tx = await this.fundToken.mint(to, ethers.utils.parseEther(amount.toString()));
    const receipt = await tx.wait();
    return receipt.transactionHash;
  }

  async getFundTokenBalance(walletAddress, tokenAddress = null) {
    if (!this.initialized) {
      throw new Error("Contract service not initialized");
    }

    const token = tokenAddress
      ? new ethers.Contract(tokenAddress, this.fundToken.interface, this.signer)
      : this.fundToken;

    const balance = await token.balanceOf(walletAddress);
    return ethers.utils.formatEther(balance);
  }

  async mintFundTokensForFund(tokenAddress, to, amount) {
    if (!this.initialized) {
      throw new Error("Contract service not initialized");
    }

    const token = new ethers.Contract(tokenAddress, this.fundToken.interface, this.signer);
    const tx = await token.mint(to, ethers.utils.parseEther(amount.toString()));
    const receipt = await tx.wait();
    return receipt.transactionHash;
  }

  async checkTransferCompliance(tokenAddress, from, to, amount) {
    if (!this.initialized) {
      throw new Error("Contract service not initialized");
    }

    const token = new ethers.Contract(tokenAddress, this.fundToken.interface, this.signer);
    const result = await token.canTransfer(from, to, ethers.utils.parseEther(amount.toString()));
    return { canTransfer: result[0], reason: result[1] };
  }
}

const contractService = new ContractService();

module.exports = contractService;
