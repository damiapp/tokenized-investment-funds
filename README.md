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

## Next milestones

- Backend:
  - Auth (`/auth/register`, `/auth/login`)
  - KYC mock flow (`/kyc/submit`, `/kyc/webhook`)
  - Funds (`/funds`)
  - Investments (`/funds/:fundId/investments`)
- Contracts:
  - `KYCRegistry` (on-chain identity status)
  - `FundToken` (permissioned token; ERC-3643-aligned)
  - Local deployment scripts + tests

## Notes

- Dependencies may report security warnings because some packages are older (CRA / WalletConnect v1). This is acceptable for a prototype demo; we can modernize later.
