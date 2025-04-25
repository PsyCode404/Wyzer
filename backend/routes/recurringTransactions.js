import express from 'express';
import { 
  getRecurringTransactions, 
  getRecurringTransactionById, 
  createRecurringTransaction, 
  updateRecurringTransaction, 
  toggleRecurringTransactionStatus,
  deleteRecurringTransaction 
} from '../controllers/recurringTransactionController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Authentication temporarily disabled for development
// router.use(authenticateToken);

// GET /api/recurring - Get all recurring transactions
router.get('/', getRecurringTransactions);

// GET /api/recurring/:id - Get a single recurring transaction by ID
router.get('/:id', getRecurringTransactionById);

// POST /api/recurring - Create a new recurring transaction
router.post('/', createRecurringTransaction);

// PUT /api/recurring/:id - Update an existing recurring transaction
router.put('/:id', updateRecurringTransaction);

// PATCH /api/recurring/:id/toggle - Toggle the active status of a recurring transaction
router.patch('/:id/toggle', toggleRecurringTransactionStatus);

// DELETE /api/recurring/:id - Delete a recurring transaction
router.delete('/:id', deleteRecurringTransaction);

export default router;
