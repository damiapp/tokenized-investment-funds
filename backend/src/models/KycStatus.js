const { DataTypes } = require("sequelize");
const sequelize = require("./database");
const User = require("./User");

const KycStatus = sequelize.define("KycStatus", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: "id",
    },
  },
  status: {
    type: DataTypes.ENUM("pending", "approved", "rejected"),
    allowNull: false,
    defaultValue: "pending",
  },
  providerRef: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
});

// Set up associations
User.hasOne(KycStatus, { foreignKey: "userId", as: "kyc" });
KycStatus.belongsTo(User, { foreignKey: "userId", as: "user" });

module.exports = KycStatus;
