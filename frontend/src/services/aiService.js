import { httpClient } from './httpClient.js';

export const aiService = {
  getInsight: async () => {
    const response = await httpClient.get('/ai/insight');
    return response.data;
  },
};


