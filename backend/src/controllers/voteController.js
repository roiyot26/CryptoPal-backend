import Vote from '../models/Vote.js';

const buildVoteSummary = async (userId, contentType, contentId) => {
  const votes = await Vote.find({ contentType, contentId }).populate('user', 'name');

  const summary = {
    counts: { upvotes: 0, downvotes: 0 },
    userVote: null,
    voters: {
      up: [],
      down: [],
    },
  };

  votes.forEach((vote) => {
    const voterName = vote.user?.name || 'Anonymous';
    if (vote.voteType === 'up') {
      summary.counts.upvotes += 1;
      summary.voters.up.push(voterName);
    } else if (vote.voteType === 'down') {
      summary.counts.downvotes += 1;
      summary.voters.down.push(voterName);
    }

    if (!summary.userVote && userId && vote.user?.id?.toString() === userId.toString()) {
      summary.userVote = vote.voteType;
    }
  });

  return summary;
};

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

    // Extract keywords from user preferences
    const userPreferences = req.user.preferences || {};
    const cryptoAssets = userPreferences.cryptoAssets || [];
    const investorType = userPreferences.investorType || '';
    
    // Build keywords array based on content type
    let keywords = [];
    
    // For all content types, include cryptoAssets
    if (cryptoAssets.length > 0) {
      keywords = [...cryptoAssets];
    }
    
    // For AI insights, also include investorType
    if (contentType === 'ai' && investorType) {
      // Map investorType ID to label for better readability
      const investorTypeMap = {
        'hodler': 'HODLer',
        'day-trader': 'Day Trader',
        'nft-collector': 'NFT Collector',
      };
      const investorLabel = investorTypeMap[investorType] || investorType;
      keywords.push(investorLabel);
    }

    // Find existing vote
    let vote = await Vote.findOne({
      user: req.user.id,
      contentType,
      contentId,
    });

    if (vote) {
      // If same vote type, this shouldn't happen (frontend handles toggle)
      // But if it does, just update
      vote.voteType = voteType;
      vote.keywords = keywords; // Update keywords as well
      await vote.save();
    } else {
      // Create new vote
      vote = await Vote.create({
        user: req.user.id,
        contentType,
        contentId,
        voteType,
        keywords,
      });
    }

    const summary = await buildVoteSummary(req.user.id, contentType, contentId);

    res.status(200).json({
      success: true,
      vote: {
        id: vote._id,
        contentType,
        contentId,
        voteType,
        keywords: vote.keywords || [],
      },
      counts: summary.counts,
      userVote: summary.userVote,
      voters: summary.voters,
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

    const summary = await buildVoteSummary(req.user.id, contentType, contentId);

    res.status(200).json({
      success: true,
      counts: summary.counts,
      userVote: summary.userVote,
      voters: summary.voters,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete vote
// @route   DELETE /api/votes/:contentType/:contentId
// @access  Private
export const deleteVote = async (req, res, next) => {
  try {
    const { contentType, contentId } = req.params;

    // Find and delete the vote
    const vote = await Vote.findOneAndDelete({
      user: req.user.id,
      contentType,
      contentId,
    });

    const summary = await buildVoteSummary(req.user.id, contentType, contentId);

    res.status(200).json({
      success: true,
      message: 'Vote removed',
      counts: summary.counts,
      userVote: summary.userVote,
      voters: summary.voters,
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

    // Group votes by content with keywords
    const voteMap = {};
    votes.forEach(vote => {
      const key = `${vote.contentType}_${vote.contentId}`;
      voteMap[key] = {
        voteType: vote.voteType,
        keywords: vote.keywords || [],
        contentType: vote.contentType,
        contentId: vote.contentId,
      };
    });

    res.status(200).json({
      success: true,
      votes: voteMap,
    });
  } catch (error) {
    next(error);
  }
};

