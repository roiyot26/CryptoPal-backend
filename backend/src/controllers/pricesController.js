import Cache from '../models/Cache.js';
import { coingeckoClient } from '../utils/apiClients.js';
import logger from '../utils/logger.js';

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
        logger.error('CoinGecko API error', 'PRICE_HISTORY', error.message);
        throw error;
      }
    };

    const historyData = await Cache.getOrCreate(cacheKey, fetchHistory, 1); // Cache for 1 hour

    res.status(200).json({
      success: true,
      data: historyData,
    });
  } catch (error) {
    next(error);
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

    const fetchPrices = async () => {
      try {
        const data = await coingeckoClient('/simple/price', {
          ids: coinIds.join(','),
          vs_currencies: 'usd',
          include_24hr_change: 'true',
          include_market_cap: 'true',
        });

        // Format the response
        const formattedPrices = Object.entries(data).map(([id, priceData]) => ({
          id,
          symbol: id.toUpperCase(),
          name: id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' '),
          price: priceData.usd,
          change24h: priceData.usd_24h_change,
          marketCap: priceData.usd_market_cap,
        }));

        return {
          prices: formattedPrices,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        logger.error('CoinGecko API error', 'PRICES', error.message);
        throw error;
      }
    };

    const pricesData = await Cache.getOrCreate(cacheKey, fetchPrices, 1); // Cache for 1 hour

    res.status(200).json({
      success: true,
      data: pricesData,
    });
  } catch (error) {
    next(error);
  }
};

