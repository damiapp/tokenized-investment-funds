const { User, KycStatus, Fund, Investment } = require("../models");
const { hashPassword } = require("../services/password");
const contractService = require("../services/contractService");

async function seedDemoData() {
  console.log("🌱 Starting demo data seed...\n");

  try {
    // Initialize contract service for GP approval
    if (!contractService.isInitialized()) {
      console.log("Initializing contract service...");
      await contractService.initialize();
    }

    // Create GP user
    console.log("Creating GP user...");
    const gpPassword = await hashPassword("password123");
    const [gp, gpCreated] = await User.findOrCreate({
      where: { email: "gp@demo.com" },
      defaults: {
        passwordHash: gpPassword,
        role: "GP",
        walletAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      },
    });
    if (gpCreated) {
      await KycStatus.create({ userId: gp.id, status: "approved" });
      console.log("  ✅ GP created: gp@demo.com / password123");
    } else {
      console.log("  ⏭️  GP already exists: gp@demo.com");
    }

    // Auto-approve GP in FundFactory
    if (contractService.isInitialized() && gp.walletAddress) {
      try {
        const isApproved = await contractService.isApprovedGP(gp.walletAddress);
        if (!isApproved) {
          console.log("  → Auto-approving GP in FundFactory...");
          await contractService.approveGP(gp.walletAddress);
          console.log("  ✅ GP approved in FundFactory");
        } else {
          console.log("  ✓ GP already approved in FundFactory");
        }
      } catch (error) {
        console.warn("  ⚠️  Could not auto-approve GP in FundFactory:", error.message);
      }
    }

    // Create LP user with approved KYC
    console.log("Creating LP user (KYC approved)...");
    const lpPassword = await hashPassword("password123");
    const [lp, lpCreated] = await User.findOrCreate({
      where: { email: "lp@demo.com" },
      defaults: {
        passwordHash: lpPassword,
        role: "LP",
        walletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      },
    });
    if (lpCreated) {
      await KycStatus.create({ userId: lp.id, status: "approved" });
      console.log("  ✅ LP created: lp@demo.com / password123 (KYC: approved)");
    } else {
      console.log("  ⏭️  LP already exists: lp@demo.com");
    }

    // Create LP user with pending KYC
    console.log("Creating LP user (KYC pending)...");
    const lp2Password = await hashPassword("password123");
    const [lp2, lp2Created] = await User.findOrCreate({
      where: { email: "lp2@demo.com" },
      defaults: {
        passwordHash: lp2Password,
        role: "LP",
        walletAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      },
    });
    if (lp2Created) {
      await KycStatus.create({ userId: lp2.id, status: "pending" });
      console.log("  ✅ LP2 created: lp2@demo.com / password123 (KYC: pending)");
    } else {
      console.log("  ⏭️  LP2 already exists: lp2@demo.com");
    }

    // Create demo funds
    console.log("\nCreating demo funds...");
    
    const [fund1, fund1Created] = await Fund.findOrCreate({
      where: { name: "Tech Growth Fund 2026" },
      defaults: {
        gpId: gp.id,
        description: "A diversified technology growth fund focusing on emerging AI and blockchain companies.",
        targetAmount: 1000000,
        raisedAmount: 250000,
        minimumInvestment: 10000,
        managementFee: 2.0,
        performanceFee: 20.0,
        investmentStrategy: "Long-term growth through strategic investments in early-stage tech companies with strong fundamentals.",
        riskLevel: "high",
        status: "active",
        tokenSymbol: "TGF26",
      },
    });
    if (fund1Created) {
      console.log("  ✅ Fund created: Tech Growth Fund 2026 (active, $250k/$1M raised)");
    }

    const [fund2, fund2Created] = await Fund.findOrCreate({
      where: { name: "Stable Income Fund" },
      defaults: {
        gpId: gp.id,
        description: "Conservative fund focused on stable dividend-paying assets and bonds.",
        targetAmount: 500000,
        raisedAmount: 0,
        minimumInvestment: 5000,
        managementFee: 1.5,
        performanceFee: 10.0,
        investmentStrategy: "Capital preservation with steady income through diversified fixed-income securities.",
        riskLevel: "low",
        status: "active",
        tokenSymbol: "SIF",
      },
    });
    if (fund2Created) {
      console.log("  ✅ Fund created: Stable Income Fund (active, $0/$500k raised)");
    }

    const [fund3, fund3Created] = await Fund.findOrCreate({
      where: { name: "Balanced Portfolio Fund" },
      defaults: {
        gpId: gp.id,
        description: "Balanced approach combining growth and income strategies.",
        targetAmount: 750000,
        raisedAmount: 500000,
        minimumInvestment: 7500,
        managementFee: 1.75,
        performanceFee: 15.0,
        investmentStrategy: "60/40 allocation between growth equities and fixed income with quarterly rebalancing.",
        riskLevel: "medium",
        status: "active",
        tokenSymbol: "BPF",
      },
    });
    if (fund3Created) {
      console.log("  ✅ Fund created: Balanced Portfolio Fund (active, $500k/$750k raised)");
    }

    const [fund4, fund4Created] = await Fund.findOrCreate({
      where: { name: "Crypto Innovation Fund" },
      defaults: {
        gpId: gp.id,
        description: "High-risk fund investing in cryptocurrency and DeFi protocols.",
        targetAmount: 2000000,
        raisedAmount: 0,
        minimumInvestment: 25000,
        managementFee: 2.5,
        performanceFee: 25.0,
        investmentStrategy: "Aggressive allocation to top-tier cryptocurrencies and emerging DeFi projects.",
        riskLevel: "high",
        status: "draft",
        tokenSymbol: "CIF",
      },
    });
    if (fund4Created) {
      console.log("  ✅ Fund created: Crypto Innovation Fund (draft)");
    }

    // Create demo investments
    console.log("\nCreating demo investments...");
    
    if (fund1Created && lpCreated) {
      await Investment.findOrCreate({
        where: { lpId: lp.id, fundId: fund1.id },
        defaults: {
          amount: 50000,
          status: "confirmed",
        },
      });
      console.log("  ✅ Investment: LP invested $50k in Tech Growth Fund");
    }

    if (fund3Created && lpCreated) {
      await Investment.findOrCreate({
        where: { lpId: lp.id, fundId: fund3.id },
        defaults: {
          amount: 25000,
          status: "confirmed",
        },
      });
      console.log("  ✅ Investment: LP invested $25k in Balanced Portfolio Fund");
    }

    console.log("\n✨ Demo data seed complete!\n");
    console.log("Demo Accounts:");
    console.log("  GP:  gp@demo.com / password123");
    console.log("  LP:  lp@demo.com / password123 (KYC approved - can invest)");
    console.log("  LP2: lp2@demo.com / password123 (KYC pending - cannot invest)");
    console.log("\nHardhat Wallet Addresses:");
    console.log("  GP:  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
    console.log("  LP:  0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
    console.log("  LP2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC");

  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  }
}

module.exports = seedDemoData;

// Run directly if called as script
if (require.main === module) {
  const { sequelize } = require("../models");
  
  sequelize.authenticate()
    .then(() => sequelize.sync())
    .then(() => seedDemoData())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
