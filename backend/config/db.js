import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

let pool;

export const connectDB = async () => {
  try {
    if (!pool) {
      // For Railway, use the MYSQL_URL or construct from individual variables
      const dbConfig = process.env.MYSQL_URL ? {
        uri: process.env.MYSQL_URL,
        ssl: {
          rejectUnauthorized: false // Required for Railway's MySQL
        }
      } : {
        host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
        user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
        password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
        database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'wyzer',
        port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
        ssl: process.env.MYSQL_URL ? {
          rejectUnauthorized: false
        } : undefined,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 60000,
        multipleStatements: true
      };

      console.log('Connecting to database with config:', {
        host: dbConfig.host || 'from MYSQL_URL',
        database: dbConfig.database || 'from MYSQL_URL',
        port: dbConfig.port || 'from MYSQL_URL'
      });

      pool = process.env.MYSQL_URL 
        ? mysql.createPool(process.env.MYSQL_URL + '?ssl={"rejectUnauthorized":false}')
        : mysql.createPool(dbConfig);

      // Verify connection immediately
      const connection = await pool.getConnection();
      await connection.ping();
      connection.release();
      console.log('MySQL DB connected successfully');
    }
  } catch (err) {
    console.error('Database connection error:', {
      message: err.message,
      code: err.code,
      errno: err.errno,
      sqlState: err.sqlState,
      sqlMessage: err.sqlMessage
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
