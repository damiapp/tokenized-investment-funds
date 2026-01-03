// Simple test script for auth endpoints
// Run with: node test-auth.js

const axios = require("axios");

const API_BASE = "http://localhost:3001";

async function testAuth() {
  console.log("🧪 Testing Authentication Endpoints\n");

  try {
    // Test registration
    console.log("1. Testing POST /auth/register");
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
      email: "test@example.com",
      password: "testpassword123",
      role: "LP",
      walletAddress: "0x1234567890123456789012345678901234567890",
    });
    
    console.log("✅ Registration successful");
    console.log("User:", registerResponse.data.data.user);
    console.log("Token:", registerResponse.data.data.token.substring(0, 20) + "...\n");

    const token = registerResponse.data.data.token;

    // Test login
    console.log("2. Testing POST /auth/login");
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: "test@example.com",
      password: "testpassword123",
    });
    
    console.log("✅ Login successful");
    console.log("User:", loginResponse.data.data.user);
    console.log("Token:", loginResponse.data.data.token.substring(0, 20) + "...\n");

    // Test GET /me
    console.log("3. Testing GET /me");
    const meResponse = await axios.get(`${API_BASE}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    console.log("✅ GET /me successful");
    console.log("User:", meResponse.data.data);
    console.log("KYC Status:", meResponse.data.data.kyc);

  } catch (error) {
    console.error("❌ Test failed:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error("Error:", error.message);
    }
  }
}

if (require.main === module) {
  testAuth();
}

module.exports = testAuth;
