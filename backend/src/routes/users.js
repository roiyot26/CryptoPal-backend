import express from 'express';
import { getPreferences, updatePreferences } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);

export default router;

