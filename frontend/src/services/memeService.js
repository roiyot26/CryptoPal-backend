import { httpClient } from './httpClient.js';

export const memeService = {
  getMemes: async () => {
    const response = await httpClient.get('/memes');
    return response.data;
  },
};


