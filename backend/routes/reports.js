import express from 'express';
import { 
  getReportData, 
  exportReportData,
  getReportSummary,
  getExpensiveCategories,
  getMonthlyComparison,
  getCategoryTrends
} from '../controllers/reportController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Authentication temporarily disabled for development
// router.use(authenticateToken);

// GET /api/reports - Get report data (legacy endpoint)
router.get('/', getReportData);

// GET /api/reports/summary - Get comprehensive report summary
router.get('/summary', getReportSummary);

// GET /api/reports/expensive-categories - Get most expensive categories
router.get('/expensive-categories', getExpensiveCategories);

// GET /api/reports/monthly-comparison - Get monthly income vs expense comparison
router.get('/monthly-comparison', getMonthlyComparison);

// GET /api/reports/category-trends - Get category spending trends over time
router.get('/category-trends', getCategoryTrends);

// GET /api/reports/export - Export report data
router.get('/export', exportReportData);

export default router;
