import express from 'express';
import { getNews } from '../controllers/newsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getNews);

export default router;

