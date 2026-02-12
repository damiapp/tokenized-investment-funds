# Backend API

Node.js/Express REST API for the tokenized investment funds platform. Handles authentication, fund management, investments, KYC processing, and blockchain integration.

## Tech Stack

- **Node.js** 18 LTS
- **Express.js** 4.18
- **PostgreSQL** 14 + Sequelize 6 ORM
- **Ethers.js** 5.7 (blockchain communication)
- **JWT** + **bcryptjs** (authentication)

## Setup

```bash
cd backend
npm install
cp .env.example .env   # edit with your values
npm run dev
```

The server starts on `http://localhost:3001` by default.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://postgres:postgres@localhost:5432/tokenized_funds` |
| `JWT_SECRET` | Secret for JWT signing | (required) |
| `JWT_EXPIRES_IN` | Token expiry | `7d` |
| `RPC_URL` | Blockchain RPC endpoint | `http://127.0.0.1:8545` |
| `DEPLOYER_PRIVATE_KEY` | Admin wallet private key | Hardhat account #0 |
| `CHAIN_ID` | Expected chain ID | `1337` |
| `MAX_GAS_PRICE_GWEI` | Gas price limit | `100` |
| `GAS_LIMIT_MULTIPLIER` | Gas buffer | `1.2` |

## Project Structure

```
backend/
├── src/
│   ├── index.js                    # Express app entry point
│   ├── controllers/
│   │   ├── authController.js       # Registration, login, JWT, wallet
│   │   ├── fundController.js       # Fund CRUD, blockchain deploy, analytics
│   │   ├── investmentController.js # Investments, status updates, token minting
│   │   ├── kycController.js        # KYC submission, approval, blockchain sync
│   │   └── portfolioController.js  # Portfolio companies, fund investments
│   ├── routes/
│   │   ├── auth.js                 # POST /auth/register, /auth/login, etc.
│   │   ├── funds.js                # POST /funds, GET /funds, /funds/:id/deploy
│   │   ├── investments.js          # POST /investments, PUT /investments/:id/status
│   │   ├── kyc.js                  # POST /kyc/submit, PUT /kyc/:userId/approve
│   │   ├── portfolio.js            # POST /portfolio/companies, GET /portfolio/fund/:fundId
│   │   ├── transactions.js         # GET /transactions (filtering, sorting, CSV)
│   │   ├── identity.js             # On-chain identity registration and claims
│   │   ├── compliance.js           # Compliance config and transfer checks
│   │   ├── contracts.js            # Smart contract info and token balances
│   │   └── health.js               # System health checks
│   ├── models/
│   │   ├── User.js                 # id, email, passwordHash, role (GP/LP), walletAddress
│   │   ├── Fund.js                 # id, name, gpId, targetAmount, status, tokenSymbol, ...
│   │   ├── Investment.js           # id, fundId, lpId, amount, tokensIssued, status, ...
│   │   ├── KycStatus.js            # id, userId, fullName, nationality, documentType, status
│   │   ├── database.js             # Sequelize connection
│   │   └── index.js                # Model associations
│   ├── services/
│   │   ├── contracts/
│   │   │   ├── index.js            # Main blockchain integration (24KB)
│   │   │   ├── fundFactoryService.js
│   │   │   ├── identityService.js
│   │   │   ├── investmentService.js
│   │   │   └── portfolioService.js
│   │   ├── eventListener.js        # Blockchain event listener + DB sync
│   │   ├── jwt.js                  # JWT generation and verification
│   │   └── password.js             # bcrypt hashing
│   ├── middleware/
│   │   ├── auth.js                 # JWT authentication middleware
│   │   └── upload.js               # File upload (multer)
│   ├── seeders/
│   │   ├── seed.js                 # Full demo data seeder
│   │   ├── clean-db.js             # Database cleanup
│   │   └── README.md               # Seeder documentation
│   └── migrations/
├── test/
│   ├── unit/                       # Unit tests (auth, models, services, kyc, funds, investments)
│   ├── api/                        # API endpoint tests
│   ├── database/                   # Database tests
│   ├── debug/                      # Debug utilities
│   └── README.md                   # Test documentation
└── package.json
```

## API Endpoints (30+)

| Category | Count | Examples |
|----------|-------|---------|
| Authentication | 5 | `POST /auth/register`, `POST /auth/login`, `GET /auth/profile` |
| KYC | 5 | `POST /kyc/submit`, `PUT /kyc/:userId/approve` |
| Funds | 7 | `POST /funds`, `GET /funds`, `POST /funds/:id/deploy` |
| Investments | 6 | `POST /investments`, `PUT /investments/:id/status` |
| Portfolio | 7 | `POST /portfolio/companies`, `GET /portfolio/fund/:fundId` |
| Transactions | -- | `GET /transactions` with filtering, sorting, CSV export |
| Identity | -- | On-chain identity registration and claim management |
| Compliance | -- | Compliance configuration and transfer verification |
| Health | -- | System health checks |

## Key Flows

1. **Fund Creation**: GP submits form -> backend creates DB record -> calls `FundFactory.createFund()` -> deploys `FundTokenERC3643` -> stores on-chain fund ID and token address.

2. **KYC Approval**: Admin approves KYC -> backend calls `IdentityRegistry.registerIdentity()` -> adds KYC claim on-chain -> user can now receive tokens.

3. **Investment Confirmation**: GP confirms investment -> backend calls `InvestmentContract` -> mints `FundTokenERC3643` tokens to LP wallet -> records transaction hash.

## Scripts

```bash
npm run dev          # Start with nodemon
npm run start        # Production start
npm run test         # Run all tests
npm run test:coverage # Tests with coverage
npm run seed:demo    # Seed demo data
```

## Database

Requires PostgreSQL. Create the database:

```sql
CREATE DATABASE tokenized_funds;
```

Models sync automatically on startup via Sequelize.
