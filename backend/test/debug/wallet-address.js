const { TestUser, sequelize } = require("../../src/models/testModels");

async function debugWalletAddress() {
  // Sync database first
  await sequelize.sync({ force: true });
  
  const validAddress = "0x1234567890123456789012345678901234567890";
  console.log("Testing address:", validAddress);
  console.log("Regex test:", /^0x[a-fA-F0-9]{40}$/.test(validAddress));
  
  try {
    const user = await TestUser.create({
      email: "test@example.com",
      passwordHash: "hashedpassword",
      role: "LP",
      walletAddress: validAddress,
    });
    console.log("✅ User created successfully");
    console.log("Wallet address:", user.walletAddress);
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("Validation errors:", error.errors?.map(e => e.message));
  }
  
  await sequelize.close();
}

debugWalletAddress();
