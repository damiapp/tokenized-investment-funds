# Tokenized Investment Funds Platform — Project Context & Next Steps

## 1) What this project is (thesis context)

You are building a prototype platform for **GP (General Partners)** and **LP (Limited Partners)** that digitizes:
- fund creation
- onboarding (KYC off-chain, enforced on-chain)
- investing / capital contributions
- ownership representation via **tokenization**

Target blockchain infrastructure:
- **Ethereum / Polygon**
- tokenization using **ERC-3643** (permissioned / regulated token standard)

Planned contract modules (from the thesis description):
- **FundFactory** (create funds)
- **FundToken** (LP ownership token)
- **InvestmentContract** (manage contributions)
- **KYCRegistry** (on-chain identity status)
- **PortfolioCompanyRegistry** (portfolio companies)

Tech stack goal:
- **Frontend:** React
- **Backend:** Node.js + PostgreSQL
- **Smart contracts:** Solidity + Hardhat

---

## 2) Current repo state (right now)

### Root
- `package.json`
  - has scripts for running `frontend`, `backend`, and `contracts`
  - dev dependency: `concurrently`

### Folders
- `frontend/`
  - `package.json` exists (React deps + ethers/web3modal)
  - `src/` and `public/` folders exist but **no React source files yet**

- `backend/`
  - `package.json` exists (Express + Sequelize + pg + auth libs)
  - `src/` folder exists but **no server code yet**

- `contracts/`
  - `package.json` exists (Hardhat toolbox + OpenZeppelin + `@tokenys/erc-3643`)
  - `hardhat.config.js` exists
  - `scripts/` and `test/` folders exist
  - **No `contracts/` Solidity sources yet**

### Toolchain
- `node` is installed
- `npm` is installed

---

## 3) First steps — Frontend (React)

### Goal for phase 1
Get a minimal UI running that can:
- connect a wallet (MetaMask)
- display address + network
- call backend endpoints (health + later KYC status)

### Steps
1. Install deps
   - `cd frontend`
   - `npm install`

2. Create minimal React app files (so `npm start` works)
   - `frontend/public/index.html`
   - `frontend/src/index.tsx`
   - `frontend/src/App.tsx`

3. Implement Wallet Connect (simple)
   - Use `ethers` + injected provider (`window.ethereum`)
   - Display:
     - connected address
     - chainId

4. Add API client config
   - Decide backend URL (e.g. `http://localhost:3001`)
   - Add a simple `fetch('/health')` test call (or `axios` if you prefer)

5. UX pages (skeleton)
   - GP: Create fund (later)
   - LP: KYC status + Invest (later)
   - Funds list (later)

---

## 4) First steps — Backend (Node.js + PostgreSQL)

### Goal for phase 1
Get a minimal API running that can:
- serve `GET /health`
- store/read basic entities (GP profile, LP profile, fund)
- accept KYC result from an off-chain provider (mock at first)

### Steps
1. Install deps
   - `cd backend`
   - `npm install`

2. Create a minimal server entrypoint
   - `backend/src/index.js`
     - Express app
     - `helmet`, `cors`, JSON parsing
     - `GET /health` -> `{ ok: true }`

3. Environment setup
   - Create `backend/.env.example` with:
     - `PORT=3001`
     - `DATABASE_URL=postgres://...`
     - `JWT_SECRET=...`

4. Database approach (choose one)
   - Option A: Sequelize (already in deps)
     - create `backend/src/models/*`
     - add Sequelize config + migrations
   - Option B: Switch to Prisma (if you prefer stronger typing)

5. Minimal data model (phase 1)
   - **User** (id, role: GP/LP, email, passwordHash, walletAddress)
   - **Fund** (id, name, gpUserId, fundTokenAddress, createdAt)
   - **KycStatus** (userId, status: pending/approved/rejected, providerRef, updatedAt)

6. API endpoints (phase 1, more detailed)

### Conventions
- **Base URL (local):** `http://localhost:3001`
- **Auth:** JWT in header `Authorization: Bearer <token>`
- **Roles:** `GP` and `LP`
- **Common response envelope (recommended):**
  - success: `{ "data": ... }`
  - error: `{ "error": { "code": "...", "message": "...", "details": ... } }`

### Health

#### `GET /health`
- **Auth:** none
- **Response 200:**
  - `{ "ok": true }`

### Auth

#### `POST /auth/register`
- **Auth:** none
- **Body:**
  - `{ "email": string, "password": string, "role": "GP"|"LP", "walletAddress"?: string }`
- **Validation (minimum):**
  - `email` is unique
  - `password` length >= 8
  - `role` is `GP` or `LP`
- **Response 201:**
  - `{ "data": { "user": { "id": string, "email": string, "role": "GP"|"LP", "walletAddress": string|null }, "token": string } }`
- **Errors:**
  - `409` email already exists

#### `POST /auth/login`
- **Auth:** none
- **Body:**
  - `{ "email": string, "password": string }`
- **Response 200:**
  - `{ "data": { "token": string } }`
- **Errors:**
  - `401` invalid credentials

### Current user

#### `GET /me`
- **Auth:** required
- **Response 200:**
  - `{ "data": { "id": string, "email": string, "role": "GP"|"LP", "walletAddress": string|null, "kyc": { "status": "pending"|"approved"|"rejected", "updatedAt": string } } }`

### KYC (off-chain process, on-chain enforcement later)

#### `POST /kyc/submit`
- **Auth:** required (LP)
- **Purpose:** start KYC (mock flow first)
- **Body (mock/minimal):**
  - `{ "provider": "mock", "payload": { ... } }`
- **Response 202:**
  - `{ "data": { "status": "pending" } }`

#### `POST /kyc/webhook`
- **Auth:** none (protected by a shared secret header in real life)
- **Purpose:** simulate KYC provider callback
- **Headers (recommended):**
  - `X-KYC-Signature: <signature>` (or `X-KYC-Secret: <secret>` for local)
- **Body (suggested):**
  - `{ "userId": string, "status": "approved"|"rejected", "providerRef"?: string }`
- **Response 200:**
  - `{ "data": { "ok": true } }`
- **Next integration step:** if `approved`, backend will later call the on-chain `KYCRegistry.setVerified(wallet,true)`.

### Funds

#### `POST /funds`
- **Auth:** required (GP)
- **Body:**
  - `{ "name": string, "symbol": string, "chain": "hardhat"|"polygon"|"ethereum", "targetSize"?: string }`
- **Response 201:**
  - `{ "data": { "fund": { "id": string, "name": string, "symbol": string, "gpUserId": string, "fundTokenAddress": string|null, "createdAt": string } } }`
- **Notes:**
  - In phase 1, `fundTokenAddress` can be `null` until contracts are deployed.

#### `GET /funds`
- **Auth:** optional (if you want public listing) or required (if you want only logged-in users)
- **Query params (suggested):**
  - `gpUserId` (filter)
  - `limit`, `offset`
- **Response 200:**
  - `{ "data": { "items": [ { "id": string, "name": string, "symbol": string, "fundTokenAddress": string|null } ], "total": number } }`

#### `GET /funds/:fundId`
- **Auth:** optional/required (same policy as listing)
- **Response 200:**
  - `{ "data": { "id": string, "name": string, "symbol": string, "fundTokenAddress": string|null, "gp": { "id": string, "email": string }, "portfolioCompanies": [ ... ] } }`

### Investing (phase 1 mock; phase 2 on-chain)

#### `POST /funds/:fundId/investments`
- **Auth:** required (LP)
- **Body (phase 1):**
  - `{ "amount": string, "txHash"?: string }`
- **Response 201:**
  - `{ "data": { "investment": { "id": string, "fundId": string, "lpUserId": string, "amount": string, "status": "pending"|"confirmed"|"rejected" } } }`

#### `GET /funds/:fundId/investments`
- **Auth:** required
- **Policy (suggested):**
  - GP sees all investments in own fund
  - LP sees only own investments
- **Response 200:**
  - `{ "data": { "items": [ ... ] } }`

---

## 5) First steps — Tokenization / Smart Contracts (Hardhat + ERC-3643)

### Goal for phase 1
Be able to:
- compile contracts
- deploy to local Hardhat network
- deploy a permissioned token (ERC-3643-based)
- enforce transfer restrictions based on an on-chain identity registry

### Immediate fixes / notes
- `contracts/hardhat.config.js` calls `require("dotenv").config()`
  - so `contracts/package.json` should include **dotenv** in devDependencies.

### Steps
1. Install deps
   - `cd contracts`
   - `npm install`

2. Add Solidity sources folder
   - create `contracts/contracts/`

3. Start with a thin “vertical slice” (not full system yet)
   - **KYCRegistry.sol**
     - mapping(address => bool) isVerified
     - setVerified(address,bool) restricted to an admin
   - **FundToken.sol**
     - ERC-3643 / permissioned token (or simplified token with transfer hooks)
     - transfer should require `KYCRegistry.isVerified(from)` and `isVerified(to)`

4. Deployment script
   - `contracts/scripts/deploy.js`
     - deploy registry
     - deploy token referencing registry

5. Tests
   - `contracts/test/*`
     - verified -> transfer succeeds
     - not verified -> transfer reverts

6. Integration points (backend <-> chain)
   - Backend writes KYC results off-chain (DB)
   - Backend (admin signer) updates `KYCRegistry` on-chain for verified wallets
   - Frontend reads on-chain KYC status and token balances

---

## 6) Suggested execution order (fastest progress)

1. Backend: minimal `GET /health` + run server
2. Frontend: minimal app + call `/health`
3. Contracts: compile + deploy to localhost
4. Backend: add KYC mock + write on-chain registry updates
5. Frontend: show KYC status + allow investing flow

---

## 7) Next action to take (pick one)

### If you want the fastest visible win
- Build the **backend `/health`** and minimal **frontend** to display it.

### If you want to start from tokenization logic
- Build the minimal **KYCRegistry + FundToken** contracts + tests and deploy locally.
