import express from 'express';
import { getPrices, getPriceHistory } from '../controllers/pricesController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getPrices);
router.get('/:coinId/history', protect, getPriceHistory);

export default router;

