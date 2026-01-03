const { DataTypes } = require("sequelize");
const sequelize = require("./database");

const User = sequelize.define("User", {
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
      isEmail: true,
    },
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM("GP", "LP"),
    allowNull: false,
  },
  walletAddress: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      is: /^0x[a-fA-F0-9]{40}$/,
    },
  },
});

module.exports = User;
