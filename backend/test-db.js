import { connectDB } from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

// Log environment variables (without sensitive data)
console.log('🔧 Environment variables:');
console.log(`- DB_HOST: ${process.env.DB_HOST ? '✅ Set' : '❌ Missing'}`);
console.log(`- DB_USER: ${process.env.DB_USER ? '✅ Set' : '❌ Missing'}`);
console.log(`- DB_NAME: ${process.env.DB_NAME ? '✅ Set' : '❌ Missing'}`);
console.log(`- DB_PORT: ${process.env.DB_PORT || '3306 (default)'}`);

async function testConnection() {
  try {
    console.log('\n🔄 Starting database connection test...');
    
    // Test the connection
    console.log('\n🔌 Attempting to connect to the database...');
    const pool = await connectDB();
    
    // Test a simple query
    console.log('\n🔍 Running test query...');
    const [rows] = await pool.query('SELECT 1 + 1 AS solution');
    console.log('✅ Test query result:', rows[0].solution === 2 ? '1 + 1 = 2' : 'Unexpected result');
    
    // Test listing tables (if any exist)
    console.log('\n📋 Checking database tables...');
    const [tables] = await pool.query('SHOW TABLES');
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
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error('Error details:', {
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    process.exit(1);
  }
}

// Add error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('\n⚠️  Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

testConnection();
