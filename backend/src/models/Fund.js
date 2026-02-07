const { DataTypes } = require("sequelize");
const sequelize = require("./database");

const Fund = sequelize.define(
  "Fund",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    gpId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    targetAmount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
    },
    raisedAmount: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
    },
    minimumInvestment: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
    },
    managementFee: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      comment: "Annual management fee percentage",
    },
    performanceFee: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      comment: "Performance fee percentage",
    },
    investmentStrategy: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    riskLevel: {
      type: DataTypes.ENUM("low", "medium", "high"),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("draft", "active", "closed", "liquidated"),
      defaultValue: "draft",
    },
    fundingDeadline: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    contractAddress: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Smart contract address on blockchain",
    },
    onChainFundId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Fund ID from FundFactory contract",
    },
    investmentContractFundId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Fund ID from InvestmentContract (used for portfolio lookups)",
    },
    tokenSymbol: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    terms: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Additional terms and conditions",
    },
  },
  {
    tableName: "Funds",
    timestamps: true,
  }
);

Fund.associate = (models) => {
  Fund.belongsTo(models.User, {
    foreignKey: "gpId",
    as: "generalPartner",
  });
  
  Fund.hasMany(models.Investment, {
    foreignKey: "fundId",
    as: "investments",
  });
};

module.exports = Fund;
