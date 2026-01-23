# Tokenized Investment Funds Platform

A blockchain-based platform for General Partners (GPs) and Limited Partners (LPs) that enables fund creation, KYC verification, investments, and tokenized ownership representation.

## Tech Stack

- **Frontend:** React + TypeScript + ethers.js
- **Backend:** Node.js + Express + PostgreSQL + Sequelize
- **Blockchain:** Solidity + Hardhat + Polygon
- **Smart Contracts:** KYCRegistry, FundToken (ERC-20)

## Prerequisites

- Node.js (v14+) and npm
- PostgreSQL (v12+)
- MetaMask browser extension

## Local Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd tokenized-investment-funds
npm install
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb tokenized_funds

# Or using psql:
psql -U postgres
CREATE DATABASE tokenized_funds;
\q
```

### 3. Smart Contracts Setup

```bash
cd contracts
npm install

# Start local Hardhat node (keep this running)
npx hardhat node

# In a new terminal, deploy contracts
npm run deploy:local
```

### 4. Backend Setup

```bash
cd backend
npm install

# Configure environment variables
cp .env.example .env
# Edit .env and set:
# - DATABASE_URL with your PostgreSQL password
# - JWT_SECRET (any random string)
# - RPC_URL=http://127.0.0.1:8545
# - DEPLOYER_PRIVATE_KEY (from Hardhat node output)

# Start backend server
npm run dev
# → Backend running on http://localhost:3001
```

### 5. Frontend Setup

```bash
cd frontend
npm install

# Start frontend
npm start
# → Frontend running on http://localhost:3000
```

### 6. MetaMask Configuration

1. Open MetaMask and add a custom network:
   - **Network Name:** Hardhat Local
   - **RPC URL:** http://127.0.0.1:8545
   - **Chain ID:** 1337
   - **Currency Symbol:** ETH

2. Import a test account using a private key from the Hardhat node output

### 7. Demo Users

The platform seeds demo users on first run:
- **GP (Fund Manager):** `gp@demo.com` / `password123`
- **LP (Investor):** `lp@demo.com` / `password123`
- **LP2 (Investor):** `lp2@demo.com` / `password123`

## Features

- **Authentication & Authorization:** JWT-based auth with role-based access (GP/LP)
- **KYC Verification:** Document upload with on-chain enforcement via smart contracts
- **Fund Management:** Create, browse, and manage investment funds
- **Investment Flow:** Submit investments with wallet validation and token minting
- **Tokenization:** ERC-20 tokens representing fund ownership
- **Portfolio Tracking:** View investments and on-chain token balances
- **Multi-Fund Support:** Each fund has its own token contract

## Testing

```bash
# Backend tests
cd backend
npm test

# Run specific test suites
npm run test:auth
npm run test:coverage
```

## Project Structure

```
├── contracts/          # Solidity smart contracts
├── backend/           # Express API server
├── frontend/          # React TypeScript app
├── shared/            # Shared contract artifacts
```
