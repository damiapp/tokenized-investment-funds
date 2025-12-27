require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const polygonUrl = process.env.POLYGON_RPC_URL;
const privateKey = process.env.PRIVATE_KEY;

const networks = {
  hardhat: { chainId: 1337 },
  localhost: { url: "http://127.0.0.1:8545", chainId: 1337 },
};

if (polygonUrl && privateKey) {
  networks.polygon = {
    url: polygonUrl,
    accounts: [privateKey],
  };
}

module.exports = {
  solidity: {
    version: "0.8.17",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks,
  etherscan: { apiKey: process.env.ETHERSCAN_API_KEY },
};
