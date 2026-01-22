require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const networks = {
  hardhat: { 
    chainId: 1337,
  },
  localhost: { 
    url: "http://127.0.0.1:8545", 
    chainId: 1337,
  },
};

// Polygon Amoy Testnet (replaced Mumbai)
if (process.env.POLYGON_AMOY_RPC_URL) {
  networks.polygonAmoy = {
    url: process.env.POLYGON_AMOY_RPC_URL,
    accounts: [PRIVATE_KEY],
    chainId: 80002,
    gasPrice: 35000000000, // 35 gwei
  };
}

// Polygon Mainnet
if (process.env.POLYGON_MAINNET_RPC_URL) {
  networks.polygon = {
    url: process.env.POLYGON_MAINNET_RPC_URL,
    accounts: [PRIVATE_KEY],
    chainId: 137,
    gasPrice: "auto",
  };
}

// Sepolia Testnet (Ethereum)
if (process.env.SEPOLIA_RPC_URL) {
  networks.sepolia = {
    url: process.env.SEPOLIA_RPC_URL,
    accounts: [PRIVATE_KEY],
    chainId: 11155111,
  };
}

module.exports = {
  solidity: {
    version: "0.8.17",
    settings: { 
      optimizer: { 
        enabled: true, 
        runs: 200,
      },
    },
  },
  networks,
  etherscan: { 
    apiKey: {
      polygon: process.env.POLYGONSCAN_API_KEY || "",
      polygonAmoy: process.env.POLYGONSCAN_API_KEY || "",
      sepolia: process.env.ETHERSCAN_API_KEY || "",
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
};
