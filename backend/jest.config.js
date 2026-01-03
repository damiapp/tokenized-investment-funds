module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/src", "<rootDir>/test"],
  testMatch: [
    "**/__tests__/**/*.js",
    "**/?(*.)+(spec|test).js"
  ],
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/index.js",
    "!src/models/testDatabase.js",
    "!src/models/testModels.js",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  setupFilesAfterEnv: ["<rootDir>/test/unit/setup.js"],
  testTimeout: 10000,
  verbose: true,
};
