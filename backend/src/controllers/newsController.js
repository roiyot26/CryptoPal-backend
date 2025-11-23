import Cache from '../models/Cache.js';
import { cryptopanicClient } from '../utils/apiClients.js';
import logger from '../utils/logger.js';

// @desc    Get crypto news
// @route   GET /api/news
// @access  Private
export const getNews = async (req, res, next) => {
  try {
    const userPreferences = req.user.preferences;
    const cryptoAssets = userPreferences?.cryptoAssets || [];

    // Create cache key based on user preferences
    const cacheKey = `news_${cryptoAssets.sort().join('_') || 'all'}`;

    const fetchNews = async () => {
      try {
        // Filter by currencies if user has preferences
        // Map user preferences to CryptoPanic currency codes
        const currencyMap = {
          'Bitcoin': 'BTC',
          'Ethereum': 'ETH',
          'Altcoins': 'BTC,ETH,ADA,DOT,SOL',
          'DeFi': 'ETH,UNI,AAVE,LINK',
          'NFTs': 'ETH',
          'Stablecoins': 'USDT,USDC,DAI',
          'Layer 2': 'ETH,MATIC,ARB,OP',
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
        
        // Log response summary
        logger.debug('CryptoPanic API response received', 'NEWS', {
          hasResults: !!data.results,
          resultsType: Array.isArray(data.results) ? 'array' : typeof data.results,
          resultsLength: Array.isArray(data.results) ? data.results.length : 'N/A',
        });
        
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
          results: results.slice(0, 3).map((item, index) => {
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

            return {
              id: item.id || `news_${index}`,
              title: item.title || 'No title',
              created_at: item.created_at || new Date().toISOString(),
              formatted_date: formattedDate,
              description: item.description || item.text || item.subtitle || item.metadata?.description || null,
            };
          }),
          count: results.length,
        };
      } catch (error) {
        logger.error('CryptoPanic API error', 'NEWS', error.message);
        throw error;
      }
    };

    // Check if we should bypass cache (for debugging) via query parameter
    const bypassCache = req.query.bypassCache === 'true';
    
    if (bypassCache) {
      // Bypass cache for debugging - fetch fresh data directly
      logger.info('Bypassing cache - fetching fresh data from API', 'NEWS');
      try {
        const newsData = await fetchNews();
        res.status(200).json({
          success: true,
          data: newsData,
        });
      } catch (fetchError) {
        logger.error('Error fetching news (bypassing cache)', 'NEWS', fetchError.message);
        // If direct fetch fails, try with cache as fallback
        try {
          const newsData = await Cache.getOrCreate(cacheKey, fetchNews, 24);
          res.status(200).json({
            success: true,
            data: newsData,
          });
        } catch (cacheError) {
          logger.error('Error with cache fallback', 'NEWS', cacheError.message);
          // If both fail, throw the original error to be handled by error middleware
          throw fetchError;
        }
      }
    } else {
      // Normal operation with caching
      const newsData = await Cache.getOrCreate(cacheKey, fetchNews, 24);
      res.status(200).json({
        success: true,
        data: newsData,
      });
    }
  } catch (error) {
    next(error);
  }
};

