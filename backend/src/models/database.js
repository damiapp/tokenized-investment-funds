const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DATABASE_URL || "postgres://localhost:5432/tokenized_funds",
  {
    logging: process.env.NODE_ENV === "development" ? console.log : false,
  }
);

module.exports = sequelize;
