const { ethers } = require("ethers");
const { User, KycStatus } = require("../models");
const contractService = require("./contractService");

class EventListener {
  constructor() {
    this.provider = null;
    this.identityRegistry = null;
    this.fundFactory = null;
    this.investmentContract = null;
    this.listening = false;
  }

  async initialize() {
    if (this.listening) {
      console.log("Event listener already running");
      return;
    }

    try {
      // Ensure contract service is initialized
      if (!contractService.isInitialized()) {
        await contractService.initialize();
      }

      if (!contractService.isInitialized()) {
        console.error("Cannot start event listener: Contract service not initialized");
        return;
      }

      this.provider = contractService.provider;
      this.identityRegistry = contractService.identityRegistry;
      this.fundFactory = contractService.fundFactory;
      this.investmentContract = contractService.investmentContract;

      console.log("=== Starting Blockchain Event Listener ===");
      
      // Listen to IdentityRegistry events
      this.listenToIdentityEvents();
      
      // Listen to FundFactory events
      this.listenToFundFactoryEvents();
      
      // Listen to InvestmentContract events
      this.listenToInvestmentContractEvents();

      this.listening = true;
      console.log("✓ Event listener started successfully");
    } catch (error) {
      console.error("Failed to initialize event listener:", error);
    }
  }

  listenToIdentityEvents() {
    // Listen for IdentityRegistered events
    this.identityRegistry.on("IdentityRegistered", async (walletAddress, countryCode, event) => {
      console.log("\n[Blockchain Event] IdentityRegistered");
      console.log("  Address:", walletAddress);
      console.log("  Country Code:", countryCode.toString());
      console.log("  Block:", event.blockNumber);
      console.log("  Tx:", event.transactionHash);

      try {
        await this.handleIdentityRegistered(walletAddress, countryCode.toNumber(), event.transactionHash);
      } catch (error) {
        console.error("Error handling IdentityRegistered event:", error);
      }
    });

    // Listen for ClaimAdded events
    this.identityRegistry.on("ClaimAdded", async (walletAddress, claimTopic, event) => {
      console.log("\n[Blockchain Event] ClaimAdded");
      console.log("  Address:", walletAddress);
      console.log("  Claim Topic:", claimTopic.toString());
      console.log("  Block:", event.blockNumber);
      console.log("  Tx:", event.transactionHash);

      try {
        await this.handleClaimAdded(walletAddress, claimTopic.toNumber(), event.transactionHash);
      } catch (error) {
        console.error("Error handling ClaimAdded event:", error);
      }
    });

    // Listen for ClaimRemoved events
    this.identityRegistry.on("ClaimRemoved", async (walletAddress, claimTopic, event) => {
      console.log("\n[Blockchain Event] ClaimRemoved");
      console.log("  Address:", walletAddress);
      console.log("  Claim Topic:", claimTopic.toString());
      console.log("  Block:", event.blockNumber);

      try {
        await this.handleClaimRemoved(walletAddress, claimTopic.toNumber());
      } catch (error) {
        console.error("Error handling ClaimRemoved event:", error);
      }
    });

    console.log("  ✓ Listening to IdentityRegistry events");
  }

  listenToFundFactoryEvents() {
    // Listen for FundCreated events
    this.fundFactory.on("FundCreated", async (fundId, tokenAddress, gp, name, symbol, targetAmount, event) => {
      console.log("\n[Blockchain Event] FundCreated");
      console.log("  Fund ID:", fundId.toString());
      console.log("  Token Address:", tokenAddress);
      console.log("  GP:", gp);
      console.log("  Name:", name);
      console.log("  Symbol:", symbol);
      console.log("  Block:", event.blockNumber);
      console.log("  Tx:", event.transactionHash);

      // This is already handled by the backend when creating the fund
      // But we log it for monitoring purposes
    });

    console.log("  ✓ Listening to FundFactory events");
  }

  listenToInvestmentContractEvents() {
    // Listen for InvestmentRecorded events
    this.investmentContract.on("InvestmentRecorded", async (fundId, investmentId, investor, amount, tokenAmount, event) => {
      console.log("\n[Blockchain Event] InvestmentRecorded");
      console.log("  Fund ID:", fundId.toString());
      console.log("  Investment ID:", investmentId.toString());
      console.log("  Investor:", investor);
      console.log("  Amount:", amount.toString());
      console.log("  Token Amount:", tokenAmount.toString());
      console.log("  Block:", event.blockNumber);
      console.log("  Tx:", event.transactionHash);
    });

    // Listen for InvestmentConfirmed events
    this.investmentContract.on("InvestmentConfirmed", async (fundId, investmentId, investor, event) => {
      console.log("\n[Blockchain Event] InvestmentConfirmed");
      console.log("  Fund ID:", fundId.toString());
      console.log("  Investment ID:", investmentId.toString());
      console.log("  Investor:", investor);
      console.log("  Block:", event.blockNumber);
      console.log("  Tx:", event.transactionHash);
    });

    // Listen for InvestmentCancelled events
    this.investmentContract.on("InvestmentCancelled", async (fundId, investmentId, investor, event) => {
      console.log("\n[Blockchain Event] InvestmentCancelled");
      console.log("  Fund ID:", fundId.toString());
      console.log("  Investment ID:", investmentId.toString());
      console.log("  Investor:", investor);
      console.log("  Block:", event.blockNumber);
    });

    // Listen for CapitalContributed events
    this.investmentContract.on("CapitalContributed", async (fundId, investor, amount, event) => {
      console.log("\n[Blockchain Event] CapitalContributed");
      console.log("  Fund ID:", fundId.toString());
      console.log("  Investor:", investor);
      console.log("  Amount:", amount.toString());
      console.log("  Block:", event.blockNumber);
    });

    console.log("  ✓ Listening to InvestmentContract events");
  }

  async handleIdentityRegistered(walletAddress, countryCode, txHash) {
    // Find user by wallet address
    const user = await User.findOne({
      where: { walletAddress: walletAddress.toLowerCase() }
    });

    if (!user) {
      console.log("  ⚠️  No user found with wallet:", walletAddress);
      return;
    }

    console.log("  → Found user:", user.email);

    // Update or create KYC status
    let kycStatus = await KycStatus.findOne({ where: { userId: user.id } });

    if (!kycStatus) {
      console.log("  → Creating new KYC status record");
      kycStatus = await KycStatus.create({
        userId: user.id,
        status: "pending",
        onChainTxHash: txHash,
        onChainSyncedAt: new Date(),
      });
    } else {
      console.log("  → Updating existing KYC status");
      await kycStatus.update({
        onChainTxHash: txHash,
        onChainSyncedAt: new Date(),
      });
    }

    console.log("  ✓ Database updated for user:", user.email);
  }

  async handleClaimAdded(walletAddress, claimTopic, txHash) {
    const CLAIM_KYC_VERIFIED = 2;

    // Find user by wallet address
    const user = await User.findOne({
      where: { walletAddress: walletAddress.toLowerCase() }
    });

    if (!user) {
      console.log("  ⚠️  No user found with wallet:", walletAddress);
      return;
    }

    console.log("  → Found user:", user.email);

    // If KYC claim was added, update status to approved
    if (claimTopic === CLAIM_KYC_VERIFIED) {
      let kycStatus = await KycStatus.findOne({ where: { userId: user.id } });

      if (kycStatus && kycStatus.status !== "approved") {
        console.log("  → Auto-approving KYC based on blockchain claim");
        await kycStatus.update({
          status: "approved",
          approvedAt: new Date(),
          onChainTxHash: txHash,
          onChainSyncedAt: new Date(),
        });
        console.log("  ✓ KYC status updated to approved");
      }
    }
  }

  async handleClaimRemoved(walletAddress, claimTopic) {
    const CLAIM_KYC_VERIFIED = 2;

    // Find user by wallet address
    const user = await User.findOne({
      where: { walletAddress: walletAddress.toLowerCase() }
    });

    if (!user) {
      console.log("  ⚠️  No user found with wallet:", walletAddress);
      return;
    }

    console.log("  → Found user:", user.email);

    // If KYC claim was removed, update status
    if (claimTopic === CLAIM_KYC_VERIFIED) {
      let kycStatus = await KycStatus.findOne({ where: { userId: user.id } });

      if (kycStatus && kycStatus.status === "approved") {
        console.log("  → Revoking KYC approval based on blockchain claim removal");
        await kycStatus.update({
          status: "rejected",
          onChainSyncedAt: new Date(),
        });
        console.log("  ✓ KYC status updated to rejected");
      }
    }
  }

  stop() {
    if (!this.listening) {
      console.log("Event listener not running");
      return;
    }

    console.log("Stopping event listener...");
    
    if (this.identityRegistry) {
      this.identityRegistry.removeAllListeners();
    }
    
    if (this.fundFactory) {
      this.fundFactory.removeAllListeners();
    }
    
    if (this.investmentContract) {
      this.investmentContract.removeAllListeners();
    }

    this.listening = false;
    console.log("✓ Event listener stopped");
  }

  isListening() {
    return this.listening;
  }
}

const eventListener = new EventListener();

module.exports = eventListener;
