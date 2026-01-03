const sequelize = require("./database");
const User = require("./User");
const KycStatus = require("./KycStatus");

const models = {
  User,
  KycStatus,
  sequelize,
};

// Set up all associations
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = models;
