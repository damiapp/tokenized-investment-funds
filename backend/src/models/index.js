const sequelize = require("./database");
const User = require("./User");
const KycStatus = require("./KycStatus");
const Fund = require("./Fund");
const Investment = require("./Investment");

const models = {
  User,
  KycStatus,
  Fund,
  Investment,
  sequelize,
};

// Set up all associations
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = models;
