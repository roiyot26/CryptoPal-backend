import Cache from '../models/Cache.js';
import { cryptopanicClient } from '../utils/apiClients.js';
import logger from '../utils/logger.js';
import memoryCache from '../utils/memoryCache.js';

const MEMORY_TTL_MS = 60 * 60 * 1000; // 1 hour

const currencyMap = {
  Bitcoin: 'BTC',
  Ethereum: 'ETH',
  Altcoins: 'ADA,DOT,SOL,AVAX,ALGO',
  DeFi: 'UNI,AAVE,LINK,COMP,MKR',
  NFTs: 'ETH',
  Stablecoins: 'USDT,USDC,DAI,BUSD',
  'Layer 2': 'MATIC,ARB,OP',
  'Meme Coins': 'DOGE,SHIB',
};

const fallbackNews = () => ({
  results: [
    {
      id: 'fallback_1',
      title: 'Crypto markets continue to evolve',
      created_at: new Date().toISOString(),
      formatted_date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    },
  ],
  count: 1,
});

const normalizeResults = (data) => {
  let results = [];
  if (Array.isArray(data.results)) {
    results = data.results;
  } else if (data.results) {
    results = [data.results];
  } else if (Array.isArray(data)) {
    results = data;
  }
  return results;
};

export const getNewsForUser = async (userPreferences = {}) => {
  const cryptoAssets = userPreferences.cryptoAssets || [];
  const cacheKey = `news_${cryptoAssets.slice().sort().join('_') || 'all'}`;

  const cachedResponse = memoryCache.get(cacheKey);
  if (cachedResponse) {
    return cachedResponse;
  }

  const fetchNews = async () => {
    try {
      let currencies = 'BTC,ETH';
      if (cryptoAssets.length > 0) {
        const currencyList = [];
        cryptoAssets.forEach((asset) => {
          if (currencyMap[asset]) {
            currencyList.push(...currencyMap[asset].split(','));
          }
        });
        if (currencyList.length > 0) {
          currencies = [...new Set(currencyList)].join(',');
        }
      }

      const data = await cryptopanicClient('/posts/', {
        currencies,
        filter: 'hot',
        public: 'true',
      });

      const results = normalizeResults(data);

      if (results.length === 0) {
        logger.warn('No news results from API, returning fallback', 'NEWS');
        return fallbackNews();
      }

      return {
        results: results.slice(0, 10).map((item, index) => {
          let formattedDate = '';
          if (item.created_at) {
            try {
              formattedDate = new Date(item.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              });
            } catch (e) {
              formattedDate = new Date().toLocaleDateString();
            }
          } else {
            formattedDate = new Date().toLocaleDateString();
          }

          let formattedPublishedDate = '';
          if (item.published_at) {
            try {
              formattedPublishedDate = new Date(item.published_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });
            } catch (e) {
              formattedPublishedDate = '';
            }
          }

          return {
            id: item.id || `news_${index}`,
            title: item.title || 'No title',
            created_at: item.created_at || new Date().toISOString(),
            published_at: item.published_at || null,
            formatted_date: formattedDate,
            formatted_published_date: formattedPublishedDate,
            description: item.description || item.text || item.subtitle || item.metadata?.description || null,
            kind: item.kind || 'news',
            slug: item.slug || null,
            url: item.url || null,
          };
        }),
        count: results.length,
      };
    } catch (error) {
      logger.error('CryptoPanic API error', 'NEWS', error.message);
      throw error;
    }
  };

  const newsData = await Cache.getOrCreate(cacheKey, fetchNews, 1);
  memoryCache.set(cacheKey, newsData, MEMORY_TTL_MS);

  return newsData;
};


