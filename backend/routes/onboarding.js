import express from 'express';
import { saveOnboardingPreferences } from '../controllers/onboardingController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/onboarding/preferences - Save user onboarding preferences
router.post('/preferences', authenticateToken, saveOnboardingPreferences);

export default router;
