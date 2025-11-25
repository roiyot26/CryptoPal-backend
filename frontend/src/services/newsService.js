import { httpClient } from './httpClient.js';

export const newsService = {
  getNews: async () => {
    const response = await httpClient.get('/news');
    return response.data;
  },
};


