import express from 'express';
import { 
  getTransactions, 
  getTransactionById, 
  createTransaction, 
  updateTransaction, 
  deleteTransaction,
  getTransactionStats,
  bulkImportTransactions
} from '../controllers/transactionController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Authentication temporarily disabled for development
// router.use(authenticateToken);

// GET /api/transactions - Get all transactions with filtering
router.get('/', getTransactions);

// GET /api/transactions/stats - Get transaction statistics
router.get('/stats', getTransactionStats);

// GET /api/transactions/:id - Get a single transaction by ID
router.get('/:id', getTransactionById);

// POST /api/transactions - Create a new transaction
router.post('/', createTransaction);

// POST /api/transactions/bulk - Bulk import transactions
router.post('/bulk', bulkImportTransactions);

// PUT /api/transactions/:id - Update an existing transaction
router.put('/:id', updateTransaction);

// DELETE /api/transactions/:id - Delete a transaction
router.delete('/:id', deleteTransaction);

export default router;
