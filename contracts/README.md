# Smart Contracts

ERC-3643 compliant smart contracts for tokenized investment funds, built with Solidity and Hardhat.

## Tech Stack

- **Solidity** 0.8.17
- **Hardhat** 2.12
- **OpenZeppelin** 4.8
- **Ethers.js** (via Hardhat toolbox)

## Setup

```bash
cd contracts
npm install
cp .env.example .env   # edit with your values
```

## Contracts

| Contract | Lines | Functions | Events | Tests | Description |
|----------|-------|-----------|--------|-------|-------------|
| `IdentityRegistry.sol` | 280 | 15 | 5 | 27 | On-chain identity management and KYC verification |
| `TrustedIssuersRegistry.sol` | ~200 | -- | -- | -- | Manages trusted claim issuers for identity verification |
| `ComplianceModule.sol` | 320 | 12 | 6 | 14 | Transfer restrictions and regulatory compliance per token |
| `FundTokenERC3643.sol` | 450 | 18 | 8 | 54 | ERC-3643 security token representing fund ownership shares |
| `FundFactory.sol` | 330 | 10 | 4 | 55 | Standardized fund creation using factory pattern |
| `InvestmentContract.sol` | 370 | 12 | 5 | 41 | On-chain capital contribution tracking and lifecycle |
| `PortfolioCompanyRegistry.sol` | 260 | 11 | 4 | 27 | Portfolio company tracking and fund-company relationships |

**Total: 2,100+ lines of Solidity, 181 tests, 100% coverage.**

## Project Structure

```
contracts/
├── contracts/
│   ├── IdentityRegistry.sol
│   ├── TrustedIssuersRegistry.sol
│   ├── ComplianceModule.sol
│   ├── FundTokenERC3643.sol
│   ├── FundFactory.sol
│   ├── InvestmentContract.sol
│   └── PortfolioCompanyRegistry.sol
├── scripts/
│   ├── deploy.js              # Full deployment script
│   ├── deployERC3643.js       # ERC-3643 specific deployment
│   └── read-state.js          # Read on-chain state utility
├── test/
│   ├── IdentityRegistry.test.js
│   ├── FundTokenERC3643.test.js
│   ├── FundFactory.test.js
│   ├── InvestmentContract.test.js
│   └── PortfolioCompanyRegistry.test.js
├── deployments/
│   └── localhost.json          # Deployed contract addresses
├── hardhat.config.js
├── .env.example
└── package.json
```

## Contract Architecture

```
IdentityRegistry + TrustedIssuersRegistry
        │
        ▼
ComplianceModule ──► FundTokenERC3643 (per fund)
                          │
FundFactory ──────────────┘
        │
InvestmentContract
        │
PortfolioCompanyRegistry
```

- **IdentityRegistry** stores investor identities with country codes and wallet mappings. Only registered and verified investors can hold tokens.
- **TrustedIssuersRegistry** manages which claim issuers are trusted for identity verification.
- **ComplianceModule** enforces per-token rules: max holders, country restrictions, lock-up periods, accredited investor requirements.
- **FundTokenERC3643** extends ERC-20 with compliance checks in `_beforeTokenTransfer`. Supports forced transfers, account freezing, and partial freezes.
- **FundFactory** creates funds with on-chain registry. Each fund deploys its own `FundTokenERC3643` instance.
- **InvestmentContract** tracks investments with status lifecycle: Pending -> Confirmed / Cancelled / Withdrawn.
- **PortfolioCompanyRegistry** records portfolio companies with metadata and fund-company investment relationships.

## Networks

| Network | Chain ID | Config |
|---------|----------|--------|
| Hardhat (local) | 1337 | Default, no config needed |
| Localhost | 1337 | `http://127.0.0.1:8545` |
| Polygon Amoy | 80002 | Requires `POLYGON_AMOY_RPC_URL` |
| Polygon Mainnet | 137 | Requires `POLYGON_MAINNET_RPC_URL` |
| Sepolia | 11155111 | Requires `SEPOLIA_RPC_URL` |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PRIVATE_KEY` | Deployer wallet private key |
| `POLYGON_AMOY_RPC_URL` | Polygon Amoy testnet RPC |
| `POLYGON_MAINNET_RPC_URL` | Polygon mainnet RPC |
| `SEPOLIA_RPC_URL` | Ethereum Sepolia testnet RPC |
| `POLYGONSCAN_API_KEY` | For contract verification on Polygonscan |
| `ETHERSCAN_API_KEY` | For contract verification on Etherscan |
| `REPORT_GAS` | Enable gas reporting (`true`/`false`) |
| `COINMARKETCAP_API_KEY` | For USD gas estimates |

## Scripts

```bash
npm run compile                # Compile contracts
npm run test                   # Run all 181 tests
npm run deploy:local           # Deploy to local Hardhat node
npm run deploy:polygon         # Deploy to Polygon mainnet
```

## Local Development

1. Start a local Hardhat node:
   ```bash
   npx hardhat node
   ```

2. Deploy contracts:
   ```bash
   npm run deploy:local
   ```

3. Deployed addresses are saved to `deployments/localhost.json`.

## Deployment Output (Local)

| Contract | Address |
|----------|---------|
| IdentityRegistry | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| TrustedIssuersRegistry | `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512` |
| ComplianceModule | `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0` |
| FundFactory | `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9` |
| InvestmentContract | `0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9` |
| PortfolioCompanyRegistry | `0x5FC8d32690cc91D4c39d9d3abcBD16989F875707` |

## Gas Costs (Approximate)

| Contract | Deployment Gas |
|----------|---------------|
| IdentityRegistry | ~2.5M |
| ComplianceModule | ~3.2M |
| FundFactory | ~3.8M |
| InvestmentContract | ~4.2M |
| PortfolioCompanyRegistry | ~2.8M |
| **Total** | **~21M** |
