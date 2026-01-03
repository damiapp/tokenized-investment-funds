const { Client } = require('pg');

async function testDirectConnection() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '12345',
    database: 'postgres' // Try connecting to default database first
  });

  try {
    await client.connect();
    console.log('✅ Direct connection successful!');
    
    // Check if our database exists
    const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', ['tokenized_funds']);
    
    if (result.rows.length === 0) {
      console.log('📝 Creating tokenized_funds database...');
      await client.query('CREATE DATABASE tokenized_funds');
      console.log('✅ Database created!');
    } else {
      console.log('✅ Database already exists!');
    }
    
    await client.end();
  } catch (error) {
    console.error('❌ Direct connection failed:', error.message);
    await client.end().catch(() => {});
  }
}

testDirectConnection();
