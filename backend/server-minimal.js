import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// CORS - allow all origins for now
app.use(cors({
  origin: true,
  credentials: true
}));

// Parse JSON
app.use(express.json());

// Health check endpoint - must respond quickly for Render
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Render health check endpoint (sometimes Render checks root)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Wyzer Backend API',
    status: 'running'
  });
});

// Import and use routes
import authRoutes from './routes/auth.js';
app.use('/api/auth', authRoutes);

// Start server immediately, connect to DB in background
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  
  // Connect to database after server starts
  connectDB()
    .then(() => {
      console.log('✅ Database connected successfully');
    })
    .catch((err) => {
      console.error('⚠️ Database connection failed (server still running):', err);
    });
});
