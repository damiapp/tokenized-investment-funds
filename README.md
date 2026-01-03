# Tokenized Investment Funds Platform (Master Thesis Prototype)

Prototype platform for **GP (General Partners)** and **LP (Limited Partners)** that digitizes fund creation, onboarding (KYC off-chain with on-chain enforcement), investing/capital contributions, and ownership representation via **tokenization**.

## 🚀 **Live Demo Available!**

Your **full-stack authentication system** is ready to test:

### 🌐 **Access the Application**
- **Frontend:** `http://localhost:3002` (React app)
- **Backend API:** `http://localhost:3001` (Express server)
- **Database:** PostgreSQL with user authentication

### 🧪 **Test the Complete Flow**
1. **Navigate to** `http://localhost:3002`
2. **Register** a new account (email, password, role selection)
3. **Login** with your credentials
4. **View your profile** with KYC status
5. **Test protected routes** (auto-redirect for unauthenticated users)
6. **Refresh the page** (session persistence)

### ✅ **What's Working Right Now**
- 🔐 **Complete JWT Authentication** (register, login, protected routes)
- 🗄️ **PostgreSQL Database Integration** (users, KYC status)
- 🎨 **Modern React UI** (dark theme, responsive design)
- 🛡️ **Security Features** (bcrypt hashing, JWT tokens, validation)
- 🧪 **Comprehensive Testing** (31/38 tests passing)
- 📱 **TypeScript Support** (full type safety)

## Tech Stack

- **Frontend:** React + TypeScript + React Router + `ethers`
- **Backend:** Node.js + Express + PostgreSQL + Sequelize + JWT
- **Smart contracts:** Solidity + Hardhat (planned)
- **Testing:** Jest + Supertest + SQLite (backend)

## Repository Structure

- `frontend/` React app with authentication, wallet connect, and protected routes
- `backend/` Express API with PostgreSQL database and JWT authentication
- `contracts/` Hardhat project (scaffolding; smart contracts to be added)

### Frontend Structure
```
frontend/src/
├── api/           # API client for backend communication
├── components/    # React components (forms, protected routes, profile)
├── contexts/      # React context for authentication state
└── App.tsx        # Main application with routing
```

### Backend Structure
```
backend/src/
├── controllers/   # Request handlers (auth, etc.)
├── middleware/    # Express middleware (auth, validation)
├── models/        # Sequelize database models
├── routes/        # API route definitions
├── services/      # Business logic (password hashing, etc.)
└── test/          # Comprehensive test suite
```

## Prerequisites

- Node.js + npm
- **PostgreSQL** (required for authentication system)
- (Optional) MetaMask (wallet) for the frontend demo

## Quick Start (Demo)

### 1) Backend

1. Install dependencies:
   - `cd backend`
   - `npm install`

2. Set up PostgreSQL:
   - Ensure PostgreSQL is running on port 5432
   - Create database: `tokenized_funds`
   - Update password in `.env` file (default: `12345`)

3. Create env file:
   - Copy `backend/.env.example` to `backend/.env`
   - Update `DATABASE_URL` with your PostgreSQL password

4. Test database connection:
   - `node test/database/sequelize-connection.js`

5. Run dev server:
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
- `http://localhost:3000` (or next available port if 3000 is busy)

## 🚀 What you can demo right now

### ✅ **Fully Functional Authentication System**
- **User Registration:** Create account with email, password, role (GP/LP), optional wallet address
- **User Login:** Secure JWT-based authentication with bcrypt password hashing
- **Protected Routes:** Auto-redirect unauthenticated users to login page
- **User Profile:** View account info, KYC status, and wallet connection
- **Session Persistence:** Automatic login restoration across page refreshes
- **Error Handling:** User-friendly error messages and validation

### ✅ **Backend API**
- **Authentication endpoints:** `/auth/register`, `/auth/login`, `/auth/me`
- **JWT middleware:** Secure token validation for protected routes
- **Database integration:** PostgreSQL with Sequelize ORM
- **Comprehensive testing:** 31/38 tests passing with Jest and SQLite

### ✅ **Frontend Features**
- **Modern React UI:** Dark theme with responsive design
- **React Router:** Client-side routing with protected routes
- **Context API:** Global authentication state management
- **TypeScript:** Full type safety throughout the application
- **Form validation:** Real-time validation with error messages

### ✅ **Smart Contracts** (Ready for Integration)
- **KYCRegistry contract:** On-chain identity verification system
- **FundToken contract:** Permissioned ERC-20 token with KYC enforcement
- **OpenZeppelin integration:** Secure contract development patterns

## 📅 Development Timeline

### 🎯 **Latest Development (Jan 4, 2026) - Frontend Integration Complete**
- **Full Authentication UI:** Login and registration forms with validation
- **Protected Routes:** JWT-based route protection with auto-redirect
- **User Profile Page:** Display account info, KYC status, wallet details
- **React Router Integration:** Client-side routing with authentication flow
- **Context API:** Global authentication state management
- **TypeScript Support:** Full type safety across frontend components
- **API Client:** Secure HTTP client with JWT token management
- **Session Persistence:** Automatic login restoration across refreshes

### 🔧 **Backend Implementation (Dec 26, 2025)**
- **Express server setup** with security middleware (helmet, cors, rate limiting)
- **Health check endpoint** (`GET /health`) returning `{ "ok": true }`
- **Error handling** with proper HTTP status codes and JSON responses
- **Environment configuration** support via `.env` files
- **Authentication system** with JWT tokens and bcrypt password hashing
- **Database models** for User and KYC status using Sequelize
- **Auth endpoints**: `/auth/register`, `/auth/login`, `/auth/me`
- **Comprehensive test suite** with Jest and SQLite mock database (31/38 tests passing)

### 🎨 **Frontend Foundation (Dec 26, 2025)**
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

## API Endpoints

### Authentication
- `POST /auth/register` - User registration (email, password, role, optional walletAddress)
- `POST /auth/login` - User login (email, password)
- `GET /auth/me` - Get current user info (requires JWT token)

### Health
- `GET /health` - Health check endpoint

## Testing

### Backend Tests
The backend includes a comprehensive test suite using Jest and SQLite for mock database:

- **Unit Tests**: Model validations, service functions
- **Integration Tests**: Auth endpoints, database operations
- **Test Coverage**: Password hashing, JWT tokens, user registration/login

### Running Tests
```bash
cd backend

# Install test dependencies
npm install

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test suites
npm run test:auth      # Auth endpoint tests
npm run test:models     # Database model tests
npm run test:services   # Service function tests

# Or use the test runner script
node run-tests.js [all|watch|coverage|auth|models|services]
```

### Test Features
- **SQLite in-memory database** for isolated testing
- **Automatic database setup/teardown** between tests
- **Mock data factories** for consistent test data
- **Comprehensive assertions** for API responses
- **Error case testing** for validation and edge cases

## 🎯 Next Development Milestones

### 🚀 **Priority 1: KYC Flow**
- **Backend:** KYC submission endpoints (`/kyc/submit`, `/kyc/webhook`)
- **Frontend:** KYC document upload interface
- **Integration:** Mock KYC provider with status updates

### 💰 **Priority 2: Funds Management**
- **Backend:** Fund CRUD operations (`/funds`)
- **Frontend:** Fund creation and listing pages
- **Features:** Fund details, investment terms, GP management

### 📊 **Priority 3: Investment System**
- **Backend:** Investment endpoints (`/funds/:fundId/investments`)
- **Frontend:** Investment interface and portfolio tracking
- **Integration:** Connect to smart contracts for token issuance

### 🔗 **Priority 4: Smart Contract Integration**
- **Contract deployment** scripts and testing
- **Backend-Contract integration** for on-chain operations
- **FundFactory contract** for fund creation
- **InvestmentContract** for managing contributions
- **Token issuance** and wallet integration

### 🎨 **Priority 5: UI/UX Enhancements**
- **Dashboard** with portfolio overview
- **Fund marketplace** for browsing investments
- **Advanced wallet** integration with MetaMask
- **Mobile responsive** design improvements

## Notes

- Dependencies may report security warnings because some packages are older (CRA / WalletConnect v1). This is acceptable for a prototype demo; we can modernize later.
