import express from 'express';
import {
  getSpendingIntelligence,
  getPersonalizedAdvice,
  getFinancialTimeline,
} from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// Module 5: Spending Behaviour Intelligence
router.get('/spending-intelligence', getSpendingIntelligence);

// Module 6: Personalized Financial Advisor
router.get('/recommendations', getPersonalizedAdvice);

// Module 3: Financial Timeline
router.get('/timeline', getFinancialTimeline);

export default router;

