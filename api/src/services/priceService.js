import Cache from '../models/Cache.js';
import { coingeckoClient } from '../utils/apiClients.js';
import logger from '../utils/logger.js';
import memoryCache from '../utils/memoryCache.js';

const VALID_HISTORY_DAYS = ['1', '7', '30', '365'];
const DEFAULT_HISTORY_DAYS = '7';
const MEMORY_TTL_MS = 60 * 60 * 1000; // 1 hour

const coinMapping = {
  Bitcoin: 'bitcoin',
  Ethereum: 'ethereum',
  Altcoins: 'cardano,polkadot,solana,avalanche-2,algorand',
  DeFi: 'uniswap,aave,chainlink,compound-governance-token,maker',
  NFTs: 'ethereum',
  Stablecoins: 'tether,usd-coin,dai,binance-usd',
  'Layer 2': 'polygon,arbitrum,optimism',
  'Meme Coins': 'dogecoin,shiba-inu',
};

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const getPriceHistory = async ({ coinId, days }) => {
  if (!coinId) {
    throw createHttpError(400, 'Coin ID is required');
  }

  const daysParam = VALID_HISTORY_DAYS.includes(days) ? days : DEFAULT_HISTORY_DAYS;
  const cacheKey = `price_history_${coinId}_${daysParam}`;

  const cachedHistory = memoryCache.get(cacheKey);
  if (cachedHistory) {
    return cachedHistory;
  }

  const fetchHistory = async () => {
    try {
      const data = await coingeckoClient(`/coins/${coinId}/market_chart`, {
        vs_currency: 'usd',
        days: daysParam,
      });

      const prices =
        data.prices?.map(([timestamp, price]) => ({
          timestamp,
          date: new Date(timestamp).toISOString(),
          price,
        })) || [];

      logger.debug(
        `Fetched ${prices.length} price points for ${coinId} (${daysParam} days)`,
        'PRICE_HISTORY',
      );

      return {
        coinId,
        days: daysParam,
        prices,
        marketCaps: data.market_caps || [],
        totalVolumes: data.total_volumes || [],
      };
    } catch (error) {
      logger.error(`CoinGecko API error for ${coinId}`, 'PRICE_HISTORY', error.message);
      return null;
    }
  };

  const historyData = await Cache.getOrCreate(cacheKey, fetchHistory, 1);

  if (!historyData) {
    throw createHttpError(404, `Historical price data not available for ${coinId}`);
  }

  memoryCache.set(cacheKey, historyData, MEMORY_TTL_MS);

  return historyData;
};

const resolveCoinIds = (userPreferences = {}) => {
  const cryptoAssets = userPreferences.cryptoAssets || [];
  let coinIds = [];

  if (cryptoAssets.length > 0) {
    cryptoAssets.forEach((asset) => {
      if (coinMapping[asset]) {
        coinIds.push(...coinMapping[asset].split(','));
      }
    });
  }

  if (coinIds.length === 0) {
    coinIds = ['bitcoin', 'ethereum'];
  }

  coinIds = [...new Set(coinIds)];

  if (coinIds.length === 1) {
    if (!coinIds.includes('bitcoin')) {
      coinIds.push('bitcoin');
    } else if (!coinIds.includes('ethereum')) {
      coinIds.push('ethereum');
    }
  }

  return coinIds;
};

const fetchPrices = async (coinIds) => {
  try {
    const data = await coingeckoClient('/simple/price', {
      ids: coinIds.join(','),
      vs_currencies: 'usd',
      include_24hr_change: 'true',
      include_market_cap: 'true',
    });

    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
      logger.warn('CoinGecko API returned empty or invalid data', 'PRICES');
      return null;
    }

    const formattedPrices = Object.entries(data)
      .filter(([, priceData]) => priceData && priceData.usd !== undefined)
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
    return null;
  }
};

const FALLBACK_PRICES = {
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

export const getPricesForUser = async (userPreferences = {}) => {
  const coinIds = resolveCoinIds(userPreferences);
  const cacheKey = `prices_${coinIds.slice().sort().join('_')}`;

  const cachedPrices = memoryCache.get(cacheKey);
  if (cachedPrices) {
    return cachedPrices;
  }

  let pricesData = await Cache.getOrCreate(cacheKey, () => fetchPrices(coinIds), 1);

  if (!pricesData || !pricesData.prices || pricesData.prices.length === 0) {
    logger.warn('Primary price fetch failed, trying Bitcoin/Ethereum fallback', 'PRICES');
    const fallbackCoinIds = ['bitcoin', 'ethereum'];
    const fallbackCacheKey = `prices_${fallbackCoinIds.sort().join('_')}`;
    pricesData = await Cache.getOrCreate(fallbackCacheKey, () => fetchPrices(fallbackCoinIds), 1);

    if (!pricesData || !pricesData.prices || pricesData.prices.length === 0) {
      logger.error('Both primary and fallback price fetches failed', 'PRICES');
      pricesData = FALLBACK_PRICES;
    }
  }

  memoryCache.set(cacheKey, pricesData, MEMORY_TTL_MS);

  return pricesData;
};


