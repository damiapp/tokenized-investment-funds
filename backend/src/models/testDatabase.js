const { Sequelize } = require("sequelize");

// Test database configuration using SQLite
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: ":memory:",
  logging: false, // Disable logging for tests
});

module.exports = sequelize;
