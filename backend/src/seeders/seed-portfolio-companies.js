const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';

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

async function seedPortfolioCompanies() {
  console.log('🌱 Seeding portfolio companies...\n');

  try {
    // Login as GP
    console.log('Logging in as GP...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'gp@demo.com',
      password: 'password123',
    });

    const token = loginResponse.data.data.token;
    console.log('✅ Logged in successfully\n');

    // Create each company
    let successCount = 0;
    let skipCount = 0;

    for (const company of companies) {
      try {
        await axios.post(
          `${API_BASE_URL}/portfolio/companies`,
          company,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log(`✅ Created: ${company.name}`);
        successCount++;
      } catch (err) {
        if (err.response?.status === 409 || err.response?.data?.error?.message?.includes('already exists')) {
          console.log(`⏭️  Skipped: ${company.name} (already exists)`);
          skipCount++;
        } else {
          console.error(`❌ Failed: ${company.name} - ${err.response?.data?.error?.message || err.message}`);
        }
      }
    }

    console.log('\n✅ Portfolio company seeding complete!');
    console.log(`📊 Summary:`);
    console.log(`   - ${successCount} companies created`);
    console.log(`   - ${skipCount} companies skipped (already exist)`);
    console.log(`   - Total: ${companies.length} companies\n`);

  } catch (error) {
    console.error('❌ Seeding failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

seedPortfolioCompanies()
  .then(() => {
    console.log('✅ Seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
