import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

let pool;

export const connectDB = async () => {
  try {
    if (!pool) {
      pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'wyzer',
        port: process.env.DB_PORT || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });

      // Verify connection immediately
      const connection = await pool.getConnection();
      await connection.ping();
      connection.release();
      console.log('MySQL DB connected');
    }
  } catch (err) {
    console.error('Database connection error:', err);
    throw err;
  }
};

export const getPool = () => {
  if (!pool) {
    throw new Error('Database pool not initialized. Did you call connectDB()?');
  }
  return pool;
};
