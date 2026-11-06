import express from 'express';
import {
  evaluatePurchase,
  evaluateDaily,
  simulateWhatIf,
  getDecisionHistory,
  deleteDecision,
} from '../controllers/decisionController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// Module 1: Purchase Decision Analyzer
router.post('/evaluate-purchase', evaluatePurchase);

// Module 2: Daily Spending Evaluator
router.post('/evaluate-daily', evaluateDaily);

// Module 4: What-If Purchase Simulator
router.post('/simulate', simulateWhatIf);

// Decision history
router.get('/history', getDecisionHistory);
router.delete('/history/:id', deleteDecision);

export default router;

