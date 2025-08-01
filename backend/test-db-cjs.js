const mysql = require('mysql2/promise');
require('dotenv').config();

// Log environment variables (without sensitive data)
console.log('🔧 Environment variables:');
console.log(`- DB_HOST: ${process.env.DB_HOST ? '✅ Set' : '❌ Missing'}`);
console.log(`- DB_USER: ${process.env.DB_USER ? '✅ Set' : '❌ Missing'}`);
console.log(`- DB_NAME: ${process.env.DB_NAME ? '✅ Set' : '❌ Missing'}`);
console.log(`- DB_PORT: ${process.env.DB_PORT || '3306 (default)'}`);

async function testConnection() {
  let connection;
  try {
    console.log('\n🔄 Starting database connection test...');
    
    // Create a connection
    console.log('\n🔌 Attempting to connect to the database...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
      ssl: false
    });

    console.log('✅ Successfully connected to MySQL database');
    
    // Test a simple query
    console.log('\n🔍 Running test query...');
    const [rows] = await connection.execute('SELECT 1 + 1 AS solution');
    console.log('✅ Test query result: 1 + 1 =', rows[0].solution);
    
    // Test listing tables
    console.log('\n📋 Checking database tables...');
    const [tables] = await connection.execute('SHOW TABLES');
    
    if (tables.length > 0) {
      console.log(`✅ Found ${tables.length} table(s):`);
      tables.forEach((table, index) => {
        const tableName = Object.values(table)[0];
        console.log(`   ${index + 1}. ${tableName}`);
      });
    } else {
      console.log('ℹ️  No tables found in the database');
    }
    
    console.log('\n✨ Database connection test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error('Error details:', {
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    process.exit(1);
  } finally {
    if (connection) await connection.end();
    process.exit(0);
  }
}

// Run the test
testConnection();
