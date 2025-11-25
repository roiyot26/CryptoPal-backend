import {
  createOrUpdateVote,
  getVoteCountsForContent,
  deleteVoteForContent,
  getVotesForUser,
} from '../services/voteService.js';

// @desc    Create or update vote
// @route   POST /api/votes
// @access  Private
export const createVote = async (req, res, next) => {
  try {
    const result = await createOrUpdateVote({
      user: req.user,
      contentType: req.body.contentType,
      contentId: req.body.contentId,
      voteType: req.body.voteType,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

// @desc    Get vote counts for content
// @route   GET /api/votes/:contentType/:contentId
// @access  Private
export const getVoteCounts = async (req, res, next) => {
  try {
    const summary = await getVoteCountsForContent(
      req.user.id,
      req.params.contentType,
      req.params.contentId,
    );
    res.status(200).json({
      success: true,
      counts: summary.counts,
      userVote: summary.userVote,
      voters: summary.voters,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

// @desc    Delete vote
// @route   DELETE /api/votes/:contentType/:contentId
// @access  Private
export const deleteVote = async (req, res, next) => {
  try {
    const summary = await deleteVoteForContent(
      req.user.id,
      req.params.contentType,
      req.params.contentId,
    );
    res.status(200).json({
      success: true,
      message: 'Vote removed',
      counts: summary.counts,
      userVote: summary.userVote,
      voters: summary.voters,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

// @desc    Get user votes for dashboard
// @route   GET /api/votes/user
// @access  Private
export const getUserVotes = async (req, res, next) => {
  try {
    const votes = await getVotesForUser(req.user.id);
    res.status(200).json({
      success: true,
      votes,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

