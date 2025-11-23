import express from 'express';
import { createVote, getVoteCounts, getUserVotes } from '../controllers/voteController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', createVote);
router.get('/user', getUserVotes);
router.get('/:contentType/:contentId', getVoteCounts);

export default router;

