const hre = require("hardhat");
const { ethers } = hre;
const deployed = require("../../shared/contracts/deployed.json");

const STATUS_MAP = ["Pending", "Confirmed", "Cancelled", "Withdrawn"];

async function main() {
  const [deployer] = await ethers.getSigners();
  const fmt = ethers.utils.formatEther;

  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║           ON-CHAIN STATE — FULL CONTRACT READ               ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log(`\nReader: ${deployer.address}`);
  console.log(`Network: ${deployed.network} (chainId: ${deployed.chainId})`);
  console.log(`Standard: ${deployed.standard}`);

  // ─────────────────────────────────────────────────────────────
  // 1. IDENTITY REGISTRY
  // ─────────────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(60));
  console.log("1. IDENTITY REGISTRY");
  console.log("═".repeat(60));
  const identity = await ethers.getContractAt("IdentityRegistry", deployed.contracts.IdentityRegistry.address);
  console.log(`  Address: ${identity.address}`);
  console.log(`  Owner: ${await identity.owner()}`);

  const identityCount = await identity.getRegisteredIdentitiesCount();
  console.log(`  Registered Identities: ${identityCount}`);

  for (let i = 0; i < identityCount; i++) {
    const addr = await identity.getRegisteredIdentityAt(i);
    const verified = await identity.isVerified(addr);
    let country = "N/A";
    try { country = (await identity.getCountry(addr)).toString(); } catch {}
    const hasKyc = await identity.hasClaim(addr, 2); // CLAIM_KYC_VERIFIED = 2
    const hasAccredited = await identity.hasClaim(addr, 1); // CLAIM_ACCREDITED_INVESTOR = 1
    const linkedWallet = await identity.linkedWallets(addr);
    const resolvedIdentity = await identity.getIdentity(addr);

    console.log(`\n  Identity #${i}: ${addr}`);
    console.log(`    Verified: ${verified}`);
    console.log(`    Country Code: ${country}`);
    console.log(`    KYC Claim (topic 2): ${hasKyc}`);
    console.log(`    Accredited Claim (topic 1): ${hasAccredited}`);
    console.log(`    Linked Wallet: ${linkedWallet === ethers.constants.AddressZero ? "None" : linkedWallet}`);
    console.log(`    Resolved Identity: ${resolvedIdentity}`);
  }

  // ─────────────────────────────────────────────────────────────
  // 2. TRUSTED ISSUERS REGISTRY
  // ─────────────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(60));
  console.log("2. TRUSTED ISSUERS REGISTRY");
  console.log("═".repeat(60));
  const issuers = await ethers.getContractAt("TrustedIssuersRegistry", deployed.contracts.TrustedIssuersRegistry.address);
  console.log(`  Address: ${issuers.address}`);
  console.log(`  Owner: ${await issuers.owner()}`);

  const issuerCount = await issuers.getTrustedIssuersCount();
  console.log(`  Total Issuers Registered: ${issuerCount}`);

  const activeIssuers = await issuers.getTrustedIssuers();
  console.log(`  Active Issuers: ${activeIssuers.length}`);

  for (let i = 0; i < issuerCount; i++) {
    const issuerAddr = await issuers.getTrustedIssuerAt(i);
    const info = await issuers.getTrustedIssuer(issuerAddr);
    console.log(`\n  Issuer #${i}: ${issuerAddr}`);
    console.log(`    Name: ${info.name}`);
    console.log(`    Active: ${info.active}`);
    console.log(`    Exists: ${info.exists}`);
    console.log(`    Claim Topics: [${info.claimTopics.map(t => t.toString()).join(", ")}]`);
  }

  // ─────────────────────────────────────────────────────────────
  // 3. FUND FACTORY
  // ─────────────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(60));
  console.log("3. FUND FACTORY");
  console.log("═".repeat(60));
  const factory = await ethers.getContractAt("FundFactory", deployed.contracts.FundFactory.address);
  console.log(`  Address: ${factory.address}`);
  console.log(`  Owner: ${await factory.owner()}`);
  console.log(`  Identity Registry: ${await factory.identityRegistry()}`);
  console.log(`  Compliance Module: ${await factory.complianceModule()}`);

  const fundCount = await factory.getFundCount();
  console.log(`  Total Funds: ${fundCount}`);

  // Check GP approval for deployer
  const deployerApproved = await factory.isApprovedGP(deployer.address);
  console.log(`  Deployer GP Approved: ${deployerApproved}`);

  // Collect token addresses for later
  const tokenAddresses = [];
  const gpAddresses = new Set();

  for (let i = 1; i <= fundCount; i++) {
    const fund = await factory.getFund(i);
    tokenAddresses.push(fund.tokenAddress);
    gpAddresses.add(fund.gp);

    const gpFunds = await factory.getFundsByGP(fund.gp);
    const fundIdByToken = await factory.getFundIdByToken(fund.tokenAddress);

    console.log(`\n  Fund #${i}: ${fund.name} (${fund.symbol})`);
    console.log(`    Token Address: ${fund.tokenAddress}`);
    console.log(`    GP: ${fund.gp}`);
    console.log(`    Target Amount: ${fmt(fund.targetAmount)} ETH`);
    console.log(`    Min Investment: ${fmt(fund.minimumInvestment)} ETH`);
    console.log(`    Created At: ${new Date(fund.createdAt.toNumber() * 1000).toISOString()}`);
    console.log(`    Active: ${fund.active}`);
    console.log(`    Fund ID by Token: ${fundIdByToken}`);
    console.log(`    GP's Fund IDs: [${gpFunds.map(f => f.toString()).join(", ")}]`);
  }

  // Check GP approvals
  console.log(`\n  --- GP Approvals ---`);
  for (const gp of gpAddresses) {
    const approved = await factory.isApprovedGP(gp);
    console.log(`    ${gp}: ${approved}`);
  }

  // Active funds
  try {
    const activeFunds = await factory.getActiveFunds(0, 100);
    console.log(`\n  Active Funds (paginated): ${activeFunds.length}`);
  } catch (e) {
    console.log(`\n  Active Funds query failed: ${e.message}`);
  }

  // ─────────────────────────────────────────────────────────────
  // 4. COMPLIANCE MODULE
  // ─────────────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(60));
  console.log("4. COMPLIANCE MODULE");
  console.log("═".repeat(60));
  const compliance = await ethers.getContractAt("ComplianceModule", deployed.contracts.ComplianceModule.address);
  console.log(`  Address: ${compliance.address}`);
  console.log(`  Owner: ${await compliance.owner()}`);
  console.log(`  Identity Registry: ${(await compliance.identityRegistry()).toString()}`);
  console.log(`  CLAIM_KYC_VERIFIED: ${await compliance.CLAIM_KYC_VERIFIED()}`);
  console.log(`  CLAIM_ACCREDITED_INVESTOR: ${await compliance.CLAIM_ACCREDITED_INVESTOR()}`);

  for (let i = 0; i < tokenAddresses.length; i++) {
    const token = tokenAddresses[i];
    const restricted = await compliance.isRestricted(token);
    const maxHolders = await compliance.getMaxHolders(token);
    const minHolding = await compliance.getMinHoldingPeriod(token);
    const accreditedReq = await compliance.isAccreditedRequired(token);
    const holders = await compliance.holderCount(token);
    const usaAllowed = await compliance.isCountryAllowed(token, 840);

    console.log(`\n  Token: ${token} (Fund #${i + 1})`);
    console.log(`    Restrictions Enabled: ${restricted}`);
    console.log(`    Max Holders: ${maxHolders}`);
    console.log(`    Current Holders: ${holders}`);
    console.log(`    Min Holding Period: ${minHolding}s`);
    console.log(`    Accredited Required: ${accreditedReq}`);
    console.log(`    USA (840) Allowed: ${usaAllowed}`);
  }

  // ─────────────────────────────────────────────────────────────
  // 5. INVESTMENT CONTRACT
  // ─────────────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(60));
  console.log("5. INVESTMENT CONTRACT");
  console.log("═".repeat(60));
  const investmentContract = await ethers.getContractAt("InvestmentContract", deployed.contracts.InvestmentContract.address);
  console.log(`  Address: ${investmentContract.address}`);
  console.log(`  Identity Registry: ${(await investmentContract.identityRegistry()).toString()}`);

  const invFundCount = await investmentContract.fundCount();
  const totalVolume = await investmentContract.totalInvestmentVolume();
  console.log(`  Registered Funds: ${invFundCount}`);
  console.log(`  Total Investment Volume: ${fmt(totalVolume)} ETH`);

  for (let i = 0; i < invFundCount; i++) {
    try {
      const fund = await investmentContract.getFund(i);
      const investmentCount = await investmentContract.getFundInvestmentCount(i);

      console.log(`\n  Investment Fund #${i}:`);
      console.log(`    Fund Token: ${fund.fundToken}`);
      console.log(`    GP: ${fund.gp}`);
      console.log(`    Target: ${fmt(fund.targetAmount)} ETH`);
      console.log(`    Raised: ${fmt(fund.raisedAmount)} ETH`);
      console.log(`    Min Investment: ${fmt(fund.minimumInvestment)} ETH`);
      console.log(`    Active: ${fund.active}`);
      console.log(`    Investor Count: ${fund.investorCount}`);
      console.log(`    Total Investments: ${investmentCount}`);

      // Read each investment
      for (let j = 0; j < investmentCount; j++) {
        const inv = await investmentContract.getInvestment(i, j);
        console.log(`\n    Investment #${j}:`);
        console.log(`      Investor: ${inv.investor}`);
        console.log(`      Fund Token: ${inv.fundToken}`);
        console.log(`      Amount: ${fmt(inv.amount)} ETH`);
        console.log(`      Token Amount: ${fmt(inv.tokenAmount)}`);
        console.log(`      Timestamp: ${new Date(inv.timestamp.toNumber() * 1000).toISOString()}`);
        console.log(`      Status: ${STATUS_MAP[inv.status] || inv.status}`);
        console.log(`      Tx Hash: ${inv.txHash}`);

        // Investor total in this fund
        const investorTotal = await investmentContract.getInvestorTotal(i, inv.investor);
        console.log(`      Investor Total in Fund: ${fmt(investorTotal)} ETH`);
      }
    } catch (e) {
      console.log(`\n  Investment Fund #${i}: Error - ${e.reason || e.message}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 6. PORTFOLIO COMPANY REGISTRY
  // ─────────────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(60));
  console.log("6. PORTFOLIO COMPANY REGISTRY");
  console.log("═".repeat(60));
  const portfolio = await ethers.getContractAt("PortfolioCompanyRegistry", deployed.contracts.PortfolioCompanyRegistry.address);
  console.log(`  Address: ${portfolio.address}`);

  const companyCount = await portfolio.companyCount();
  console.log(`  Total Companies: ${companyCount}`);

  const activeCompanyIds = await portfolio.getActiveCompanies();
  console.log(`  Active Companies: ${activeCompanyIds.length}`);

  for (let i = 0; i < companyCount; i++) {
    try {
      const company = await portfolio.getCompany(i);
      const totalInvested = await portfolio.getTotalInvestmentInCompany(i);
      const investments = await portfolio.getCompanyInvestments(i);

      console.log(`\n  Company #${i}: ${company.name}`);
      console.log(`    Industry: ${company.industry}`);
      console.log(`    Country: ${company.country}`);
      console.log(`    Founded: ${company.foundedYear}`);
      console.log(`    Registered By: ${company.registeredBy}`);
      console.log(`    Registered At: ${new Date(company.registeredAt.toNumber() * 1000).toISOString()}`);
      console.log(`    Active: ${company.active}`);
      console.log(`    Total Invested: ${fmt(totalInvested)} ETH`);
      console.log(`    Investment Records: ${investments.length}`);

      for (let j = 0; j < investments.length; j++) {
        const inv = investments[j];
        const equity = await portfolio.getFundEquityInCompany(inv.fundId, i);
        console.log(`\n      Investment #${j}:`);
        console.log(`        Fund ID: ${inv.fundId}`);
        console.log(`        Amount: ${fmt(inv.amount)} ETH`);
        console.log(`        Equity: ${inv.equityPercentage.toNumber() / 100}%`);
        console.log(`        Valuation: ${fmt(inv.valuation)} ETH`);
        console.log(`        Invested At: ${new Date(inv.investedAt.toNumber() * 1000).toISOString()}`);
        console.log(`        Active: ${inv.active}`);
        console.log(`        Fund Total Equity in Company: ${equity.toNumber() / 100}%`);
      }
    } catch (e) {
      console.log(`\n  Company #${i}: Error - ${e.reason || e.message}`);
    }
  }

  // Fund portfolios
  console.log(`\n  --- Fund Portfolios ---`);
  for (let i = 1; i <= fundCount; i++) {
    const portfolioCompanies = await portfolio.getFundPortfolio(i);
    console.log(`  Fund #${i} owns companies: [${portfolioCompanies.map(c => c.toString()).join(", ")}]`);
  }

  // ─────────────────────────────────────────────────────────────
  // 7. FUND TOKENS (ERC-3643)
  // ─────────────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(60));
  console.log("7. FUND TOKENS (ERC-3643)");
  console.log("═".repeat(60));

  // Collect all known addresses to check balances
  const knownAddresses = new Set([deployer.address]);
  for (let i = 0; i < identityCount; i++) {
    knownAddresses.add(await identity.getRegisteredIdentityAt(i));
  }
  for (const gp of gpAddresses) {
    knownAddresses.add(gp);
  }

  for (let i = 0; i < tokenAddresses.length; i++) {
    const tokenAddr = tokenAddresses[i];
    const token = await ethers.getContractAt("FundTokenERC3643", tokenAddr);

    const name = await token.name();
    const symbol = await token.symbol();
    const totalSupply = await token.totalSupply();
    const decimals = await token.decimals();
    const owner = await token.owner();
    const compEnabled = await token.complianceEnabled();
    const idReg = await token.identityRegistry();
    const compMod = await token.complianceModule();

    console.log(`\n  Token #${i + 1}: ${name} (${symbol})`);
    console.log(`    Address: ${tokenAddr}`);
    console.log(`    Owner: ${owner}`);
    console.log(`    Decimals: ${decimals}`);
    console.log(`    Total Supply: ${fmt(totalSupply)}`);
    console.log(`    Compliance Enabled: ${compEnabled}`);
    console.log(`    Identity Registry: ${idReg}`);
    console.log(`    Compliance Module: ${compMod}`);

    // Check balances for all known addresses
    console.log(`    --- Balances ---`);
    for (const addr of knownAddresses) {
      const balance = await token.balanceOf(addr);
      if (balance.gt(0)) {
        const available = await token.getAvailableBalance(addr);
        const frozenAmt = await token.frozenTokens(addr);
        const isFrozen = await token.frozen(addr);
        console.log(`      ${addr}:`);
        console.log(`        Balance: ${fmt(balance)}`);
        console.log(`        Available: ${fmt(available)}`);
        console.log(`        Frozen Tokens: ${fmt(frozenAmt)}`);
        console.log(`        Account Frozen: ${isFrozen}`);
      }
    }

    // Check if any known address has zero balance but is frozen
    for (const addr of knownAddresses) {
      const isFrozen = await token.frozen(addr);
      if (isFrozen) {
        const balance = await token.balanceOf(addr);
        if (balance.eq(0)) {
          console.log(`      ${addr}: Balance 0 but ACCOUNT FROZEN`);
        }
      }
    }
  }

  console.log("\n" + "═".repeat(60));
  console.log("DONE — All on-chain state read successfully.");
  console.log("═".repeat(60));
}

main().catch(console.error);