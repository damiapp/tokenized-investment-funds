const bcrypt = require('bcryptjs');
const { User, Fund, Investment } = require('../models');
const axios = require('axios');

// Hardhat test accounts
const accounts = [
  { address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' },
  { address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d' },
  { address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a' },
  { address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', privateKey: '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6' },
  { address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', privateKey: '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a' },
  { address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc', privateKey: '0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba' },
  { address: '0x976EA74026E726554dB657fA54763abd0C3a0aa9', privateKey: '0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e' },
  { address: '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955', privateKey: '0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356' },
  { address: '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f', privateKey: '0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97' },
  { address: '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720', privateKey: '0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6' },
  { address: '0xBcd4042DE499D14e55001CcbB24a551F3b954096', privateKey: '0xf214f2b2cd398c806f84e317254e0f0b801d0643303237d97a22a48e01628897' },
  { address: '0x71bE63f3384f5fb98995898A86B02Fb2426c5788', privateKey: '0x701b615bbdfb9de65240bc28bd21bbc0d996645a3dd57e7b12bc2bdf6f192c82' },
];

async function seedComprehensiveData() {
  console.log('🌱 Starting comprehensive database seeding...\n');

  const password = await bcrypt.hash('password123', 10);

  // Create GP user
  const [gp] = await User.findOrCreate({
    where: { email: 'gp@demo.com' },
    defaults: {
      email: 'gp@demo.com',
      passwordHash: password,
      role: 'GP',
      walletAddress: accounts[0].address,
    },
  });
  console.log('✅ GP user created');

  // Create 11 LP users (we have 12 accounts total, 1 for GP, 11 for LPs)
  const lps = [];
  for (let i = 1; i <= 11; i++) {
    const [lp] = await User.findOrCreate({
      where: { email: `lp${i}@demo.com` },
      defaults: {
        email: `lp${i}@demo.com`,
        passwordHash: password,
        role: 'LP',
        walletAddress: accounts[i].address,
      },
    });
    lps.push(lp);
  }
  console.log(`✅ Created ${lps.length} LP users\n`);

  // Create 12 diverse funds
  const fundData = [
    {
      name: 'Tech Ventures Fund',
      description: 'Early-stage technology investments focusing on AI, blockchain, and SaaS companies.',
      targetAmount: 5000000,
      raisedAmount: 3500000,
      minimumInvestment: 50000,
      managementFee: 2.0,
      performanceFee: 20.0,
      investmentStrategy: 'Focus on Series A and B rounds in high-growth tech sectors with proven product-market fit.',
      riskLevel: 'high',
      status: 'active',
      tokenSymbol: 'TVF',
      onChainFundId: 1,
    },
    {
      name: 'Healthcare Innovation Fund',
      description: 'Investing in breakthrough medical technologies and digital health solutions.',
      targetAmount: 10000000,
      raisedAmount: 7200000,
      minimumInvestment: 100000,
      managementFee: 2.5,
      performanceFee: 25.0,
      investmentStrategy: 'Target biotech, medtech, and healthtech companies with FDA approval pathways.',
      riskLevel: 'high',
      status: 'active',
      tokenSymbol: 'HIF',
      onChainFundId: 2,
    },
    {
      name: 'Sustainable Energy Fund',
      description: 'Clean energy and climate tech investments for a sustainable future.',
      targetAmount: 8000000,
      raisedAmount: 6400000,
      minimumInvestment: 75000,
      managementFee: 2.0,
      performanceFee: 20.0,
      investmentStrategy: 'Invest in solar, wind, battery storage, and carbon capture technologies.',
      riskLevel: 'medium',
      status: 'active',
      tokenSymbol: 'SEF',
      onChainFundId: 3,
    },
    {
      name: 'FinTech Growth Fund',
      description: 'Financial technology disrupting traditional banking and payments.',
      targetAmount: 6000000,
      raisedAmount: 4800000,
      minimumInvestment: 60000,
      managementFee: 2.0,
      performanceFee: 20.0,
      investmentStrategy: 'Focus on payments, lending, wealth management, and blockchain finance.',
      riskLevel: 'medium',
      status: 'active',
      tokenSymbol: 'FGF',
      onChainFundId: 4,
    },
    {
      name: 'Real Estate Tech Fund',
      description: 'PropTech innovations transforming real estate industry.',
      targetAmount: 4000000,
      raisedAmount: 2800000,
      minimumInvestment: 40000,
      managementFee: 1.75,
      performanceFee: 18.0,
      investmentStrategy: 'Invest in property management software, smart buildings, and real estate marketplaces.',
      riskLevel: 'low',
      status: 'active',
      tokenSymbol: 'RTF',
      onChainFundId: 5,
    },
    {
      name: 'Consumer Brands Fund',
      description: 'Direct-to-consumer brands and e-commerce platforms.',
      targetAmount: 3500000,
      raisedAmount: 2100000,
      minimumInvestment: 35000,
      managementFee: 1.5,
      performanceFee: 15.0,
      investmentStrategy: 'Target DTC brands with strong unit economics and brand loyalty.',
      riskLevel: 'medium',
      status: 'active',
      tokenSymbol: 'CBF',
      onChainFundId: 6,
    },
    {
      name: 'EdTech Innovation Fund',
      description: 'Educational technology revolutionizing learning and skills development.',
      targetAmount: 4500000,
      raisedAmount: 3150000,
      minimumInvestment: 45000,
      managementFee: 2.0,
      performanceFee: 20.0,
      investmentStrategy: 'Focus on K-12, higher education, and corporate training platforms.',
      riskLevel: 'medium',
      status: 'active',
      tokenSymbol: 'EIF',
      onChainFundId: 7,
    },
    {
      name: 'Cybersecurity Fund',
      description: 'Protecting digital infrastructure with cutting-edge security solutions.',
      targetAmount: 7000000,
      raisedAmount: 5600000,
      minimumInvestment: 70000,
      managementFee: 2.25,
      performanceFee: 22.0,
      investmentStrategy: 'Invest in cloud security, identity management, and threat detection.',
      riskLevel: 'medium',
      status: 'active',
      tokenSymbol: 'CSF',
      onChainFundId: 8,
    },
    {
      name: 'Food & AgriTech Fund',
      description: 'Agricultural innovation and food technology for sustainable production.',
      targetAmount: 5500000,
      raisedAmount: 3850000,
      minimumInvestment: 55000,
      managementFee: 2.0,
      performanceFee: 20.0,
      investmentStrategy: 'Target vertical farming, alternative proteins, and supply chain tech.',
      riskLevel: 'medium',
      status: 'active',
      tokenSymbol: 'FAF',
      onChainFundId: 9,
    },
    {
      name: 'Mobility & Transportation Fund',
      description: 'Future of transportation including EVs, autonomous vehicles, and logistics.',
      targetAmount: 9000000,
      raisedAmount: 6300000,
      minimumInvestment: 90000,
      managementFee: 2.5,
      performanceFee: 25.0,
      investmentStrategy: 'Invest in electric vehicles, charging infrastructure, and smart logistics.',
      riskLevel: 'high',
      status: 'active',
      tokenSymbol: 'MTF',
      onChainFundId: 10,
    },
    {
      name: 'Space Technology Fund',
      description: 'Commercial space exploration and satellite technology investments.',
      targetAmount: 15000000,
      raisedAmount: 9000000,
      minimumInvestment: 150000,
      managementFee: 3.0,
      performanceFee: 30.0,
      investmentStrategy: 'Focus on satellite communications, space tourism, and launch services.',
      riskLevel: 'high',
      status: 'active',
      tokenSymbol: 'STF',
      onChainFundId: 11,
    },
    {
      name: 'Web3 & Metaverse Fund',
      description: 'Next generation internet with blockchain, NFTs, and virtual worlds.',
      targetAmount: 12000000,
      raisedAmount: 8400000,
      minimumInvestment: 120000,
      managementFee: 2.5,
      performanceFee: 25.0,
      investmentStrategy: 'Invest in decentralized applications, gaming, and virtual reality platforms.',
      riskLevel: 'high',
      status: 'active',
      tokenSymbol: 'W3F',
      onChainFundId: 12,
    },
  ];

  const funds = [];
  for (const data of fundData) {
    const [fund] = await Fund.findOrCreate({
      where: { name: data.name },
      defaults: { ...data, gpId: gp.id },
    });
    funds.push(fund);
  }
  console.log(`✅ Created ${funds.length} funds\n`);

  // Create investments - distribute LPs across funds
  console.log('Creating investments...');
  let investmentCount = 0;
  
  for (let i = 0; i < lps.length; i++) {
    const lp = lps[i];
    // Each LP invests in 2-4 random funds
    const numInvestments = Math.floor(Math.random() * 3) + 2;
    const shuffledFunds = [...funds].sort(() => Math.random() - 0.5);
    
    for (let j = 0; j < numInvestments; j++) {
      const fund = shuffledFunds[j];
      const amount = fund.minimumInvestment * (Math.random() * 3 + 1); // 1x to 4x minimum
      const tokensIssued = amount / 100; // Simple token calculation
      
      await Investment.findOrCreate({
        where: { lpId: lp.id, fundId: fund.id },
        defaults: {
          lpId: lp.id,
          fundId: fund.id,
          amount: amount.toFixed(2),
          tokensIssued: tokensIssued.toFixed(8),
          status: Math.random() > 0.2 ? 'confirmed' : 'pending', // 80% confirmed
          investedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Random date in last 90 days
        },
      });
      investmentCount++;
    }
  }
  console.log(`✅ Created ${investmentCount} investments\n`);

  // Create portfolio companies via API
  console.log('Creating portfolio companies via API...');
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'; // Placeholder - will need actual token
  
  const companies = [
    { name: 'NeuralTech AI', industry: 'Artificial Intelligence', country: 'USA', foundedYear: 2020 },
    { name: 'BlockChain Solutions', industry: 'Blockchain', country: 'Singapore', foundedYear: 2019 },
    { name: 'CloudScale SaaS', industry: 'Cloud Computing', country: 'USA', foundedYear: 2021 },
    { name: 'BioGen Therapeutics', industry: 'Biotechnology', country: 'Switzerland', foundedYear: 2018 },
    { name: 'MediScan Devices', industry: 'Medical Devices', country: 'Germany', foundedYear: 2020 },
    { name: 'HealthHub Digital', industry: 'Digital Health', country: 'UK', foundedYear: 2021 },
    { name: 'SolarWave Energy', industry: 'Solar Energy', country: 'USA', foundedYear: 2019 },
    { name: 'WindTech Systems', industry: 'Wind Energy', country: 'Denmark', foundedYear: 2017 },
    { name: 'BatteryNext Storage', industry: 'Energy Storage', country: 'South Korea', foundedYear: 2020 },
    { name: 'PayFlow Fintech', industry: 'Payments', country: 'USA', foundedYear: 2020 },
    { name: 'LendSmart Platform', industry: 'Lending', country: 'UK', foundedYear: 2021 },
    { name: 'WealthAI Advisors', industry: 'Wealth Management', country: 'USA', foundedYear: 2019 },
    { name: 'PropTech Manager', industry: 'Property Management', country: 'USA', foundedYear: 2020 },
    { name: 'SmartBuilding IoT', industry: 'Smart Buildings', country: 'Netherlands', foundedYear: 2019 },
    { name: 'RealEstate Marketplace', industry: 'Real Estate', country: 'USA', foundedYear: 2021 },
  ];

  console.log(`ℹ️  Portfolio companies need to be created via authenticated API`);
  console.log(`   Run this after logging in as GP to create ${companies.length} companies\n`);

  console.log('✅ Comprehensive seeding complete!\n');
  console.log('📊 Summary:');
  console.log(`   - 1 GP user`);
  console.log(`   - ${lps.length} LP users`);
  console.log(`   - ${funds.length} funds`);
  console.log(`   - ${investmentCount} investments`);
  console.log(`   - ${companies.length} portfolio companies (to be created via API)\n`);
  
  console.log('🔐 Login credentials:');
  console.log('   GP: gp@demo.com / password123');
  console.log('   LPs: lp1@demo.com through lp12@demo.com / password123\n');
}

// Run the seeder
seedComprehensiveData()
  .then(() => {
    console.log('✅ Seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
