import Cache from '../models/Cache.js';
import { coingeckoClient } from '../utils/apiClients.js';
import logger from '../utils/logger.js';
import memoryCache from '../utils/memoryCache.js';

// @desc    Get historical price data for a coin
// @route   GET /api/prices/:coinId/history
// @access  Private
export const getPriceHistory = async (req, res, next) => {
  try {
    const { coinId } = req.params;
    const { days = '7' } = req.query; // Default to 7 days

    if (!coinId) {
      return res.status(400).json({
        success: false,
        message: 'Coin ID is required',
      });
    }

    // Validate days parameter
    const validDays = ['1', '7', '30', '365'];
    const daysParam = validDays.includes(days) ? days : '7';

    const cacheKey = `price_history_${coinId}_${daysParam}`;
    const MEMORY_TTL_MS = 60 * 60 * 1000; // 1 hour

    const cachedHistory = memoryCache.get(cacheKey);
    if (cachedHistory) {
      return res.status(200).json({
        success: true,
        data: cachedHistory,
      });
    }

    const fetchHistory = async () => {
      try {
        const data = await coingeckoClient(`/coins/${coinId}/market_chart`, {
          vs_currency: 'usd',
          days: daysParam,
        });

        // Format the response
        const prices = data.prices?.map(([timestamp, price]) => ({
          timestamp,
          date: new Date(timestamp).toISOString(),
          price,
        })) || [];

        // Don't log the large price arrays - just log summary
        logger.debug(`Fetched ${prices.length} price points for ${coinId} (${daysParam} days)`, 'PRICE_HISTORY');

        return {
          coinId,
          days: daysParam,
          prices,
          marketCaps: data.market_caps || [],
          totalVolumes: data.total_volumes || [],
        };
      } catch (error) {
        logger.error(`CoinGecko API error for ${coinId}`, 'PRICE_HISTORY', error.message);
        // Return null to indicate failure, don't throw
        return null;
      }
    };

    const historyData = await Cache.getOrCreate(cacheKey, fetchHistory, 1); // Cache for 1 hour
    
    // If history data is null (failed to fetch), return 404
    if (!historyData) {
      return res.status(404).json({
        success: false,
        message: `Historical price data not available for ${coinId}`,
        coinId,
      });
    }
    
    memoryCache.set(cacheKey, historyData, MEMORY_TTL_MS);

    res.status(200).json({
      success: true,
      data: historyData,
    });
  } catch (error) {
    logger.error('Unexpected error in getPriceHistory', 'PRICE_HISTORY', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch price history',
    });
  }
};

// Map user preferences to CoinGecko coin IDs
const coinMapping = {
  'Bitcoin': 'bitcoin',
  'Ethereum': 'ethereum',
  'Altcoins': 'cardano,polkadot,solana,avalanche-2,algorand',
  'DeFi': 'uniswap,aave,chainlink,compound-governance-token,maker',
  'NFTs': 'ethereum', // NFTs are typically on Ethereum
  'Stablecoins': 'tether,usd-coin,dai,binance-usd',
  'Layer 2': 'polygon,arbitrum,optimism',
  'Meme Coins': 'dogecoin,shiba-inu',
};

// @desc    Get coin prices
// @route   GET /api/prices
// @access  Private
export const getPrices = async (req, res, next) => {
  try {
    const userPreferences = req.user.preferences;
    const cryptoAssets = userPreferences?.cryptoAssets || [];

    // Get coin IDs based on preferences
    let coinIds = [];
    if (cryptoAssets.length > 0) {
      cryptoAssets.forEach(asset => {
        if (coinMapping[asset]) {
          const ids = coinMapping[asset].split(',');
          coinIds.push(...ids);
        }
      });
    }

    // Default to Bitcoin and Ethereum if no preferences
    if (coinIds.length === 0) {
      coinIds = ['bitcoin', 'ethereum'];
    }

    // Remove duplicates
    coinIds = [...new Set(coinIds)];

    // Ensure at least 2 coins are displayed
    if (coinIds.length === 1) {
      // Add Bitcoin if not already present, otherwise add Ethereum
      if (!coinIds.includes('bitcoin')) {
        coinIds.push('bitcoin');
      } else if (!coinIds.includes('ethereum')) {
        coinIds.push('ethereum');
      }
    }

    const cacheKey = `prices_${coinIds.sort().join('_')}`;
    const MEMORY_TTL_MS = 60 * 60 * 1000; // 1 hour

    const cachedPrices = memoryCache.get(cacheKey);
    if (cachedPrices) {
      return res.status(200).json({
        success: true,
        data: cachedPrices,
      });
    }

    const fetchPrices = async (fallbackCoinIds = null) => {
      try {
        const targetCoinIds = fallbackCoinIds || coinIds;
        
        const data = await coingeckoClient('/simple/price', {
          ids: targetCoinIds.join(','),
          vs_currencies: 'usd',
          include_24hr_change: 'true',
          include_market_cap: 'true',
        });

        // Validate data exists and is an object
        if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
          logger.warn('CoinGecko API returned empty or invalid data', 'PRICES');
          return null;
        }

        // Format the response
        const formattedPrices = Object.entries(data)
          .filter(([id, priceData]) => priceData && priceData.usd !== undefined)
          .map(([id, priceData]) => ({
            id,
            symbol: id.toUpperCase(),
            name: id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' '),
            price: priceData.usd,
            change24h: priceData.usd_24h_change || 0,
            marketCap: priceData.usd_market_cap || 0,
          }));

        if (formattedPrices.length === 0) {
          logger.warn('No valid price data after formatting', 'PRICES');
          return null;
        }

        return {
          prices: formattedPrices,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        logger.error('CoinGecko API error', 'PRICES', error.message);
        return null; // Return null instead of throwing
      }
    };

    // Try to fetch prices with original coin IDs
    let pricesData = await Cache.getOrCreate(cacheKey, () => fetchPrices(), 1); // Cache for 1 hour
    
    // If fetch failed, try fallback with Bitcoin and Ethereum only
    if (!pricesData || !pricesData.prices || pricesData.prices.length === 0) {
      logger.warn('Primary price fetch failed, trying Bitcoin/Ethereum fallback', 'PRICES');
      const fallbackCoinIds = ['bitcoin', 'ethereum'];
      const fallbackCacheKey = `prices_${fallbackCoinIds.sort().join('_')}`;
      
      pricesData = await Cache.getOrCreate(fallbackCacheKey, () => fetchPrices(fallbackCoinIds), 1);
      
      // If fallback also failed, return minimal fallback data
      if (!pricesData || !pricesData.prices || pricesData.prices.length === 0) {
        logger.error('Both primary and fallback price fetches failed', 'PRICES');
        pricesData = {
          prices: [
            {
              id: 'bitcoin',
              symbol: 'BTC',
              name: 'Bitcoin',
              price: 0,
              change24h: 0,
              marketCap: 0,
            },
            {
              id: 'ethereum',
              symbol: 'ETH',
              name: 'Ethereum',
              price: 0,
              change24h: 0,
              marketCap: 0,
            },
          ],
          timestamp: new Date().toISOString(),
        };
      }
    }

    memoryCache.set(cacheKey, pricesData, MEMORY_TTL_MS);

    res.status(200).json({
      success: true,
      data: pricesData,
    });
  } catch (error) {
    logger.error('Unexpected error in getPrices', 'PRICES', error.message);
    // Return fallback response instead of calling next(error)
    res.status(200).json({
      success: true,
      data: {
        prices: [
          {
            id: 'bitcoin',
            symbol: 'BTC',
            name: 'Bitcoin',
            price: 0,
            change24h: 0,
            marketCap: 0,
          },
          {
            id: 'ethereum',
            symbol: 'ETH',
            name: 'Ethereum',
            price: 0,
            change24h: 0,
            marketCap: 0,
          },
        ],
        timestamp: new Date().toISOString(),
      },
    });
  }
};

