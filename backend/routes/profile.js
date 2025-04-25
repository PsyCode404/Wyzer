import express from 'express';
import { completeProfile } from '../controllers/profileController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Authentication temporarily disabled for development
// router.use(authenticateToken);

// POST /api/profile/complete
router.post('/complete', completeProfile);

export default router;
