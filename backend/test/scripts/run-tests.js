#!/usr/bin/env node

// Test runner script for backend tests
// Usage: node run-tests.js [test-type]

const { execSync } = require("child_process");
const path = require("path");

const testCommands = {
  all: "npm test",
  watch: "npm run test:watch",
  coverage: "npm run test:coverage",
  auth: "npm run test:auth",
  models: "npm run test:models",
  services: "npm run test:services",
};

const testType = process.argv[2] || "all";

if (!testCommands[testType]) {
  console.log("❌ Invalid test type. Available options:");
  Object.keys(testCommands).forEach((key) => {
    console.log(`  - ${key}`);
  });
  process.exit(1);
}

console.log(`🧪 Running ${testType} tests...\n`);

try {
  execSync(testCommands[testType], {
    stdio: "inherit",
    cwd: path.resolve(__dirname),
  });
  
  console.log("\n✅ Tests completed successfully!");
} catch (error) {
  console.error("\n❌ Tests failed!");
  process.exit(1);
}
