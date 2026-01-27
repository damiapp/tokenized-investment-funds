const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("=== Approve GP in FundFactory ===");
  console.log("Deployer:", deployer.address);

  const deployedPath = path.join(__dirname, "../../shared/contracts/deployed.json");
  const deployed = JSON.parse(fs.readFileSync(deployedPath, "utf8"));

  const fundFactoryAddress = deployed.contracts.FundFactory.address;
  const fundFactoryAbi = deployed.contracts.FundFactory.abi;

  console.log("FundFactory:", fundFactoryAddress);

  const fundFactory = new hre.ethers.Contract(fundFactoryAddress, fundFactoryAbi, deployer);

  const gpAddress = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8";

  console.log("\nApproving GP:", gpAddress);
  
  const tx = await fundFactory.approveGP(gpAddress);
  await tx.wait();
  
  console.log("✓ GP approved!");
  console.log("Transaction hash:", tx.hash);

  const isApproved = await fundFactory.isApprovedGP(gpAddress);
  console.log("Verification - Is GP approved?", isApproved);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
