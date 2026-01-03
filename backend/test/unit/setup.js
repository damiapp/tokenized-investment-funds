const { TestUser, TestKycStatus } = require("../../src/models/testModels");

// Set test environment variables
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-key";

// Before all tests, sync the database
beforeAll(async () => {
  await TestUser.sequelize.sync({ force: true, validate: true });
});

// After all tests, close the database connection
afterAll(async () => {
  await TestUser.sequelize.close();
});

// Before each test, clear all data
beforeEach(async () => {
  await TestUser.sequelize.truncate({ cascade: true });
});
