# Tokenized Investment Funds Platform (Master Thesis Prototype)

Prototype platform for **GP (General Partners)** and **LP (Limited Partners)** that digitizes fund creation, onboarding (KYC off-chain with on-chain enforcement), investing/capital contributions, and ownership representation via **tokenization**.

## Tech Stack

- **Frontend:** React + TypeScript + `ethers`
- **Backend:** Node.js + Express (PostgreSQL planned)
- **Smart contracts:** Solidity + Hardhat (planned)

## Repository Structure

- `frontend/` React app (wallet connect + backend health check)
- `backend/` Express API (currently includes `GET /health`)
- `contracts/` Hardhat project (scaffolding; smart contracts to be added)

## Prerequisites

- Node.js + npm
- (Optional, later) PostgreSQL
- (Optional) MetaMask (wallet) for the frontend demo

## Quick Start (Demo)

### 1) Backend

1. Install dependencies:
   - `cd backend`
   - `npm install`

2. Create env file:
   - Copy `backend/.env.example` to `backend/.env`

3. Run dev server:
   - `npm run dev`

Backend will run on:
- `http://localhost:3001`

Health check:
- `GET http://localhost:3001/health` -> `{ "ok": true }`

### 2) Frontend

1. Install dependencies:
   - `cd frontend`
   - `npm install`

2. Configure API base URL (optional):
   - Copy `frontend/.env.example` to `frontend/.env`
   - Default is `http://localhost:3001`

3. Start dev server:
   - `npm start`

Frontend will run on:
- `http://localhost:3000`

## What you can demo right now

- **Backend connectivity:** frontend calls `GET /health`
- **Wallet connection:** connect MetaMask and display address + chain id
- **Smart contracts:** KYCRegistry and FundToken contracts implemented with permissioned transfer logic

## Recent Development (Dec 26, 2025)

### Backend Implementation
- **Express server setup** with security middleware (helmet, cors, rate limiting)
- **Health check endpoint** (`GET /health`) returning `{ "ok": true }`
- **Error handling** with proper HTTP status codes and JSON responses
- **Environment configuration** support via `.env` files

### Frontend Implementation  
- **React + TypeScript** application with wallet connectivity
- **MetaMask integration** using ethers.js
- **Backend API integration** with health check functionality
- **Modern dark theme UI** with responsive design
- **Error handling** and loading states

### Smart Contracts Development
- **KYCRegistry contract**: On-chain identity verification system
  - `isVerified(address)` function to check verification status
  - `setVerified(address,bool)` admin function to manage verification
  - Event emissions for verification changes
- **FundToken contract**: Permissioned ERC-20 token with KYC enforcement
  - KYC-restricted transfers (both sender and receiver must be verified)
  - Minting functionality for fund managers
  - Integration with KYCRegistry for compliance
- **OpenZeppelin integration** for secure contract development

### Development Infrastructure
- **Hardhat development environment** configured for local testing
- **Contract compilation** and deployment scripts
- **Package.json scripts** for concurrent development across all components

## Next milestones

- Backend:
  - Auth (`/auth/register`, `/auth/login`)
  - KYC mock flow (`/kyc/submit`, `/kyc/webhook`)
  - Funds (`/funds`)
  - Investments (`/funds/:fundId/investments`)
- Contracts:
  - Contract deployment scripts and testing
  - Integration between backend and smart contracts
  - FundFactory contract for fund creation
  - InvestmentContract for managing contributions

## Notes

- Dependencies may report security warnings because some packages are older (CRA / WalletConnect v1). This is acceptable for a prototype demo; we can modernize later.
