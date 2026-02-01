const { User, KycStatus, Fund, Investment, sequelize } = require("../models");

/**
 * Clean Database Script
 * 
 * Removes all data from the database to prepare for fresh seeding.
 * Use with caution - this will delete ALL data!
 */

async function cleanDatabase() {
  console.log("🧹 Starting database cleanup...\n");

  try {
    // Delete in correct order to respect foreign key constraints
    console.log("Deleting investments...");
    await Investment.destroy({ where: {}, truncate: true, cascade: true });
    console.log("  ✅ Investments deleted");

    console.log("Deleting funds...");
    await Fund.destroy({ where: {}, truncate: true, cascade: true });
    console.log("  ✅ Funds deleted");

    console.log("Deleting KYC statuses...");
    await KycStatus.destroy({ where: {}, truncate: true, cascade: true });
    console.log("  ✅ KYC statuses deleted");

    console.log("Deleting users...");
    await User.destroy({ where: {}, truncate: true, cascade: true });
    console.log("  ✅ Users deleted");

    console.log("\n✨ Database cleaned successfully!\n");
    console.log("You can now run the seed script to populate fresh data.");
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    throw error;
  }
}

module.exports = cleanDatabase;

// Run directly if called as script
if (require.main === module) {
  sequelize
    .authenticate()
    .then(() => {
      console.log("🔌 Database connected\n");
      return cleanDatabase();
    })
    .then(() => {
      console.log("✅ Cleanup completed successfully");
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Cleanup failed:", err);
      process.exit(1);
    });
}
