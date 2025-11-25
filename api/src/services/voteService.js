import Vote from '../models/Vote.js';
import { getUserDisplayName } from './userService.js';

const MAX_VOTER_NAMES = 5;

const decodeContentId = (id = '') => {
  if (typeof id !== 'string') {
    return id;
  }
  try {
    return decodeURIComponent(id);
  } catch (error) {
    return id;
  }
};

const createEmptySummary = () => ({
  counts: { upvotes: 0, downvotes: 0 },
  userVote: null,
  voters: {
    up: [],
    down: [],
  },
});

const applyVoteToSummary = (summary, vote, userId) => {
  const voterName = vote.userName || 'Anonymous';
  if (vote.voteType === 'up') {
    summary.counts.upvotes += 1;
    if (summary.voters.up.length < MAX_VOTER_NAMES) {
      summary.voters.up.push(voterName);
    }
  } else if (vote.voteType === 'down') {
    summary.counts.downvotes += 1;
    if (summary.voters.down.length < MAX_VOTER_NAMES) {
      summary.voters.down.push(voterName);
    }
  }

  if (!summary.userVote && userId && vote.user && vote.user.toString() === userId.toString()) {
    summary.userVote = vote.voteType;
  }

  return summary;
};

const buildVoteSummary = async (userId, contentType, contentId) => {
  const votes = await Vote.find({ contentType, contentId }).select('voteType user userName');

  return votes.reduce((summary, vote) => applyVoteToSummary(summary, vote, userId), createEmptySummary());
};

const validateContentInput = ({ contentType, contentId, voteType }) => {
  if (!contentType || !contentId || !voteType) {
    const err = new Error('Please provide contentType, contentId, and voteType');
    err.statusCode = 400;
    throw err;
  }

  if (!['news', 'price', 'ai', 'meme'].includes(contentType)) {
    const err = new Error('Invalid contentType');
    err.statusCode = 400;
    throw err;
  }

  if (!['up', 'down'].includes(voteType)) {
    const err = new Error('Invalid voteType. Must be "up" or "down"');
    err.statusCode = 400;
    throw err;
  }
};

const buildKeywordsForVote = (contentType, userPreferences = {}) => {
  const cryptoAssets = userPreferences.cryptoAssets || [];
  const investorType = userPreferences.investorType || '';

  let keywords = [];
  if (cryptoAssets.length > 0) {
    keywords = [...cryptoAssets];
  }

  if (contentType === 'ai' && investorType) {
    const investorTypeMap = {
      hodler: 'HODLer',
      'day-trader': 'Day Trader',
      'nft-collector': 'NFT Collector',
    };
    const investorLabel = investorTypeMap[investorType] || investorType;
    keywords.push(investorLabel);
  }

  return keywords;
};

export const createOrUpdateVote = async ({ user, contentType, contentId: rawContentId, voteType }) => {
  const contentId = decodeContentId(rawContentId);
  validateContentInput({ contentType, contentId, voteType });

  const keywords = buildKeywordsForVote(contentType, user.preferences);

  let vote = await Vote.findOne({
    user: user.id,
    contentType,
    contentId,
  });

  if (vote) {
    vote.voteType = voteType;
    vote.keywords = keywords;
    vote.userName = getUserDisplayName(user);
    await vote.save();
  } else {
    vote = await Vote.create({
      user: user.id,
      userName: getUserDisplayName(user),
      contentType,
      contentId,
      voteType,
      keywords,
    });
  }

  const summary = await buildVoteSummary(user.id, contentType, contentId);

  return {
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
  };
};

export const getVoteCountsForContent = async (userId, contentType, contentIdParam) => {
  const contentId = decodeContentId(contentIdParam);
  const summary = await buildVoteSummary(userId, contentType, contentId);
  return summary;
};

export const deleteVoteForContent = async (userId, contentType, contentIdParam) => {
  const contentId = decodeContentId(contentIdParam);

  await Vote.findOneAndDelete({
    user: userId,
    contentType,
    contentId,
  });

  return buildVoteSummary(userId, contentType, contentId);
};

export const getVotesForUser = async (userId) => {
  const votes = await Vote.find({ user: userId });
  const voteMap = {};
  votes.forEach((vote) => {
    const key = `${vote.contentType}_${vote.contentId}`;
    voteMap[key] = {
      voteType: vote.voteType,
      keywords: vote.keywords || [],
      contentType: vote.contentType,
      contentId: vote.contentId,
    };
  });
  return voteMap;
};


