// Re-export the modular contract service
// The service has been refactored into specialized modules:
// - contracts/identityService.js - Identity and KYC operations
// - contracts/fundFactoryService.js - Fund factory operations
// - contracts/investmentService.js - Investment tracking operations
// - contracts/index.js - Main service that coordinates all modules

module.exports = require("./contracts/index");

/* LEGACY CODE - KEPT FOR REFERENCE
const { ethers } = require("ethers");
const path = require("path");
const fs = require("fs");

class ContractService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.identityRegistry = null;
    this.complianceModule = null;
    this.trustedIssuersRegistry = null;
    this.fundFactory = null;
    this.investmentContract = null;
    this.fundToken = null;
    this.initialized = false;
    this.networkInfo = null;
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
      
      // Connect to blockchain
      const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
      this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);

      // Verify network connection
      try {
        const network = await this.provider.getNetwork();
        this.networkInfo = {
          chainId: network.chainId,
          name: network.name,
          rpcUrl,
        };
        console.log(`Connected to network: ${network.name} (chainId: ${network.chainId})`);
        
        // Validate chain ID if configured
        const expectedChainId = process.env.CHAIN_ID ? parseInt(process.env.CHAIN_ID) : null;
        if (expectedChainId && network.chainId !== expectedChainId) {
          console.warn(`Chain ID mismatch! Expected ${expectedChainId}, got ${network.chainId}`);
        }
      } catch (networkError) {
        console.error("Failed to connect to blockchain:", networkError.message);
        return;
      }

      // Use deployer private key for signing
      const privateKey = process.env.DEPLOYER_PRIVATE_KEY || 
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // Hardhat default
      this.signer = new ethers.Wallet(privateKey, this.provider);

      // Log signer address
      console.log("Signer address:", this.signer.address);

      // Initialize ERC-3643 contracts
      const { IdentityRegistry, ComplianceModule, TrustedIssuersRegistry, FundFactory, InvestmentContract, FundTokenERC3643 } = deployed.contracts;

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

      this.fundToken = new ethers.Contract(
        FundTokenERC3643.address,
        FundTokenERC3643.abi,
        this.signer
      );

      this.initialized = true;
      console.log("Contract service initialized (ERC-3643 + FundFactory + InvestmentContract)");
      console.log("  IdentityRegistry:", IdentityRegistry.address);
      console.log("  ComplianceModule:", ComplianceModule.address);
      console.log("  TrustedIssuersRegistry:", TrustedIssuersRegistry.address);
      console.log("  FundFactory:", FundFactory.address);
      console.log("  InvestmentContract:", InvestmentContract.address);
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

  // Get current gas price with optional multiplier
  async getGasPrice() {
    if (!this.provider) return null;
    
    try {
      const gasPrice = await this.provider.getGasPrice();
      const multiplier = parseFloat(process.env.GAS_LIMIT_MULTIPLIER || "1.2");
      const adjustedGasPrice = gasPrice.mul(Math.floor(multiplier * 100)).div(100);
      
      // Check against max gas price if configured
      const maxGasPriceGwei = process.env.MAX_GAS_PRICE_GWEI;
      if (maxGasPriceGwei) {
        const maxGasPrice = ethers.utils.parseUnits(maxGasPriceGwei, "gwei");
        if (adjustedGasPrice.gt(maxGasPrice)) {
          console.warn(`Gas price ${ethers.utils.formatUnits(adjustedGasPrice, "gwei")} gwei exceeds max ${maxGasPriceGwei} gwei`);
          return maxGasPrice;
        }
      }
      
      return adjustedGasPrice;
    } catch (error) {
      console.error("Failed to get gas price:", error.message);
      return null;
    }
  }

  // Estimate gas for a transaction
  async estimateGas(contract, method, args) {
    try {
      const gasEstimate = await contract.estimateGas[method](...args);
      const multiplier = parseFloat(process.env.GAS_LIMIT_MULTIPLIER || "1.2");
      return gasEstimate.mul(Math.floor(multiplier * 100)).div(100);
    } catch (error) {
      console.error(`Failed to estimate gas for ${method}:`, error.message);
      throw error;
    }
  }

  // Get transaction cost estimate in native currency
  async estimateTransactionCost(contract, method, args) {
    try {
      const gasEstimate = await this.estimateGas(contract, method, args);
      const gasPrice = await this.getGasPrice();
      
      if (!gasEstimate || !gasPrice) return null;
      
      const cost = gasEstimate.mul(gasPrice);
      return {
        gasLimit: gasEstimate.toString(),
        gasPrice: ethers.utils.formatUnits(gasPrice, "gwei") + " gwei",
        estimatedCost: ethers.utils.formatEther(cost) + " ETH/MATIC",
      };
    } catch (error) {
      console.error("Failed to estimate transaction cost:", error.message);
      return null;
    }
  }

  // Execute transaction with retry logic
  async executeWithRetry(txPromise, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const tx = await txPromise();
        const receipt = await tx.wait();
        return {
          success: true,
          txHash: receipt.transactionHash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
        };
      } catch (error) {
        lastError = error;
        console.error(`Transaction attempt ${attempt}/${maxRetries} failed:`, error.message);
        
        // Don't retry on certain errors
        if (error.code === "INSUFFICIENT_FUNDS" || 
            error.code === "UNPREDICTABLE_GAS_LIMIT" ||
            error.message.includes("revert")) {
          break;
        }
        
        // Wait before retry
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        }
      }
    }
    
    return {
      success: false,
      error: lastError?.message || "Transaction failed",
      code: lastError?.code,
    };
  }

  async isKycVerified(walletAddress) {
    if (!this.initialized) {
      throw new Error("Contract service not initialized");
    }
    return this.identityRegistry.isVerified(walletAddress);
  }

  async registerIdentity(walletAddress, countryCode = 840) {
    if (!this.initialized) {
      throw new Error("Contract service not initialized");
    }
    const tx = await this.identityRegistry.registerIdentity(walletAddress, countryCode);
    await tx.wait();
    return tx.hash;
  }

  async addIdentityClaim(walletAddress, claimTopic) {
    if (!this.initialized) {
      throw new Error("Contract service not initialized");
    }
    const tx = await this.identityRegistry.addClaim(walletAddress, claimTopic);
    await tx.wait();
    return tx.hash;
  }

  async setKycVerified(walletAddress, verified) {
    if (!this.initialized) {
      throw new Error("Contract service not initialized");
    }
    
    const CLAIM_KYC_VERIFIED = 2;
    
    if (verified) {
      const isRegistered = await this.identityRegistry.isVerified(walletAddress);
      if (!isRegistered) {
        await this.registerIdentity(walletAddress, 840);
      }
      const tx = await this.identityRegistry.addClaim(walletAddress, CLAIM_KYC_VERIFIED);
      await tx.wait();
      return tx.hash;
    } else {
      const tx = await this.identityRegistry.removeClaim(walletAddress, CLAIM_KYC_VERIFIED);
      await tx.wait();
      return tx.hash;
    }
  }

  async mintFundTokens(toAddress, amount) {
    if (!this.initialized) {
      throw new Error("Contract service not initialized");
    }
    const tx = await this.fundToken.mint(toAddress, ethers.utils.parseEther(amount.toString()));
    await tx.wait();
    return tx.hash;
  }

  async getFundTokenBalance(address, tokenAddress = null) {
    if (!this.initialized) {
      throw new Error("Contract service not initialized");
    }
    
    // Use specific token contract if provided, otherwise use default
    const tokenContract = tokenAddress 
      ? new ethers.Contract(tokenAddress, this.fundToken.interface, this.provider)
      : this.fundToken;
    
    const balance = await tokenContract.balanceOf(address);
    return ethers.utils.formatEther(balance);
  }

  // Deploy a new FundToken contract for a specific fund
  async deployFundToken(name, symbol) {
    if (!this.initialized) {
      throw new Error("Contract service not initialized");
    }

    try {
      // Load deployed contract addresses
      const deployedPath = path.join(__dirname, "../../../shared/contracts/deployed.json");
      const deployed = JSON.parse(fs.readFileSync(deployedPath, "utf8"));
      
      // Get the IdentityRegistry and ComplianceModule addresses
      const identityRegistryAddress = deployed.contracts.IdentityRegistry.address;
      const complianceModuleAddress = deployed.contracts.ComplianceModule.address;
      
      // Load the FundTokenERC3643 artifact for bytecode
      const artifactPath = path.join(__dirname, "../../../contracts/artifacts/contracts/FundTokenERC3643.sol/FundTokenERC3643.json");
      const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
      
      // Create contract factory
      const factory = new ethers.ContractFactory(
        artifact.abi,
        artifact.bytecode,
        this.signer
      );

      // Deploy the ERC-3643 token
      console.log(`Deploying FundTokenERC3643: ${name} (${symbol})...`);
      const contract = await factory.deploy(
        name,
        symbol,
        identityRegistryAddress,
        complianceModuleAddress
      );
      await contract.deployed();
      
      console.log(`FundTokenERC3643 deployed to: ${contract.address}`);
      
      // Enable compliance restrictions for this token
      console.log(`Enabling compliance for ${contract.address}...`);
      const tx1 = await this.complianceModule.enableRestrictions(contract.address);
      await tx1.wait();
      
      // Set default max holders
      const tx2 = await this.complianceModule.setMaxHolders(contract.address, 100);
      await tx2.wait();
      
      // Allow USA by default
      const tx3 = await this.complianceModule.allowCountry(contract.address, 840);
      await tx3.wait();
      
      console.log(`Compliance configured for ${contract.address}`);
      
      return {
        address: contract.address,
        name,
        symbol,
        txHash: contract.deployTransaction.hash,
      };
    } catch (error) {
      console.error("Failed to deploy FundTokenERC3643:", error.message);
      throw error;
    }
  }

  // Mint tokens using a specific fund's token contract
  async mintFundTokensForFund(tokenAddress, toAddress, amount) {
    if (!this.initialized) {
      throw new Error("Contract service not initialized");
    }

    const tokenContract = new ethers.Contract(
      tokenAddress,
      this.fundToken.interface,
      this.signer
    );

    const tx = await tokenContract.mint(toAddress, ethers.utils.parseEther(amount.toString()));
    await tx.wait();
    return tx.hash;
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
      standard: deployed.standard || "ERC-3643",
      identityRegistry: deployed.contracts.IdentityRegistry.address,
      complianceModule: deployed.contracts.ComplianceModule.address,
      trustedIssuersRegistry: deployed.contracts.TrustedIssuersRegistry.address,
      fundToken: deployed.contracts.FundTokenERC3643.address,
    };
  }

  async configureCompliance(tokenAddress, config) {
    if (!this.initialized) {
      throw new Error("Contract service not initialized");
    }

    const txHashes = [];

    if (config.maxHolders) {
      const tx = await this.complianceModule.setMaxHolders(tokenAddress, config.maxHolders);
      await tx.wait();
      txHashes.push(tx.hash);
    }

    if (config.minHoldingPeriod) {
      const tx = await this.complianceModule.setMinHoldingPeriod(tokenAddress, config.minHoldingPeriod);
      await tx.wait();
      txHashes.push(tx.hash);
    }

    if (config.requireAccredited !== undefined) {
      const tx = await this.complianceModule.setRequireAccredited(tokenAddress, config.requireAccredited);
      await tx.wait();
      txHashes.push(tx.hash);
    }

    if (config.allowedCountries && config.allowedCountries.length > 0) {
      for (const country of config.allowedCountries) {
        const tx = await this.complianceModule.allowCountry(tokenAddress, country);
        await tx.wait();
        txHashes.push(tx.hash);
      }
    }

    if (config.blockedCountries && config.blockedCountries.length > 0) {
      for (const country of config.blockedCountries) {
        const tx = await this.complianceModule.blockCountry(tokenAddress, country);
        await tx.wait();
        txHashes.push(tx.hash);
      }
    }

    return txHashes;
  }

  async checkTransferCompliance(tokenAddress, from, to, amount) {
    if (!this.initialized) {
      throw new Error("Contract service not initialized");
    }

    const tokenContract = new ethers.Contract(
      tokenAddress,
      this.fundToken.interface,
      this.provider
    );

    const [canTransfer, reason] = await tokenContract.canTransfer(from, to, ethers.utils.parseEther(amount.toString()));
    
    return {
      canTransfer,
      reason: reason || "Transfer allowed",
    };
  }

  // FundFactory methods
  async deployFundViaFactory(name, symbol, targetAmount, minimumInvestment) {
    if (!this.initialized) {
      throw new Error("Contract service not initialized");
    }

    try {
      const tx = await this.fundFactory.createFund(
        name,
        symbol,
        ethers.utils.parseEther(targetAmount.toString()),
        ethers.utils.parseEther(minimumInvestment.toString())
      );

      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "FundCreated");

      if (!event) {
        throw new Error("FundCreated event not found in transaction receipt");
      }

      return {
        fundId: event.args.fundId.toNumber(),
        tokenAddress: event.args.tokenAddress,
        gp: event.args.gp,
        txHash: receipt.transactionHash,
      };
    } catch (error) {
      console.error("Failed to deploy fund via factory:", error);
      throw error;
    }
  }

  async approveGP(gpAddress) {
    if (!this.initialized) {
      throw new Error("Contract service not initialized");
    }

    const tx = await this.fundFactory.approveGP(gpAddress);
    await tx.wait();
    return tx.hash;
  }

  async isApprovedGP(gpAddress) {
    if (!this.initialized) {
      throw new Error("Contract service not initialized");
    }

    return await this.fundFactory.isApprovedGP(gpAddress);
  }

  async getOnChainFund(fundId) {
    if (!this.initialized) {
      throw new Error("Contract service not initialized");
    }

    const fund = await this.fundFactory.getFund(fundId);
    return {
      id: fund.id.toNumber(),
      tokenAddress: fund.tokenAddress,
      gp: fund.gp,
      name: fund.name,
      symbol: fund.symbol,
      targetAmount: ethers.utils.formatEther(fund.targetAmount),
      minimumInvestment: ethers.utils.formatEther(fund.minimumInvestment),
      createdAt: fund.createdAt.toNumber(),
      active: fund.active,
    };
  }

  async getActiveFunds(offset = 0, limit = 10) {
    if (!this.initialized) {
      throw new Error("Contract service not initialized");
    }

    const funds = await this.fundFactory.getActiveFunds(offset, limit);
    return funds.map(fund => ({
      id: fund.id.toNumber(),
      tokenAddress: fund.tokenAddress,
      gp: fund.gp,
      name: fund.name,
      symbol: fund.symbol,
      targetAmount: ethers.utils.formatEther(fund.targetAmount),
      minimumInvestment: ethers.utils.formatEther(fund.minimumInvestment),
      createdAt: fund.createdAt.toNumber(),
      active: fund.active,
    }));
  }

  async getFundsByGP(gpAddress) {
    if (!this.initialized) {
      throw new Error("Contract service not initialized");
    }

    const fundIds = await this.fundFactory.getFundsByGP(gpAddress);
    return fundIds.map(id => id.toNumber());
  }

  async getFundCount() {
    if (!this.initialized) {
      throw new Error("Contract service not initialized");
    }

    const count = await this.fundFactory.getFundCount();
    return count.toNumber();
  }

  // ==================== InvestmentContract Methods ====================

  async registerFundInInvestmentContract(fundToken, gp, targetAmount, minimumInvestment) {
    if (!this.initialized) {
      throw new Error("Contract service not initialized");
    }

    const tx = await this.investmentContract.registerFund(
      fundToken,
      gp,
      ethers.utils.parseEther(targetAmount.toString()),
      ethers.utils.parseEther(minimumInvestment.toString())
    );
    const receipt = await tx.wait();
    
    const event = receipt.events.find(e => e.event === "FundRegistered");
    const fundId = event ? event.args.fundId.toNumber() : null;

    return {
      txHash: receipt.transactionHash,
      fundId,
    };
  }

  async recordInvestment(fundId, investor, amount, tokenAmount, txHash) {
    if (!this.initialized) {
      throw new Error("Contract service not initialized");
    }

    const tx = await this.investmentContract.recordInvestment(
      fundId,
      investor,
      ethers.utils.parseEther(amount.toString()),
      ethers.utils.parseEther(tokenAmount.toString()),
      txHash || ""
    );
    const receipt = await tx.wait();
    
    const event = receipt.events.find(e => e.event === "InvestmentRecorded");
    const investmentId = event ? event.args.investmentId.toNumber() : null;

    return {
      txHash: receipt.transactionHash,
      investmentId,
    };
  }

  async confirmInvestment(fundId, investmentId) {
    if (!this.initialized) {
      throw new Error("Contract service not initialized");
    }

    const tx = await this.investmentContract.confirmInvestment(fundId, investmentId);
    const receipt = await tx.wait();

    return {
      txHash: receipt.transactionHash,
    };
  }

  async cancelInvestment(fundId, investmentId) {
    if (!this.initialized) {
      throw new Error("Contract service not initialized");
    }

    const tx = await this.investmentContract.cancelInvestment(fundId, investmentId);
    const receipt = await tx.wait();

    return {
      txHash: receipt.transactionHash,
    };
  }

  async closeFund(fundId) {
    if (!this.initialized) {
      throw new Error("Contract service not initialized");
    }

    const tx = await this.investmentContract.closeFund(fundId);
    const receipt = await tx.wait();

    return {
      txHash: receipt.transactionHash,
    };
  }

  async getInvestmentContractFund(fundId) {
    if (!this.initialized) {
      throw new Error("Contract service not initialized");
    }

    const fund = await this.investmentContract.getFund(fundId);
    return {
      fundToken: fund.fundToken,
      gp: fund.gp,
      targetAmount: ethers.utils.formatEther(fund.targetAmount),
      raisedAmount: ethers.utils.formatEther(fund.raisedAmount),
      minimumInvestment: ethers.utils.formatEther(fund.minimumInvestment),
      active: fund.active,
      investorCount: fund.investorCount.toNumber(),
    };
  }

  async getInvestment(fundId, investmentId) {
    if (!this.initialized) {
      throw new Error("Contract service not initialized");
    }

    const investment = await this.investmentContract.getInvestment(fundId, investmentId);
    return {
      investor: investment.investor,
      fundToken: investment.fundToken,
      amount: ethers.utils.formatEther(investment.amount),
      tokenAmount: ethers.utils.formatEther(investment.tokenAmount),
      timestamp: investment.timestamp.toNumber(),
      status: investment.status,
      txHash: investment.txHash,
    };
  }

  async getFundInvestmentCount(fundId) {
    if (!this.initialized) {
      throw new Error("Contract service not initialized");
    }

    const count = await this.investmentContract.getFundInvestmentCount(fundId);
    return count.toNumber();
  }

  async getInvestorTotal(fundId, investor) {
    if (!this.initialized) {
      throw new Error("Contract service not initialized");
    }

    const total = await this.investmentContract.getInvestorTotal(fundId, investor);
    return ethers.utils.formatEther(total);
  }

  async getInvestorFunds(investor) {
    if (!this.initialized) {
      throw new Error("Contract service not initialized");
    }

    const fundIds = await this.investmentContract.getInvestorFunds(investor);
    return fundIds.map(id => id.toNumber());
  }

  async getTotalInvestmentVolume() {
    if (!this.initialized) {
      throw new Error("Contract service not initialized");
    }

    const volume = await this.investmentContract.totalInvestmentVolume();
    return ethers.utils.formatEther(volume);
  }

  async getInvestmentContractFundCount() {
    if (!this.initialized) {
      throw new Error("Contract service not initialized");
    }

    const count = await this.investmentContract.fundCount();
    return count.toNumber();
  }
}

const contractService = new ContractService();

module.exports = contractService;
*/
