import express from 'express';
import {
  completeProfile,
  getUserProfile,
  updateUserProfile,
  updateCurrencyPreference,
  uploadProfilePicture
} from '../controllers/profileController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Authentication temporarily disabled for development
// router.use(authenticateToken);

// GET /api/profile - Get user profile data
router.get('/', getUserProfile);

// PUT /api/profile - Update user profile
router.put('/', updateUserProfile);

// POST /api/profile/complete - Complete onboarding profile
router.post('/complete', completeProfile);

// PUT /api/profile/currency - Update currency preference
router.put('/currency', updateCurrencyPreference);

// POST /api/profile/picture - Upload profile picture
router.post('/picture', uploadProfilePicture);

export default router;
