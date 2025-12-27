const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deployer:", deployer.address);

  const KYCRegistry = await hre.ethers.getContractFactory("KYCRegistry");
  const registry = await KYCRegistry.deploy();
  await registry.deployed();

  const FundToken = await hre.ethers.getContractFactory("FundToken");
  const token = await FundToken.deploy("Demo Fund Token", "DFT", registry.address);
  await token.deployed();

  console.log("KYCRegistry:", registry.address);
  console.log("FundToken:", token.address);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
