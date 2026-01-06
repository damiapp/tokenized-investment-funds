# Tokenized Investment Funds Platform (Master Thesis Prototype)

Prototype platform for **GP (General Partners)** and **LP (Limited Partners)** that digitizes fund creation, onboarding (KYC off-chain with on-chain enforcement), investing/capital contributions, and ownership representation via **tokenization**.

## 🚀 **Live Demo**

**Frontend:** `http://localhost:3000` | **Backend:** `http://localhost:3001`

### 🧪 **Quick Test**
1. Register → Login → View Profile → Test Protected Routes
2. Email: `test@example.com` | Password: `testpassword123`

### ✅ **Features**
- 🔐 JWT Authentication (register, login, protected routes)
- 🗄️ PostgreSQL + Sequelize (users, KYC status)
- 🎨 React + TypeScript (dark theme, form validation)
- 🛡️ Security (bcrypt, CORS, rate limiting)
- 🧪 Testing (31/38 tests passing)
- 🔄 Session persistence with auto-redirect

## Tech Stack

- **Frontend:** React + TypeScript + React Router + `ethers`
- **Backend:** Node.js + Express + PostgreSQL + Sequelize + JWT
- **Smart contracts:** Solidity + Hardhat (planned)
- **Testing:** Jest + Supertest + SQLite (backend)

## Repository Structure

```
frontend/src/
├── api/           # API client
├── components/    # React components (forms, profile, routes)
├── contexts/      # Authentication state
└── App.tsx        # Main app with routing

backend/src/
├── controllers/   # Request handlers
├── middleware/    # Express middleware
├── models/        # Database models
├── routes/        # API routes
├── services/      # Business logic
└── test/          # Test suite
```

## Prerequisites

- Node.js + npm
- **PostgreSQL** (required for authentication system)
- (Optional) MetaMask (wallet) for the frontend demo

## Quick Start

### 1. Setup PostgreSQL Database
```bash
# Create database
createdb tokenized_funds

# Or using psql:
psql -U postgres
CREATE DATABASE tokenized_funds;
\q
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env  # Update DATABASE_URL with your PostgreSQL password
npm run dev
# → Backend running on http://localhost:3001
```

**Backend `.env` configuration:**
```env
NODE_ENV=development
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/tokenized_funds
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=3001
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
# → Frontend running on http://localhost:3000
```

### 4. Running Both Servers
**Option 1: Separate terminals**
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm start
```

**Option 2: From root (requires concurrently)**
```bash
npm install  # Install concurrently
npm run dev  # Runs both backend and frontend
```

## 🚀 Current Features

### ✅ **Authentication**
- Complete registration/login forms with validation
- JWT-based protected routes with auto-redirect
- User profile dashboard with KYC status
- Session persistence across page refreshes

### ✅ **Backend**
- PostgreSQL + Sequelize (users, KYC status)
- JWT middleware & security headers
- Comprehensive API testing (31/38 tests)

### ✅ **Frontend**
- React + TypeScript with full type safety
- Context API for auth state management
- Dark theme UI with responsive design

### ✅ **Smart Contracts** (Ready)
- KYCRegistry & FundToken contracts implemented

## 📅 Development Timeline

### 🎯 **Jan 4, 2026 - Production Auth System**
- Complete authentication UI with validation
- Protected routes with auto-redirect
- User profile dashboard with KYC status
- Full TypeScript implementation
- Session persistence & navigation logic

### 🔧 **Dec 26, 2025 - Backend Foundation**
- Express server with security middleware
- JWT authentication + bcrypt hashing
- PostgreSQL + Sequelize models
- Comprehensive test suite (31/38 tests)

### 🎨 **Dec 26, 2025 - Frontend Foundation**
- React + TypeScript setup
- MetaMask integration
- Dark theme UI design

### 🔗 **Smart Contracts**
- **KYCRegistry**: On-chain identity verification
- **FundToken**: Permissioned ERC-20 with KYC enforcement
- **OpenZeppelin**: Secure contract patterns

## 📡 **API Endpoints**

### 🔐 **Authentication**
- `POST /auth/register` - User registration
- `POST /auth/login` - User authentication  
- `GET /auth/me` - Get current user (JWT required)
- `GET /health` - Health check

**Response Format:**
```json
{
  "data": {
    "user": { "id": "uuid", "email": "...", "role": "LP|GP", "kyc": {...} },
    "token": "jwt" (auth only)
  }
}
```

## 🧪 Testing

```bash
cd backend
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report
npm run test:auth           # Auth tests only
```

**Features:** SQLite in-memory DB, automatic setup/teardown, comprehensive coverage (31/38 tests passing)

## 🎯 **Next Steps**

### 🚀 **Priority 1: KYC Flow**
- Document upload interface
- KYC status tracking
- Mock provider integration

### 💰 **Priority 2: Funds Management**
- Fund creation/listing
- GP/LP permissions
- Investment tracking

### 🔗 **Priority 3: Smart Contracts**
- Contract deployment
- On-chain operations
- Token issuance

### 🎨 **Priority 4: Enhanced UI**
- Portfolio dashboard
- Real-time updates
- Mobile optimization

## Notes

- Dependencies may report security warnings because some packages are older (CRA / WalletConnect v1). This is acceptable for a prototype demo; we can modernize later.
