const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deployer:", deployer.address);
  console.log("Balance:", (await deployer.getBalance()).toString());

  // Deploy KYCRegistry
  console.log("\nDeploying KYCRegistry...");
  const KYCRegistry = await hre.ethers.getContractFactory("KYCRegistry");
  const registry = await KYCRegistry.deploy();
  await registry.deployed();
  console.log("KYCRegistry deployed to:", registry.address);

  // Deploy FundToken
  console.log("\nDeploying FundToken...");
  const FundToken = await hre.ethers.getContractFactory("FundToken");
  const token = await FundToken.deploy("Demo Fund Token", "DFT", registry.address);
  await token.deployed();
  console.log("FundToken deployed to:", token.address);

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contracts: {
      KYCRegistry: {
        address: registry.address,
      },
      FundToken: {
        address: token.address,
        name: "Demo Fund Token",
        symbol: "DFT",
      },
    },
  };

  // Save to contracts/deployments folder
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentPath = path.join(deploymentsDir, `${hre.network.name}.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\nDeployment info saved to: ${deploymentPath}`);

  // Copy ABIs to shared location for backend/frontend
  const sharedDir = path.join(__dirname, "../../shared/contracts");
  if (!fs.existsSync(sharedDir)) {
    fs.mkdirSync(sharedDir, { recursive: true });
  }

  // Get ABIs from artifacts
  const kycRegistryArtifact = await hre.artifacts.readArtifact("KYCRegistry");
  const fundTokenArtifact = await hre.artifacts.readArtifact("FundToken");

  const sharedContracts = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    contracts: {
      KYCRegistry: {
        address: registry.address,
        abi: kycRegistryArtifact.abi,
      },
      FundToken: {
        address: token.address,
        abi: fundTokenArtifact.abi,
      },
    },
  };

  const sharedPath = path.join(sharedDir, "deployed.json");
  fs.writeFileSync(sharedPath, JSON.stringify(sharedContracts, null, 2));
  console.log(`Shared contract info saved to: ${sharedPath}`);

  console.log("\n--- Deployment Complete ---");
  console.log("KYCRegistry:", registry.address);
  console.log("FundToken:", token.address);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
