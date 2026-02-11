# Frontend - Tokenized Investment Funds

React TypeScript single-page application for the Tokenized Investment Funds platform. Provides interfaces for General Partners (GPs) and Limited Partners (LPs) to manage funds, investments, KYC verification, and wallet connectivity.

## Tech Stack

- **React 18** with TypeScript
- **React Router v7** for client-side routing
- **Axios** for API communication
- **ethers.js v5** for blockchain interaction
- **Web3Modal** + MetaMask for wallet connectivity
- **Create React App** as the build toolchain

## Prerequisites

- Node.js (v14+) and npm
- Backend server running on `http://localhost:3001`
- MetaMask browser extension (for wallet features)
- Hardhat node running on `http://localhost:8545` (for on-chain features)

## Setup

```bash
cd frontend
npm install

# Configure environment
cp .env.example .env
# Edit .env if backend runs on a different port

# Start development server
npm start
# -> http://localhost:3000
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_API_BASE_URL` | `http://localhost:3001` | Backend API base URL |

## Project Structure

```
src/
├── api/                  # API client wrappers
│   ├── auth.ts           # Authentication (login, register, session)
│   ├── funds.ts          # Fund & investment API calls
│   ├── kyc.ts            # KYC submission and status
│   └── transactions.ts   # Transaction history and export
├── components/           # React components
│   ├── AuthPage.tsx          # Login/Register page switcher
│   ├── LoginForm.tsx         # Login form
│   ├── RegisterForm.tsx      # Registration form with role selection
│   ├── Dashboard.tsx         # Home dashboard with news and stats
│   ├── LandingPage.tsx       # Public landing page
│   ├── Navbar.tsx            # Navigation bar with wallet status
│   ├── ProtectedRoute.tsx    # Auth guard for protected routes
│   ├── FundList.tsx          # Browse all available funds
│   ├── FundDetail.tsx        # Fund details, invest, manage investors
│   ├── CreateFundForm.tsx    # GP: create new fund with deployment
│   ├── MyFunds.tsx           # GP: manage owned funds
│   ├── MyInvestments.tsx     # LP: view investments and token balances
│   ├── InvestorsDashboard.tsx # GP: view and manage fund investors
│   ├── PortfolioManagement.tsx # GP: manage portfolio companies
│   ├── KYCForm.tsx           # KYC document submission form
│   ├── KYCStatus.tsx         # KYC status display with on-chain sync
│   ├── UserProfile.tsx       # User profile and KYC overview
│   ├── WalletConnect.tsx     # Wallet connection button
│   ├── TransactionsPage.tsx  # Transaction history page
│   ├── TransactionsTable.tsx # Transaction list with sorting
│   ├── TransactionFilters.tsx # Transaction filter controls
│   ├── TransactionSummary.tsx # Transaction statistics cards
│   └── TransactionDetailModal.tsx # Transaction detail popup
├── contexts/             # React context providers
│   ├── AuthContext.tsx    # Authentication state (JWT, user, login/logout)
│   └── WalletContext.tsx  # MetaMask wallet state (connect, balance, chain)
├── styles/               # Styling
│   ├── responsive.css    # Responsive layout and global styles
│   └── theme.ts          # Theme constants
├── App.tsx               # Root component with routing
└── index.tsx             # Entry point
```

## Routes

| Path | Component | Access | Description |
|------|-----------|--------|-------------|
| `/` | `LandingPage` | Public | Landing page |
| `/auth` | `AuthPage` | Public | Login / Register |
| `/home` | `Dashboard` | Protected | User dashboard |
| `/profile` | `UserProfile` | Protected | Profile and KYC status |
| `/funds` | `FundList` | Protected | Browse all funds |
| `/funds/create` | `CreateFundForm` | Protected | Create a new fund (GP) |
| `/funds/:id` | `FundDetail` | Protected | Fund details and invest |
| `/my-funds` | `MyFunds` | Protected | Manage owned funds (GP) |
| `/my-investments` | `MyInvestments` | Protected | View investments (LP) |
| `/transactions` | `TransactionsPage` | Protected | Transaction history |
| `/portfolio` | `PortfolioManagement` | Protected | Portfolio companies (GP) |
| `/investors` | `InvestorsDashboard` | Protected | Manage investors (GP) |

## API Layer

All API calls go through typed wrappers in `src/api/`:

- **`auth.ts`** - `apiClient` with token management, `login()`, `register()`, `getCurrentUser()`
- **`funds.ts`** - `fundsApi` for fund CRUD, `investmentsApi` for investment operations
- **`kyc.ts`** - `kycApi` for KYC document submission and status checks
- **`transactions.ts`** - `transactionsApi` for history, detail, and CSV export

The API client automatically attaches JWT tokens from `localStorage` to all authenticated requests.

## Context Providers

### AuthContext
Manages authentication state using `useReducer`. Handles login, register, logout, and automatic session restoration from stored JWT tokens.

### WalletContext
Manages MetaMask wallet connection. Listens for account and chain changes, fetches ETH balance, and supports network switching to Hardhat Local (chain ID 1337).

## Available Scripts

```bash
npm start       # Start development server on port 3000
npm run build   # Production build to build/
npm test        # Run tests
```

## Role-Based Features

### General Partner (GP)
- Create and deploy funds to blockchain
- Manage fund details and deployment status
- View and manage investor submissions (confirm/cancel)
- Manage portfolio companies
- Mint tokens for confirmed investments

### Limited Partner (LP)
- Browse available funds
- Submit investments (requires connected wallet + approved KYC)
- Track investment status and on-chain token balances
- View transaction history with filtering and export
- Submit KYC documents for verification
