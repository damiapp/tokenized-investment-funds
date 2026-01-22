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
    type: DataTypes.ENUM("pending", "submitted", "approved", "rejected"),
    allowNull: false,
    defaultValue: "pending",
  },
  providerRef: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  documents: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null,
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  submittedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  onChainTxHash: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: "Transaction hash of on-chain KYC verification",
  },
  onChainSyncedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: "When KYC was synced to blockchain",
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
