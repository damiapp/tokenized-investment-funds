const { TestUser, TestKycStatus } = require("../../src/models/testModels");
const { hashPassword } = require("../../src/services/password");

// Test data factory
const createTestUser = async (overrides = {}) => {
  const defaultUser = {
    email: `test-${Math.random().toString(36).substring(7)}@example.com`,
    passwordHash: await hashPassword("testpassword123"),
    role: "LP",
    walletAddress: "0x1234567890123456789012345678901234567890",
  };

  const userData = { ...defaultUser, ...overrides };
  const user = await TestUser.create(userData);

  // Create KYC status for the user
  await TestKycStatus.create({
    userId: user.id,
    status: "pending",
  });

  return user;
};

const createTestKycStatus = async (userId, overrides = {}) => {
  const defaultKyc = {
    userId,
    status: "pending",
  };

  const kycData = { ...defaultKyc, ...overrides };
  return await TestKycStatus.create(kycData);
};

// JWT token helper
const generateTestToken = (userId = "test-user-id") => {
  const jwt = require("jsonwebtoken");
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || "test-jwt-secret-key",
    { expiresIn: "1h" }
  );
};

// HTTP request helpers
const createAuthHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

// Test data generators
const generateValidUser = () => ({
  email: `user-${Math.random().toString(36).substring(7)}@example.com`,
  password: "testpassword123",
  role: "LP",
  walletAddress: "0x1234567890123456789012345678901234567890",
});

const generateValidGP = () => ({
  email: `gp-${Math.random().toString(36).substring(7)}@example.com`,
  password: "testpassword123",
  role: "GP",
  walletAddress: "0x1234567890123456789012345678901234567890",
});

// Database cleanup helpers
const clearDatabase = async () => {
  await TestKycStatus.destroy({ where: {}, force: true });
  await TestUser.destroy({ where: {}, force: true });
};

// Assertion helpers
const expectUserResponse = (response, expectedFields = {}) => {
  expect(response.body.data).toHaveProperty("user");
  expect(response.body.data).toHaveProperty("token");
  
  const user = response.body.data.user;
  expect(user).toHaveProperty("id");
  expect(user).toHaveProperty("email");
  expect(user).toHaveProperty("role");
  expect(user).toHaveProperty("walletAddress");
  expect(user).not.toHaveProperty("passwordHash");

  // Apply expected field overrides
  Object.entries(expectedFields).forEach(([key, value]) => {
    expect(user[key]).toBe(value);
  });
};

const expectErrorResponse = (response, expectedCode, expectedMessagePattern) => {
  expect(response.body).toHaveProperty("error");
  expect(response.body.error).toHaveProperty("code", expectedCode);
  
  if (expectedMessagePattern) {
    expect(response.body.error.message).toMatch(expectedMessagePattern);
  }
};

module.exports = {
  createTestUser,
  createTestKycStatus,
  generateTestToken,
  createAuthHeaders,
  generateValidUser,
  generateValidGP,
  clearDatabase,
  expectUserResponse,
  expectErrorResponse,
};
