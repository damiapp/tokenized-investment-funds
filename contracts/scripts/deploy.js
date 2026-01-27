const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("=== ERC-3643 Security Token Deployment ===");
  console.log("Deployer:", deployer.address);
  console.log("Balance:", (await deployer.getBalance()).toString());

  // Deploy IdentityRegistry (replaces KYCRegistry)
  console.log("\n[1/5] Deploying IdentityRegistry...");
  const IdentityRegistry = await hre.ethers.getContractFactory("IdentityRegistry");
  const identityRegistry = await IdentityRegistry.deploy();
  await identityRegistry.deployed();
  console.log("✓ IdentityRegistry deployed to:", identityRegistry.address);

  // Deploy TrustedIssuersRegistry
  console.log("\n[2/5] Deploying TrustedIssuersRegistry...");
  const TrustedIssuersRegistry = await hre.ethers.getContractFactory("TrustedIssuersRegistry");
  const trustedIssuersRegistry = await TrustedIssuersRegistry.deploy();
  await trustedIssuersRegistry.deployed();
  console.log("✓ TrustedIssuersRegistry deployed to:", trustedIssuersRegistry.address);

  // Deploy ComplianceModule
  console.log("\n[3/5] Deploying ComplianceModule...");
  const ComplianceModule = await hre.ethers.getContractFactory("ComplianceModule");
  const complianceModule = await ComplianceModule.deploy(identityRegistry.address);
  await complianceModule.deployed();
  console.log("✓ ComplianceModule deployed to:", complianceModule.address);

  // Deploy FundFactory
  console.log("\n[4/5] Deploying FundFactory...");
  const FundFactory = await hre.ethers.getContractFactory("FundFactory");
  const fundFactory = await FundFactory.deploy(
    identityRegistry.address,
    complianceModule.address
  );
  await fundFactory.deployed();
  console.log("✓ FundFactory deployed to:", fundFactory.address);

  // Deploy sample FundTokenERC3643 (for demo purposes)
  console.log("\n[5/5] Deploying Demo FundTokenERC3643...");
  const FundTokenERC3643 = await hre.ethers.getContractFactory("FundTokenERC3643");
  const fundToken = await FundTokenERC3643.deploy(
    "Demo Fund Token",
    "DFT3643",
    identityRegistry.address,
    complianceModule.address
  );
  await fundToken.deployed();
  console.log("✓ Demo FundTokenERC3643 deployed to:", fundToken.address);

  // Initial configuration
  console.log("\n=== Initial Configuration ===");
  
  console.log("Registering deployer identity...");
  const tx1 = await identityRegistry.registerIdentity(deployer.address, 840);
  await tx1.wait();
  console.log("✓ Deployer registered (Country: USA - 840)");

  console.log("Adding KYC claim to deployer...");
  const CLAIM_KYC_VERIFIED = 2;
  const tx2 = await identityRegistry.addClaim(deployer.address, CLAIM_KYC_VERIFIED);
  await tx2.wait();
  console.log("✓ KYC claim added");

  console.log("Enabling compliance restrictions...");
  const tx3 = await complianceModule.enableRestrictions(fundToken.address);
  await tx3.wait();
  console.log("✓ Compliance enabled");

  console.log("Setting max holders to 100...");
  const tx4 = await complianceModule.setMaxHolders(fundToken.address, 100);
  await tx4.wait();
  console.log("✓ Max holders configured");

  console.log("Allowing USA (840)...");
  const tx5 = await complianceModule.allowCountry(fundToken.address, 840);
  await tx5.wait();
  console.log("✓ USA allowed");

  console.log("Approving deployer as GP in FundFactory...");
  const tx6 = await fundFactory.approveGP(deployer.address);
  await tx6.wait();
  console.log("✓ Deployer approved as GP");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    standard: "ERC-3643",
    contracts: {
      IdentityRegistry: {
        address: identityRegistry.address,
      },
      TrustedIssuersRegistry: {
        address: trustedIssuersRegistry.address,
      },
      ComplianceModule: {
        address: complianceModule.address,
      },
      FundFactory: {
        address: fundFactory.address,
      },
      FundTokenERC3643: {
        address: fundToken.address,
        name: "Demo Fund Token",
        symbol: "DFT3643",
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
  console.log(`\n✓ Deployment info saved to: ${deploymentPath}`);

  // Copy ABIs to shared location for backend/frontend
  const sharedDir = path.join(__dirname, "../../shared/contracts");
  if (!fs.existsSync(sharedDir)) {
    fs.mkdirSync(sharedDir, { recursive: true });
  }

  // Get ABIs from artifacts
  const identityRegistryArtifact = await hre.artifacts.readArtifact("IdentityRegistry");
  const trustedIssuersRegistryArtifact = await hre.artifacts.readArtifact("TrustedIssuersRegistry");
  const complianceModuleArtifact = await hre.artifacts.readArtifact("ComplianceModule");
  const fundFactoryArtifact = await hre.artifacts.readArtifact("FundFactory");
  const fundTokenArtifact = await hre.artifacts.readArtifact("FundTokenERC3643");

  const sharedContracts = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    standard: "ERC-3643",
    contracts: {
      IdentityRegistry: {
        address: identityRegistry.address,
        abi: identityRegistryArtifact.abi,
      },
      TrustedIssuersRegistry: {
        address: trustedIssuersRegistry.address,
        abi: trustedIssuersRegistryArtifact.abi,
      },
      ComplianceModule: {
        address: complianceModule.address,
        abi: complianceModuleArtifact.abi,
      },
      FundFactory: {
        address: fundFactory.address,
        abi: fundFactoryArtifact.abi,
      },
      FundTokenERC3643: {
        address: fundToken.address,
        abi: fundTokenArtifact.abi,
      },
    },
  };

  const sharedPath = path.join(sharedDir, "deployed.json");
  fs.writeFileSync(sharedPath, JSON.stringify(sharedContracts, null, 2));
  console.log(`✓ Shared contract info saved to: ${sharedPath}`);

  console.log("\n=== Deployment Complete ===");
  console.log("IdentityRegistry:        ", identityRegistry.address);
  console.log("TrustedIssuersRegistry:  ", trustedIssuersRegistry.address);
  console.log("ComplianceModule:        ", complianceModule.address);
  console.log("FundFactory:             ", fundFactory.address);
  console.log("Demo FundTokenERC3643:   ", fundToken.address);
  console.log("\nNext steps:");
  console.log("1. Update backend to use FundFactory for fund creation");
  console.log("2. Register user identities via IdentityRegistry");
  console.log("3. Configure compliance rules per fund");
  console.log("4. Use FundFactory.createFund() to deploy new fund tokens");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
