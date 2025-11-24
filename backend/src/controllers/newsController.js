import Cache from '../models/Cache.js';
import { cryptopanicClient } from '../utils/apiClients.js';
import logger from '../utils/logger.js';
import memoryCache from '../utils/memoryCache.js';

// @desc    Get crypto news
// @route   GET /api/news
// @access  Private
export const getNews = async (req, res, next) => {
  try {
    const userPreferences = req.user.preferences;
    const cryptoAssets = userPreferences?.cryptoAssets || [];

    // Create cache key based on user preferences
    const cacheKey = `news_${cryptoAssets.sort().join('_') || 'all'}`;
    const MEMORY_TTL_MS = 60 * 60 * 1000; // 1 hour

    const cachedResponse = memoryCache.get(cacheKey);
    if (cachedResponse) {
      return res.status(200).json({
        success: true,
        data: cachedResponse,
      });
    }

    const fetchNews = async () => {
      try {
        // Filter by currencies if user has preferences
        // Map user preferences to CryptoPanic currency codes
        const currencyMap = {
          'Bitcoin': 'BTC',
          'Ethereum': 'ETH',
          'Altcoins': 'ADA,DOT,SOL,AVAX,ALGO',
          'DeFi': 'UNI,AAVE,LINK,COMP,MKR',
          'NFTs': 'ETH',
          'Stablecoins': 'USDT,USDC,DAI,BUSD',
          'Layer 2': 'MATIC,ARB,OP',
          'Meme Coins': 'DOGE,SHIB',
        };

        let currencies = 'BTC,ETH'; // Default
        if (cryptoAssets.length > 0) {
          const currencyList = [];
          cryptoAssets.forEach(asset => {
            if (currencyMap[asset]) {
              currencyList.push(...currencyMap[asset].split(','));
            }
          });
          if (currencyList.length > 0) {
            currencies = [...new Set(currencyList)].join(',');
          }
        }

        const params = {
          currencies: currencies,
          filter: 'hot',
          public: 'true',
        };

        const data = await cryptopanicClient('/posts/', params);
        
        // Format the response - CryptoPanic returns results array
        let results = [];
        if (Array.isArray(data.results)) {
          results = data.results;
        } else if (data.results) {
          results = [data.results];
        } else if (Array.isArray(data)) {
          results = data;
        }
        
        if (results.length === 0) {
          // Return fallback news if no results
          logger.warn('No news results from API, returning fallback', 'NEWS');
          return {
            results: [{
              id: 'fallback_1',
              title: 'Crypto markets continue to evolve',
              created_at: new Date().toISOString(),
              formatted_date: new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              }),
            }],
            count: 1,
          };
        }
        
        return {
          results: results.slice(0, 10).map((item, index) => {
            // Format date
            let formattedDate = '';
            if (item.created_at) {
              try {
                const date = new Date(item.created_at);
                formattedDate = date.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                });
              } catch (e) {
                formattedDate = new Date().toLocaleDateString();
              }
            } else {
              formattedDate = new Date().toLocaleDateString();
            }

            // Format published date if different from created_at
            let formattedPublishedDate = '';
            if (item.published_at) {
              try {
                const publishedDate = new Date(item.published_at);
                formattedPublishedDate = publishedDate.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
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

    // Use cache for news to preserve API usage
    const newsData = await Cache.getOrCreate(cacheKey, fetchNews, 1); // Cache for 1 hour
    memoryCache.set(cacheKey, newsData, MEMORY_TTL_MS);

    res.status(200).json({
      success: true,
      data: newsData,
    });
  } catch (error) {
    next(error);
  }
};

