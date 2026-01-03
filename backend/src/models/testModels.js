const { DataTypes } = require("sequelize");
const sequelize = require("./testDatabase");

const TestUser = sequelize.define("User", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: {
        msg: "Invalid email format"
      },
    },
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM("GP", "LP"),
    allowNull: false,
    validate: {
      isIn: {
        args: [["GP", "LP"]],
        msg: "Role must be GP or LP"
      }
    },
  },
  walletAddress: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
    validate: {
      // Only validate if value is provided and not null
      isEthereumAddress(value) {
        if (value && value !== null) {
          const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
          if (!ethAddressRegex.test(value)) {
            throw new Error('Invalid wallet address format');
          }
        }
      }
    },
  },
}, {
  validate: {
    validateRole() {
      if (!["GP", "LP"].includes(this.role)) {
        throw new Error("Role must be GP or LP");
      }
    }
  }
});

const TestKycStatus = sequelize.define("KycStatus", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: TestUser,
      key: "id",
    },
  },
  status: {
    type: DataTypes.ENUM("pending", "approved", "rejected"),
    allowNull: false,
    defaultValue: "pending",
    validate: {
      isIn: {
        args: [["pending", "approved", "rejected"]],
        msg: "Status must be pending, approved, or rejected"
      }
    },
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
}, {
  validate: {
    validateStatus() {
      if (!["pending", "approved", "rejected"].includes(this.status)) {
        throw new Error("Status must be pending, approved, or rejected");
      }
    }
  }
});

// Set up associations
TestUser.hasOne(TestKycStatus, { foreignKey: "userId", as: "kyc" });
TestKycStatus.belongsTo(TestUser, { foreignKey: "userId", as: "user" });

module.exports = {
  TestUser,
  TestKycStatus,
  sequelize,
};
