import Vote from '../models/Vote.js';

// @desc    Create or update vote
// @route   POST /api/votes
// @access  Private
export const createVote = async (req, res, next) => {
  try {
    const { contentType, contentId, voteType } = req.body;

    if (!contentType || !contentId || !voteType) {
      return res.status(400).json({
        success: false,
        message: 'Please provide contentType, contentId, and voteType',
      });
    }

    if (!['news', 'price', 'ai', 'meme'].includes(contentType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contentType',
      });
    }

    if (!['up', 'down'].includes(voteType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid voteType. Must be "up" or "down"',
      });
    }

    // Find existing vote
    let vote = await Vote.findOne({
      user: req.user.id,
      contentType,
      contentId,
    });

    if (vote) {
      // Update existing vote
      vote.voteType = voteType;
      await vote.save();
    } else {
      // Create new vote
      vote = await Vote.create({
        user: req.user.id,
        contentType,
        contentId,
        voteType,
      });
    }

    // Get updated vote counts
    const counts = await Vote.getVoteCounts(contentType, contentId);

    res.status(200).json({
      success: true,
      vote: {
        id: vote._id,
        contentType,
        contentId,
        voteType,
      },
      counts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get vote counts for content
// @route   GET /api/votes/:contentType/:contentId
// @access  Private
export const getVoteCounts = async (req, res, next) => {
  try {
    const { contentType, contentId } = req.params;

    const counts = await Vote.getVoteCounts(contentType, contentId);
    const userVote = await Vote.getUserVote(req.user.id, contentType, contentId);

    res.status(200).json({
      success: true,
      counts,
      userVote,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user votes for dashboard
// @route   GET /api/votes/user
// @access  Private
export const getUserVotes = async (req, res, next) => {
  try {
    const votes = await Vote.find({ user: req.user.id });

    // Group votes by content
    const voteMap = {};
    votes.forEach(vote => {
      const key = `${vote.contentType}_${vote.contentId}`;
      voteMap[key] = vote.voteType;
    });

    res.status(200).json({
      success: true,
      votes: voteMap,
    });
  } catch (error) {
    next(error);
  }
};

