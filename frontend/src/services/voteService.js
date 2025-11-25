import { httpClient } from './httpClient.js';

const encodeId = (value) => {
  if (value === undefined || value === null) {
    return '';
  }
  return encodeURIComponent(value);
};

export const voteService = {
  getVoteState: async (contentType, contentId) => {
    const response = await httpClient.get(`/votes/${contentType}/${encodeId(contentId)}`);
    return response;
  },
  submitVote: async ({ contentType, contentId, voteType }) => {
    const response = await httpClient.post('/votes', {
      contentType,
      contentId,
      voteType,
    });
    return response;
  },
  removeVote: async (contentType, contentId) => {
    const response = await httpClient.delete(
      `/votes/${contentType}/${encodeId(contentId)}`,
    );
    return response;
  },
  getUserVotes: async () => {
    const response = await httpClient.get('/votes/user');
    return response.votes;
  },
};


