import express from 'express';
import { getDashboardData, getUserBudget } from '../controllers/dashboardController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Authentication temporarily disabled for development
// router.use(authenticateToken);

// GET /api/dashboard - Get dashboard data (spending breakdown, monthly trends, recent transactions)
router.get('/', getDashboardData);

// GET /api/dashboard/budget - Get user's budget
router.get('/budget', getUserBudget);

export default router;
