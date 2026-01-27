const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting ERC-3643 contracts deployment...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString(), "\n");

  // Deploy IdentityRegistry
  console.log("Deploying IdentityRegistry...");
  const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
  const identityRegistry = await IdentityRegistry.deploy();
  await identityRegistry.deployed();
  console.log("IdentityRegistry deployed to:", identityRegistry.address);

  // Deploy TrustedIssuersRegistry
  console.log("\nDeploying TrustedIssuersRegistry...");
  const TrustedIssuersRegistry = await ethers.getContractFactory("TrustedIssuersRegistry");
  const trustedIssuersRegistry = await TrustedIssuersRegistry.deploy();
  await trustedIssuersRegistry.deployed();
  console.log("TrustedIssuersRegistry deployed to:", trustedIssuersRegistry.address);

  // Deploy ComplianceModule
  console.log("\nDeploying ComplianceModule...");
  const ComplianceModule = await ethers.getContractFactory("ComplianceModule");
  const complianceModule = await ComplianceModule.deploy(identityRegistry.address);
  await complianceModule.deployed();
  console.log("ComplianceModule deployed to:", complianceModule.address);

  // Deploy a sample FundTokenERC3643
  console.log("\nDeploying sample FundTokenERC3643...");
  const FundTokenERC3643 = await ethers.getContractFactory("FundTokenERC3643");
  const fundToken = await FundTokenERC3643.deploy(
    "Demo Fund Token",
    "DFT3643",
    identityRegistry.address,
    complianceModule.address
  );
  await fundToken.deployed();
  console.log("FundTokenERC3643 deployed to:", fundToken.address);

  // Save deployment info
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      IdentityRegistry: {
        address: identityRegistry.address,
        abi: JSON.parse(identityRegistry.interface.format("json")),
      },
      TrustedIssuersRegistry: {
        address: trustedIssuersRegistry.address,
        abi: JSON.parse(trustedIssuersRegistry.interface.format("json")),
      },
      ComplianceModule: {
        address: complianceModule.address,
        abi: JSON.parse(complianceModule.interface.format("json")),
      },
      FundTokenERC3643: {
        address: fundToken.address,
        abi: JSON.parse(fundToken.interface.format("json")),
      },
    },
  };

  const sharedDir = path.join(__dirname, "../../shared/contracts");
  if (!fs.existsSync(sharedDir)) {
    fs.mkdirSync(sharedDir, { recursive: true });
  }

  const deployedPath = path.join(sharedDir, "deployed-erc3643.json");
  fs.writeFileSync(deployedPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\nDeployment info saved to:", deployedPath);

  // Setup initial configuration
  console.log("\n=== Initial Configuration ===");

  // Register deployer as verified identity
  console.log("\nRegistering deployer identity...");
  const tx1 = await identityRegistry.registerIdentity(deployer.address, 840); // 840 = USA
  await tx1.wait();
  console.log("Deployer registered with country code 840 (USA)");

  // Add KYC claim to deployer
  console.log("\nAdding KYC claim to deployer...");
  const CLAIM_KYC_VERIFIED = 2;
  const tx2 = await identityRegistry.addClaim(deployer.address, CLAIM_KYC_VERIFIED);
  await tx2.wait();
  console.log("KYC claim added");

  // Enable compliance restrictions
  console.log("\nEnabling compliance restrictions...");
  const tx3 = await complianceModule.enableRestrictions(fundToken.address);
  await tx3.wait();
  console.log("Compliance restrictions enabled");

  // Set max holders (optional)
  console.log("\nSetting max holders to 100...");
  const tx4 = await complianceModule.setMaxHolders(fundToken.address, 100);
  await tx4.wait();
  console.log("Max holders set");

  // Allow USA
  console.log("\nAllowing USA (840)...");
  const tx5 = await complianceModule.allowCountry(fundToken.address, 840);
  await tx5.wait();
  console.log("USA allowed");

  console.log("\n=== Deployment Complete ===");
  console.log("\nContract Addresses:");
  console.log("- IdentityRegistry:", identityRegistry.address);
  console.log("- TrustedIssuersRegistry:", trustedIssuersRegistry.address);
  console.log("- ComplianceModule:", complianceModule.address);
  console.log("- FundTokenERC3643:", fundToken.address);

  console.log("\nNext steps:");
  console.log("1. Update backend contractService to use new contracts");
  console.log("2. Register user identities via IdentityRegistry");
  console.log("3. Configure compliance rules per fund");
  console.log("4. Test token transfers with compliance checks");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
