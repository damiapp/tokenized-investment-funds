# Database Seeding Guide

This directory contains scripts for seeding the database with demo data for the Tokenized Investment Funds platform.

## 📁 Files

### `seed.js` - Main Seed Script
Comprehensive seed file that creates:
- **Users**: 1 GP and 3 LPs with proper wallet addresses
- **KYC Status**: Approved for GP and 2 LPs, pending for 1 LP
- **Funds**: 3 funds (2 deployed to blockchain, 1 database-only)
- **Investments**: Multiple investments with confirmed/pending status
- **Portfolio Companies**: 8 companies registered on blockchain

### `clean-db.js` - Database Cleanup Script
Removes all data from the database to prepare for fresh seeding.

## 🚀 Usage

### Prerequisites

1. **PostgreSQL database** must be running
2. **Hardhat node** must be running on `http://localhost:8545`
3. **Smart contracts** must be deployed
4. **Backend server** should be running (for portfolio companies API)

### Step 1: Clean Database (Optional)

If you want to start fresh, clean the database first:

```bash
cd backend
node src/seeders/clean-db.js
```

### Step 2: Run Seed Script

```bash
cd backend
node src/seeders/seed.js
```

## 📊 Seeded Data

### Users

| Email | Password | Role | KYC Status | Wallet Address |
|-------|----------|------|------------|----------------|
| gp@demo.com | password123 | GP | Approved | 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 |
| lp1@demo.com | password123 | LP | Approved | 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 |
| lp2@demo.com | password123 | LP | Approved | 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC |
| lp3@demo.com | password123 | LP | Pending | 0x90F79bf6EB2c4f870365E785982E1f101E93b906 |

### Funds

| Name | Target | Min Investment | Risk | Deployed | Token Symbol | Can Accept Investments |
|------|--------|----------------|------|----------|--------------|------------------------|
| Tech Ventures Fund | $1,000,000 | $10,000 | High | ✅ Yes | TVF | ✅ Yes |
| Sustainable Energy Fund | $750,000 | $15,000 | Medium | ✅ Yes | SEF | ✅ Yes |
| Healthcare Innovation Fund | $500,000 | $5,000 | Medium | ❌ No | HIF | ❌ No |

**Deployment Status:**
- **Tech Ventures Fund** & **Sustainable Energy Fund**: Deployed to blockchain via FundFactory and registered in InvestmentContract. Ready for investments.
- **Healthcare Innovation Fund**: Database-only fund (not deployed). Used for testing undeployed fund scenarios. **Cannot accept investments** until deployed.

### Investments

- **Tech Ventures Fund**: $90,000 raised
  - LP1: $50,000 (pending)
  - LP2: $25,000 (confirmed, on-chain)

- **Sustainable Energy Fund**: $50,000 raised
  - LP1: $30,000 (confirmed, on-chain)
  - LP2: $20,000 (pending)
  
**Note:** The Healthcare Innovation Fund investment was created in the database for testing purposes, but in production, the backend now **prevents** investments in undeployed funds.

### Portfolio Companies

8 companies registered on blockchain:
- NeuralTech AI (Artificial Intelligence)
- BlockChain Solutions (Blockchain)
- CloudScale SaaS (Cloud Computing)
- BioGen Therapeutics (Biotechnology)
- SolarWave Energy (Solar Energy)
- WindTech Systems (Wind Energy)
- PayFlow Fintech (Payments)
- HealthHub Digital (Digital Health)

## 🔧 Customization

To modify the seed data, edit `seed.js`:

- **Add more users**: Extend the `lpUsers` array
- **Add more funds**: Extend the `fundsData` array
- **Add more investments**: Extend the `investmentsData` array
- **Add more companies**: Extend the `companies` array

## ⚠️ Important Notes

1. **Hardhat Accounts**: The wallet addresses correspond to Hardhat's default accounts. Make sure you're using the same mnemonic.

2. **Blockchain Deployment**: Funds marked with `deploy: true` will be deployed to the blockchain via FundFactory **AND** registered in InvestmentContract. This requires:
   - Hardhat node running
   - Contracts deployed
   - GP approved in FundFactory
   - **Two separate fund IDs**: FundFactory ID and InvestmentContract ID (tracked separately)

3. **Investment Restrictions** ⚠️ **NEW**:
   - **Backend validation** prevents investments in undeployed funds
   - **Frontend UI** shows warning message for undeployed funds
   - **Invest button** is disabled for funds without `contractAddress` or `onChainFundId`
   - GPs see "Deploy to Blockchain" button instead of "Close Fund" for undeployed funds

4. **On-Chain Investments**: Investments are recorded on-chain only if:
   - The fund is deployed (`contractAddress` exists)
   - The fund is registered in InvestmentContract (`investmentContractFundId` exists)
   - Investment status is "confirmed"
   - LP has a wallet address

5. **Portfolio Companies**: Created via API endpoint, which registers them on the blockchain. Requires backend server to be running.

6. **Fund Deployment Process**:
   - Step 1: Deploy via FundFactory → Gets `onChainFundId` and `contractAddress`
   - Step 2: Register in InvestmentContract → Gets `investmentContractFundId`
   - Step 3: Fund is ready to accept investments
   - **Note**: The seed script handles both steps automatically for funds with `deploy: true`

## 🐛 Troubleshooting

### "Contract service not initialized"
- Make sure Hardhat node is running
- Verify contracts are deployed
- Check `shared/contracts/deployed.json` exists

### "Failed to approve GP in FundFactory"
- Ensure contracts are deployed correctly
- Check GP wallet address matches Hardhat account #0

### "Portfolio company seeding failed"
- Backend server must be running on `http://localhost:3001`
- GP must be logged in (handled automatically by script)

### "Foreign key constraint violation"
- Run `clean-db.js` first to remove all data
- Then run `seed.js` fresh

## 📝 Migration from Old Seeds

The old seed files (`demo-seed.js`, `comprehensive-seed.js`, `seed-portfolio-companies.js`) have been replaced by this unified `seed.js` file.

**Key improvements:**
- ✅ Proper blockchain deployment via FundFactory
- ✅ On-chain investment recording
- ✅ Realistic test scenarios (pending KYC, undeployed funds)
- ✅ Better error handling and logging
- ✅ Single source of truth for all seed data

## 🔄 Resetting Everything

To completely reset and reseed:

```bash
# 1. Clean database
node src/seeders/clean-db.js

# 2. Restart Hardhat node (in contracts directory)
cd ../contracts
npx hardhat node

# 3. Redeploy contracts (in new terminal)
npx hardhat run scripts/deploy.js --network localhost

# 4. Run seed
cd ../backend
node src/seeders/seed.js
```
