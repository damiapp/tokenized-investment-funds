require('dotenv').config();

console.log('Environment variables:');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_USER:', process.env.DB_USER);

const { sequelize } = require('../src/models');

async function testConnection() {
  try {
    console.log('\nAttempting connection with Sequelize...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');
    
    await sequelize.sync({ force: true });
    console.log('✅ Database tables created!');
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
  }
}

testConnection();
