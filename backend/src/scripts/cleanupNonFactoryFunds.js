const { Fund, Investment } = require("../models");

async function cleanupNonFactoryFunds() {
  try {
    console.log("=== Cleanup Non-Factory Funds ===\n");

    // Find all funds
    const allFunds = await Fund.findAll();
    console.log(`Total funds in database: ${allFunds.length}`);

    // Find funds without onChainFundId (not deployed via FundFactory)
    const nonFactoryFunds = allFunds.filter(fund => !fund.onChainFundId);
    console.log(`Funds NOT deployed via FundFactory: ${nonFactoryFunds.length}`);

    // Find funds with onChainFundId (deployed via FundFactory)
    const factoryFunds = allFunds.filter(fund => fund.onChainFundId);
    console.log(`Funds deployed via FundFactory: ${factoryFunds.length}\n`);

    if (nonFactoryFunds.length === 0) {
      console.log("No non-factory funds to clean up!");
      return;
    }

    console.log("Non-Factory Funds to be deleted:");
    for (const fund of nonFactoryFunds) {
      console.log(`  - ${fund.name} (ID: ${fund.id})`);
      console.log(`    Contract: ${fund.contractAddress || 'None'}`);
      console.log(`    Status: ${fund.status}`);
      
      // Check for investments
      const investments = await Investment.findAll({ where: { fundId: fund.id } });
      if (investments.length > 0) {
        console.log(`    WARNING: Has ${investments.length} investment(s)`);
      }
    }

    console.log("\nThis will DELETE these funds from the database!");
    console.log("To proceed, run this script with --confirm flag\n");

    // Check for --confirm flag
    const confirmed = process.argv.includes('--confirm');
    
    if (!confirmed) {
      console.log("Dry run complete. No changes made.");
      console.log("Run with --confirm to actually delete the funds:");
      console.log("  node src/scripts/cleanupNonFactoryFunds.js --confirm");
      return;
    }

    // Delete non-factory funds
    console.log("\n=== Deleting Non-Factory Funds ===");
    
    for (const fund of nonFactoryFunds) {
      // First delete related investments
      const deletedInvestments = await Investment.destroy({ where: { fundId: fund.id } });
      if (deletedInvestments > 0) {
        console.log(`  Deleted ${deletedInvestments} investment(s) for ${fund.name}`);
      }
      
      // Then delete the fund
      await fund.destroy();
      console.log(`  Deleted fund: ${fund.name}`);
    }

    console.log("\nCleanup complete!");
    console.log(`Deleted ${nonFactoryFunds.length} non-factory fund(s)`);
    console.log(`Remaining ${factoryFunds.length} factory-deployed fund(s)`);

  } catch (error) {
    console.error("Error during cleanup:", error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupNonFactoryFunds()
  .then(() => {
    console.log("\nScript finished.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
