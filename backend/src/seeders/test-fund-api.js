const axios = require("axios");

async function testFundAPI() {
  try {
    // Login first
    console.log("Logging in...");
    const loginResponse = await axios.post("http://localhost:3001/auth/login", {
      email: "gp@demo.com",
      password: "password123",
    });
    
    const token = loginResponse.data.data.token;
    console.log("Login successful\n");
    
    // Get Sustainable Energy Fund
    const { Fund } = require("../models");
    const fund = await Fund.findOne({ where: { name: "Sustainable Energy Fund" } });
    
    console.log(`Fetching fund details for ID: ${fund.id}...`);
    const fundResponse = await axios.get(`http://localhost:3001/funds/${fund.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    console.log("\nFund Response:");
    console.log("Name:", fundResponse.data.data.fund.name);
    console.log("onChainFundId:", fundResponse.data.data.fund.onChainFundId);
    console.log("investmentContractFundId:", fundResponse.data.data.fund.investmentContractFundId);
    console.log("contractAddress:", fundResponse.data.data.fund.contractAddress);
    
    if (fundResponse.data.data.fund.investmentContractFundId) {
      console.log("\nFund has investmentContractFundId, portfolio should load");
    } else {
      console.log("\nFund missing investmentContractFundId!");
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
    process.exit(1);
  }
}

const { sequelize } = require("../models");
sequelize.authenticate()
  .then(() => testFundAPI())
  .catch(err => {
    console.error("Database connection failed:", err);
    process.exit(1);
  });
