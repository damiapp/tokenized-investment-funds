const axios = require('axios');

const API_URL = 'http://localhost:3001';
let gpToken = '';
let lpToken = '';
let fundId = '';
let investmentId = '';

const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(status, message) {
    const color = status === 'PASS' ? colors.green : status === 'FAIL' ? colors.red : colors.yellow;
    console.log(`${color}[${status}]${colors.reset} ${message}`);
}

async function testEndpoint(name, fn) {
    try {
        await fn();
        log('PASS', name);
        return true;
    } catch (error) {
        log('FAIL', `${name}: ${error.message}`);
        if (error.response) {
            console.log(`  Status: ${error.response.status}`);
            console.log(`  Data: ${JSON.stringify(error.response.data)}`);
        }
        return false;
    }
}

async function runTests() {
    console.log('\n' + colors.blue + '='.repeat(60) + colors.reset);
    console.log(colors.blue + 'Starting Backend API Tests' + colors.reset);
    console.log(colors.blue + '='.repeat(60) + colors.reset + '\n');

    let passed = 0;
    let failed = 0;

    // Authentication Tests
    console.log(colors.yellow + '\n--- Authentication Tests ---' + colors.reset);
    
    if (await testEndpoint('POST /auth/login (GP)', async () => {
        const response = await axios.post(`${API_URL}/auth/login`, {
            email: 'gp@demo.com',
            password: 'password123'
        });
        gpToken = response.data.data.token;
        if (!gpToken) throw new Error('No token received');
    })) passed++; else failed++;

    if (await testEndpoint('POST /auth/login (LP)', async () => {
        const response = await axios.post(`${API_URL}/auth/login`, {
            email: 'lp1@demo.com',
            password: 'password123'
        });
        lpToken = response.data.data.token;
        if (!lpToken) throw new Error('No token received');
    })) passed++; else failed++;

    if (await testEndpoint('GET /auth/me (GP)', async () => {
        const response = await axios.get(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${gpToken}` }
        });
        if (response.data.data.role !== 'GP') throw new Error('Wrong role');
    })) passed++; else failed++;

    if (await testEndpoint('GET /auth/me (LP)', async () => {
        const response = await axios.get(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${lpToken}` }
        });
        if (response.data.data.role !== 'LP') throw new Error('Wrong role');
    })) passed++; else failed++;

    // Fund Tests
    console.log(colors.yellow + '\n--- Fund Tests ---' + colors.reset);

    if (await testEndpoint('GET /funds (browse all)', async () => {
        const response = await axios.get(`${API_URL}/funds`, {
            headers: { Authorization: `Bearer ${lpToken}` }
        });
        if (!Array.isArray(response.data.data.funds)) throw new Error('No funds array');
        console.log(`  Found ${response.data.data.funds.length} funds`);
    })) passed++; else failed++;

    if (await testEndpoint('GET /funds/my-funds (GP)', async () => {
        const response = await axios.get(`${API_URL}/funds/my-funds`, {
            headers: { Authorization: `Bearer ${gpToken}` }
        });
        if (!Array.isArray(response.data.data.funds)) throw new Error('No funds array');
        if (response.data.data.funds.length > 0) {
            fundId = response.data.data.funds[0].id;
            console.log(`  Found ${response.data.data.funds.length} GP funds`);
        }
    })) passed++; else failed++;

    if (fundId && await testEndpoint('GET /funds/:id (fund details)', async () => {
        const response = await axios.get(`${API_URL}/funds/${fundId}`, {
            headers: { Authorization: `Bearer ${lpToken}` }
        });
        if (!response.data.data.fund) throw new Error('No fund data');
        console.log(`  Fund: ${response.data.data.fund.name}`);
    })) passed++; else failed++;

    if (fundId && await testEndpoint('GET /funds/:id/investors', async () => {
        const response = await axios.get(`${API_URL}/funds/${fundId}/investors`, {
            headers: { Authorization: `Bearer ${gpToken}` }
        });
        if (!Array.isArray(response.data.data.investors)) throw new Error('No investors array');
        console.log(`  Found ${response.data.data.investors.length} investors`);
    })) passed++; else failed++;

    if (fundId && await testEndpoint('GET /funds/:id/analytics', async () => {
        const response = await axios.get(`${API_URL}/funds/${fundId}/analytics`, {
            headers: { Authorization: `Bearer ${gpToken}` }
        });
        if (!response.data.data.analytics) throw new Error('No analytics data');
        console.log(`  Raised: ${response.data.data.analytics.raisedAmount}`);
    })) passed++; else failed++;

    // Investment Tests
    console.log(colors.yellow + '\n--- Investment Tests ---' + colors.reset);

    if (await testEndpoint('GET /investments/portfolio (LP)', async () => {
        const response = await axios.get(`${API_URL}/investments/portfolio`, {
            headers: { Authorization: `Bearer ${lpToken}` }
        });
        if (!Array.isArray(response.data.data.investments)) throw new Error('No investments array');
        console.log(`  Found ${response.data.data.investments.length} investments`);
        if (response.data.data.investments.length > 0) {
            investmentId = response.data.data.investments[0].id;
        }
    })) passed++; else failed++;

    if (investmentId && await testEndpoint('GET /investments/:id', async () => {
        const response = await axios.get(`${API_URL}/investments/${investmentId}`, {
            headers: { Authorization: `Bearer ${lpToken}` }
        });
        if (!response.data.data.investment) throw new Error('No investment data');
        console.log(`  Amount: ${response.data.data.investment.amount}`);
    })) passed++; else failed++;

    // Portfolio Tests
    console.log(colors.yellow + '\n--- Portfolio Tests ---' + colors.reset);

    if (await testEndpoint('GET /portfolio/companies', async () => {
        const response = await axios.get(`${API_URL}/portfolio/companies`, {
            headers: { Authorization: `Bearer ${gpToken}` }
        });
        if (!Array.isArray(response.data.data.companies)) throw new Error('No companies array');
        console.log(`  Found ${response.data.data.companies.length} companies`);
    })) passed++; else failed++;

    if (fundId && await testEndpoint('GET /portfolio/fund/:fundId', async () => {
        const response = await axios.get(`${API_URL}/portfolio/fund/${fundId}`, {
            headers: { Authorization: `Bearer ${gpToken}` }
        });
        if (!Array.isArray(response.data.data.companies)) throw new Error('No companies array');
        console.log(`  Found ${response.data.data.companies.length} portfolio companies`);
    })) passed++; else failed++;

    // KYC Tests
    console.log(colors.yellow + '\n--- KYC Tests ---' + colors.reset);

    if (await testEndpoint('GET /kyc/status (LP)', async () => {
        const response = await axios.get(`${API_URL}/kyc/status`, {
            headers: { Authorization: `Bearer ${lpToken}` }
        });
        console.log(`  KYC Status: ${response.data.data.kyc?.status || 'not submitted'}`);
    })) passed++; else failed++;

    // Summary
    console.log('\n' + colors.blue + '='.repeat(60) + colors.reset);
    console.log(colors.blue + 'Test Summary' + colors.reset);
    console.log(colors.blue + '='.repeat(60) + colors.reset);
    console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
    console.log(`Total: ${passed + failed}`);
    console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%\n`);

    process.exit(failed > 0 ? 1 : 0);
}

// Check if server is running
axios.get(`${API_URL}/health`)
    .then(() => {
        console.log(colors.green + '✓ Backend server is running' + colors.reset);
        runTests();
    })
    .catch(() => {
        console.log(colors.red + '✗ Backend server is not running' + colors.reset);
        console.log(colors.yellow + 'Please start the backend server first:' + colors.reset);
        console.log('  cd backend && npm start\n');
        process.exit(1);
    });
