import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 10000;

// CORS
app.use(cors({ origin: true }));
app.use(express.json());

// Health endpoints
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', port: PORT });
});

app.get('/', (req, res) => {
  res.json({ message: 'Wyzer Backend', status: 'running' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
