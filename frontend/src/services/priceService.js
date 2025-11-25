import { httpClient } from './httpClient.js';

export const priceService = {
  getPrices: async () => {
    const response = await httpClient.get('/prices');
    return response.data;
  },
  getPriceHistory: async (coinId, days = '7') => {
    const response = await httpClient.get(`/prices/${coinId}/history?days=${days}`);
    return response.data;
  },
};


