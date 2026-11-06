import express from 'express';
import {
  getObligations,
  createObligation,
  updateObligation,
  deleteObligation,
} from '../controllers/obligationController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getObligations);
router.post('/', createObligation);
router.put('/:id', updateObligation);
router.delete('/:id', deleteObligation);

export default router;

