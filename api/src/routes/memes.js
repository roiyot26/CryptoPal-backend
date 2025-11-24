import express from 'express';
import { getMemes } from '../controllers/memeController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getMemes);

export default router;

