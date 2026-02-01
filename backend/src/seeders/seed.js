const { User, KycStatus, Fund, Investment } = require("../models");
const { hashPassword } = require("../services/password");
const contractService = require("../services/contractService");
const axios = require("axios");

const API_BASE_URL = "http://localhost:3001";

/**
 * Comprehensive seed file for Tokenized Investment Funds
 * 
 * This seed creates:
 * - GP and LP users with proper KYC status
 * - Funds deployed to blockchain via FundFactory
 * - Investments with confirmed/pending status
 * - Portfolio companies registered on blockchain
 */

async function seed() {
  console.log("🌱 Starting comprehensive seed...\n");

  try {
    // ============================================
    // 1. INITIALIZE CONTRACT SERVICE
    // ============================================
    console.log("📋 Step 1: Initializing contract service...");
    if (!contractService.isInitialized()) {
      await contractService.initialize();
      console.log("  ✅ Contract service initialized\n");
    } else {
      console.log("  ✓ Contract service already initialized\n");
    }

    // ============================================
    // 2. CREATE USERS
    // ============================================
    console.log("📋 Step 2: Creating users...");
    
    // GP User
    const gpPassword = await hashPassword("password123");
    const [gp, gpCreated] = await User.findOrCreate({
      where: { email: "gp@demo.com" },
      defaults: {
        passwordHash: gpPassword,
        role: "GP",
        walletAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Hardhat account #0
      },
    });
    
    if (gpCreated) {
      await KycStatus.create({ userId: gp.id, status: "approved" });
      console.log("  ✅ GP created: gp@demo.com");
    } else {
      console.log("  ⏭️  GP exists: gp@demo.com");
    }

    // Approve GP in FundFactory
    if (gp.walletAddress) {
      try {
        const isApproved = await contractService.isApprovedGP(gp.walletAddress);
        if (!isApproved) {
          await contractService.approveGP(gp.walletAddress);
          console.log("  ✅ GP approved in FundFactory");
        } else {
          console.log("  ✓ GP already approved in FundFactory");
        }
      } catch (error) {
        console.warn("  ⚠️  Could not approve GP:", error.message);
      }
    }

    // LP Users
    const lpUsers = [
      {
        email: "lp1@demo.com",
        wallet: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Hardhat account #1
        kycStatus: "approved",
      },
      {
        email: "lp2@demo.com",
        wallet: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Hardhat account #2
        kycStatus: "approved",
      },
      {
        email: "lp3@demo.com",
        wallet: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", // Hardhat account #3
        kycStatus: "pending",
      },
    ];

    const createdLPs = [];
    for (const lpData of lpUsers) {
      const lpPassword = await hashPassword("password123");
      const [lp, lpCreated] = await User.findOrCreate({
        where: { email: lpData.email },
        defaults: {
          passwordHash: lpPassword,
          role: "LP",
          walletAddress: lpData.wallet,
        },
      });

      if (lpCreated) {
        await KycStatus.create({ userId: lp.id, status: lpData.kycStatus });
        console.log(`  ✅ LP created: ${lpData.email} (KYC: ${lpData.kycStatus})`);
      } else {
        console.log(`  ⏭️  LP exists: ${lpData.email}`);
      }

      createdLPs.push(lp);
    }

    // Register LP identities on-chain
    console.log("\nRegistering LP identities on-chain...");
    for (const lp of createdLPs) {
      if (lp.walletAddress) {
        try {
          // Check if already registered
          const isVerified = await contractService.isKycVerified(lp.walletAddress);
          if (!isVerified) {
            await contractService.registerIdentity(lp.walletAddress, 840); // USA country code
            await contractService.addKYCClaim(lp.walletAddress);
            console.log(`  ✅ Identity registered: ${lp.email}`);
          } else {
            console.log(`  ✓ Identity already registered: ${lp.email}`);
          }
        } catch (error) {
          console.warn(`  ⚠️  Identity registration failed for ${lp.email}: ${error.message}`);
        }
      }
    }

    console.log();

    // ============================================
    // 3. CREATE AND DEPLOY FUNDS
    // ============================================
    console.log("📋 Step 3: Creating and deploying funds...");

    const fundsData = [
      {
        name: "Tech Ventures Fund",
        description: "Early-stage technology investments focusing on AI, blockchain, and SaaS companies with high growth potential.",
        targetAmount: 1000000,
        minimumInvestment: 10000,
        managementFee: 2.0,
        performanceFee: 20.0,
        investmentStrategy: "Diversified portfolio of 15-20 early-stage tech companies with proven product-market fit and strong founding teams.",
        riskLevel: "high",
        tokenSymbol: "TVF",
        deploy: true,
      },
      {
        name: "Sustainable Energy Fund",
        description: "Investments in renewable energy and clean technology companies driving the green transition.",
        targetAmount: 750000,
        minimumInvestment: 15000,
        managementFee: 1.75,
        performanceFee: 15.0,
        investmentStrategy: "Focus on solar, wind, and battery storage companies with established revenue and government support.",
        riskLevel: "medium",
        tokenSymbol: "SEF",
        deploy: true,
      },
      {
        name: "Healthcare Innovation Fund",
        description: "Strategic investments in biotech, medtech, and digital health companies revolutionizing patient care.",
        targetAmount: 500000,
        minimumInvestment: 5000,
        managementFee: 1.5,
        performanceFee: 12.0,
        investmentStrategy: "Balanced approach targeting FDA-approved products and late-stage clinical trials with clear commercialization paths.",
        riskLevel: "medium",
        tokenSymbol: "HIF",
        deploy: false, // Database only - for testing undeployed funds
      },
    ];

    const createdFunds = [];
    for (const fundData of fundsData) {
      const [fund, fundCreated] = await Fund.findOrCreate({
        where: { name: fundData.name },
        defaults: {
          gpId: gp.id,
          description: fundData.description,
          targetAmount: fundData.targetAmount,
          raisedAmount: 0,
          minimumInvestment: fundData.minimumInvestment,
          managementFee: fundData.managementFee,
          performanceFee: fundData.performanceFee,
          investmentStrategy: fundData.investmentStrategy,
          riskLevel: fundData.riskLevel,
          status: "active",
          tokenSymbol: fundData.tokenSymbol,
        },
      });

      if (fundCreated) {
        console.log(`  ✅ Fund created: ${fundData.name}`);
      } else {
        console.log(`  ⏭️  Fund exists: ${fundData.name}`);
      }

      // Deploy to blockchain if specified
      if (fundData.deploy && fundCreated) {
        try {
          console.log(`  → Deploying ${fundData.name} to blockchain...`);
          const deployResult = await contractService.deployFundViaFactory(
            fundData.name,
            fundData.tokenSymbol,
            fundData.targetAmount,
            fundData.minimumInvestment
          );

          await fund.update({
            contractAddress: deployResult.tokenAddress,
            onChainFundId: deployResult.fundId,
          });

          console.log(`  ✅ Deployed: Fund ID ${deployResult.fundId}, Token: ${deployResult.tokenAddress.slice(0, 10)}...`);

          // Register fund in InvestmentContract
          try {
            console.log(`  → Registering fund in InvestmentContract...`);
            const investmentContractResult = await contractService.registerFundInInvestmentContract(
              deployResult.tokenAddress,
              gp.walletAddress,
              fundData.targetAmount,
              fundData.minimumInvestment
            );
            
            // Store InvestmentContract fund ID in a custom field
            fund.investmentContractFundId = investmentContractResult.fundId;
            
            console.log(`  ✅ Registered in InvestmentContract (Fund ID: ${investmentContractResult.fundId})`);
          } catch (regError) {
            console.error(`  ⚠️  InvestmentContract registration failed: ${regError.message}`);
          }
        } catch (error) {
          console.error(`  ❌ Deployment failed: ${error.message}`);
        }
      }

      createdFunds.push(fund);
    }

    // Reload all funds to get updated onChainFundId values
    for (let i = 0; i < createdFunds.length; i++) {
      await createdFunds[i].reload();
    }

    console.log();

    // ============================================
    // 4. CREATE INVESTMENTS
    // ============================================
    console.log("📋 Step 4: Creating investments...");

    const investmentsData = [
      // Tech Ventures Fund investments
      { lpIndex: 0, fundIndex: 0, amount: 50000, status: "pending" },
      { lpIndex: 1, fundIndex: 0, amount: 25000, status: "confirmed" },
      
      // Sustainable Energy Fund investments
      { lpIndex: 0, fundIndex: 1, amount: 30000, status: "confirmed" },
      { lpIndex: 1, fundIndex: 1, amount: 20000, status: "pending" },
    ];

    for (const invData of investmentsData) {
      const lp = createdLPs[invData.lpIndex];
      const fund = createdFunds[invData.fundIndex];

      const [investment, invCreated] = await Investment.findOrCreate({
        where: { lpId: lp.id, fundId: fund.id },
        defaults: {
          amount: invData.amount,
          status: invData.status,
          tokensIssued: invData.status === "confirmed" ? invData.amount : 0,
        },
      });

      if (invCreated) {
        // Update fund raised amount
        await fund.update({
          raisedAmount: parseFloat(fund.raisedAmount) + invData.amount,
        });

        // Record on-chain if fund is deployed and investment is confirmed
        if (fund.investmentContractFundId !== undefined && invData.status === "confirmed" && lp.walletAddress) {
          try {
            const result = await contractService.recordInvestment(
              fund.investmentContractFundId, // Use InvestmentContract fund ID, not FundFactory ID
              lp.walletAddress,
              invData.amount,
              invData.amount, // 1:1 token ratio
              `db-${investment.id}`
            );

            await investment.update({
              onChainInvestmentId: result.investmentId,
              onChainTxHash: result.txHash,
            });

            // Mint tokens to LP wallet
            try {
              console.log(`  → Minting ${invData.amount} tokens to ${lp.email}...`);
              await contractService.mintFundTokensForFund(
                fund.contractAddress,
                lp.walletAddress,
                invData.amount
              );
              console.log(`  ✅ Investment: ${lp.email} → ${fund.name} ($${invData.amount.toLocaleString()}) [On-chain ID: ${result.investmentId}, Tokens minted]`);
            } catch (mintError) {
              console.error(`  ⚠️  Token minting failed: ${mintError.message}`);
              console.log(`  ✅ Investment: ${lp.email} → ${fund.name} ($${invData.amount.toLocaleString()}) [On-chain ID: ${result.investmentId}, No tokens]`);
            }
          } catch (error) {
            console.error(`  ❌ On-chain recording failed: ${error.message}`);
            console.log(`  ✅ Investment: ${lp.email} → ${fund.name} ($${invData.amount.toLocaleString()}) [DB only]`);
          }
        } else {
          console.log(`  ✅ Investment: ${lp.email} → ${fund.name} ($${invData.amount.toLocaleString()}) [${invData.status}]`);
        }
      } else {
        console.log(`  ⏭️  Investment exists: ${lp.email} → ${fund.name}`);
      }
    }

    console.log();

    // ============================================
    // 5. CREATE PORTFOLIO COMPANIES
    // ============================================
    console.log("📋 Step 5: Creating portfolio companies...");

    const companies = [
      { name: "NeuralTech AI", industry: "Artificial Intelligence", country: "USA", foundedYear: 2020 },
      { name: "BlockChain Solutions", industry: "Blockchain", country: "Singapore", foundedYear: 2019 },
      { name: "CloudScale SaaS", industry: "Cloud Computing", country: "USA", foundedYear: 2021 },
      { name: "BioGen Therapeutics", industry: "Biotechnology", country: "Switzerland", foundedYear: 2018 },
      { name: "SolarWave Energy", industry: "Solar Energy", country: "USA", foundedYear: 2019 },
      { name: "WindTech Systems", industry: "Wind Energy", country: "Denmark", foundedYear: 2017 },
      { name: "PayFlow Fintech", industry: "Payments", country: "USA", foundedYear: 2020 },
      { name: "HealthHub Digital", industry: "Digital Health", country: "UK", foundedYear: 2021 },
    ];

    // Login as GP to create companies via API
    try {
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: "gp@demo.com",
        password: "password123",
      });

      const token = loginResponse.data.data.token;
      let successCount = 0;
      let skipCount = 0;

      // Check existing companies on-chain first
      const existingCompanies = await axios.get(
        `${API_BASE_URL}/portfolio/companies`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const existingNames = new Set(existingCompanies.data.data.map(c => c.name));

      for (const company of companies) {
        if (existingNames.has(company.name)) {
          console.log(`  ⏭️  Company exists: ${company.name}`);
          skipCount++;
          continue;
        }

        try {
          await axios.post(
            `${API_BASE_URL}/portfolio/companies`,
            company,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          console.log(`  ✅ Company: ${company.name}`);
          successCount++;
        } catch (err) {
          if (err.response?.status === 409 || err.response?.data?.error?.message?.includes("already exists")) {
            console.log(`  ⏭️  Company exists: ${company.name}`);
            skipCount++;
          } else {
            console.error(`  ❌ Failed: ${company.name} - ${err.response?.data?.error?.message || err.message}`);
          }
        }
      }

      console.log(`  📊 ${successCount} created, ${skipCount} skipped`);
    } catch (error) {
      console.error(`  ❌ Portfolio company seeding failed: ${error.message}`);
    }

    console.log();

    // ============================================
    // SUMMARY
    // ============================================
    console.log("✨ Seed complete!\n");
    console.log("═══════════════════════════════════════════════════");
    console.log("📧 DEMO ACCOUNTS");
    console.log("═══════════════════════════════════════════════════");
    console.log("GP:   gp@demo.com / password123");
    console.log("LP1:  lp1@demo.com / password123 (KYC: approved)");
    console.log("LP2:  lp2@demo.com / password123 (KYC: approved)");
    console.log("LP3:  lp3@demo.com / password123 (KYC: pending)");
    console.log();
    console.log("═══════════════════════════════════════════════════");
    console.log("🔐 WALLET ADDRESSES (Hardhat Network)");
    console.log("═══════════════════════════════════════════════════");
    console.log("GP:   0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
    console.log("LP1:  0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
    console.log("LP2:  0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC");
    console.log("LP3:  0x90F79bf6EB2c4f870365E785982E1f101E93b906");
    console.log();
    console.log("═══════════════════════════════════════════════════");
    console.log("💼 FUNDS");
    console.log("═══════════════════════════════════════════════════");
    for (const fund of createdFunds) {
      await fund.reload();
      const deployed = fund.contractAddress ? "✅ Deployed" : "❌ Not deployed";
      console.log(`${fund.name}`);
      console.log(`  Status: ${deployed}`);
      console.log(`  Raised: $${parseFloat(fund.raisedAmount).toLocaleString()} / $${parseFloat(fund.targetAmount).toLocaleString()}`);
      if (fund.contractAddress) {
        console.log(`  Token: ${fund.contractAddress.slice(0, 10)}...`);
        console.log(`  On-chain ID: ${fund.onChainFundId}`);
      }
      console.log();
    }
    console.log("═══════════════════════════════════════════════════\n");

  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  }
}

module.exports = seed;

// Run directly if called as script
if (require.main === module) {
  const { sequelize } = require("../models");

  sequelize
    .authenticate()
    .then(() => {
      console.log("🔌 Database connected\n");
      return sequelize.sync();
    })
    .then(() => seed())
    .then(() => {
      console.log("✅ Seed completed successfully");
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Seed failed:", err);
      process.exit(1);
    });
}
