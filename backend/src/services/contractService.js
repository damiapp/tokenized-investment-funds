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
      // Load FundToken bytecode from artifacts
      const deployedPath = path.join(__dirname, "../../../shared/contracts/deployed.json");
      const deployed = JSON.parse(fs.readFileSync(deployedPath, "utf8"));
      
      // Get the KYCRegistry address
      const kycRegistryAddress = deployed.contracts.KYCRegistry.address;
      
      // Load the FundToken artifact for bytecode
      const artifactPath = path.join(__dirname, "../../../contracts/artifacts/contracts/FundToken.sol/FundToken.json");
      const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
      
      // Create contract factory
      const factory = new ethers.ContractFactory(
        artifact.abi,
        artifact.bytecode,
        this.signer
      );

      // Deploy the contract
      console.log(`Deploying FundToken: ${name} (${symbol})...`);
      const contract = await factory.deploy(name, symbol, kycRegistryAddress);
      await contract.deployed();
      
      console.log(`FundToken deployed to: ${contract.address}`);
      return {
        address: contract.address,
        name,
        symbol,
        txHash: contract.deployTransaction.hash,
      };
    } catch (error) {
      console.error("Failed to deploy FundToken:", error.message);
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
      kycRegistry: deployed.contracts.KYCRegistry.address,
      fundToken: deployed.contracts.FundToken.address,
    };
  }
}

const contractService = new ContractService();

module.exports = contractService;
