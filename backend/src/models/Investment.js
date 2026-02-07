const { DataTypes } = require("sequelize");
const sequelize = require("./database");

const Investment = sequelize.define(
  "Investment",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    fundId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Funds",
        key: "id",
      },
    },
    lpId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    amount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
    },
    tokensIssued: {
      type: DataTypes.DECIMAL(20, 8),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("pending", "confirmed", "cancelled"),
      defaultValue: "pending",
    },
    transactionHash: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    onChainInvestmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    onChainTxHash: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    investedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "Investments",
    timestamps: true,
  }
);

Investment.associate = (models) => {
  Investment.belongsTo(models.Fund, {
    foreignKey: "fundId",
    as: "fund",
  });
  
  Investment.belongsTo(models.User, {
    foreignKey: "lpId",
    as: "limitedPartner",
  });
};

module.exports = Investment;
