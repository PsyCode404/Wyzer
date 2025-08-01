import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

let pool;

// Validate required environment variables
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

export const connectDB = async () => {
  try {
    if (!pool) {
      console.log('Connecting to MySQL database...');
      
      pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        ssl: false, // Disable SSL as per AlwaysData requirements
        connectTimeout: 10000, // 10 seconds timeout
      });

      // Verify connection immediately
      const connection = await pool.getConnection();
      await connection.ping();
      connection.release();
      
      console.log('✅ Successfully connected to MySQL database on', process.env.DB_HOST);
      console.log('📊 Database:', process.env.DB_NAME);
    }
    return pool;
  } catch (err) {
    console.error('❌ Database connection failed:', {
      code: err.code,
      errno: err.errno,
      sqlState: err.sqlState,
      message: err.message,
    });
    console.error('🔧 Connection details:', {
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });
    throw err;
  }
};

export const getPool = () => {
  if (!pool) {
    throw new Error('Database pool not initialized. Did you call connectDB()?');
  }
  return pool;
};
