const { sequelize } = require('../src/models');

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');
    
    // Test sync
    await sequelize.sync({ force: true });
    console.log('✅ Database tables created!');
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

testConnection();
