# Backend Test Suite

This directory contains all test files and utilities for the backend API.

## 📁 Directory Structure

```
test/
├── database/           # Database connection and setup tests
│   ├── direct-connection.js    # Test direct PostgreSQL connection
│   ├── sequelize-connection.js # Test Sequelize ORM connection
│   └── debug-env.js            # Debug environment variables
├── debug/              # Debug utilities and troubleshooting
│   └── auth-loading.js         # Test auth module loading
├── api/                # API endpoint tests
│   ├── auth-endpoints.js       # Node.js auth endpoint tests
│   ├── auth-endpoints.ps1      # PowerShell auth endpoint tests
│   └── simple-powershell.ps1   # Simple PowerShell curl commands
├── unit/               # Jest unit tests
│   ├── setup.js               # Test setup and database configuration
│   ├── auth.test.js            # Authentication endpoint tests
│   ├── models.test.js          # Database model tests
│   ├── services.test.js        # Service function tests
│   └── helpers.js              # Test utilities and helpers
└── scripts/            # Test runners and utilities
    └── run-tests.js            # Test runner script
```

## 🚀 Usage

### Database Tests
```bash
# Test direct PostgreSQL connection
node test/database/direct-connection.js

# Test Sequelize connection
node test/database/sequelize-connection.js

# Debug environment variables
node test/database/debug-env.js
```

### API Tests
```bash
# Node.js auth endpoint tests
node test/api/auth-endpoints.js

# PowerShell comprehensive auth tests
.\test\api\auth-endpoints.ps1

# Simple PowerShell tests
.\test\api\simple-powershell.ps1
```

### Debug Utilities
```bash
# Test auth module loading
node test/debug/auth-loading.js
```

### Test Runners
```bash
# Run Jest tests (from backend root)
npm test
npm run test:watch
npm run test:coverage

# Custom test runner
node test/scripts/run-tests.js [all|watch|coverage|auth|models|services]
```

## 📋 Test Categories

### ✅ Working Tests
- Database connection (PostgreSQL + Sequelize)
- Authentication endpoints (register, login, /me)
- JWT token generation and validation
- User registration and KYC status creation

### 🧪 Test Coverage
- **Unit Tests**: Model validations, service functions
- **Integration Tests**: Auth endpoints, database operations
- **API Tests**: Full authentication flow
- **Database Tests**: Connection and schema validation

## 🔧 Environment Setup

Make sure your `.env` file is configured:
```env
DATABASE_URL=postgres://postgres:12345@localhost:5432/tokenized_funds
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=3001
```

## 📝 Notes

- Database tests use the actual PostgreSQL database
- API tests require the server to be running on `localhost:3001`
- PowerShell scripts are provided for Windows users
- Jest tests use SQLite in-memory database for isolation
