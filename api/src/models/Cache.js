import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const cacheSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
    apiCallCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Static method to get or create cache
cacheSchema.statics.getOrCreate = async function (key, fetchFunction, expiresInHours = 24) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresInHours * 60 * 60 * 1000);

  let cache = await this.findOne({ key });

  // Check if cache exists and is valid
  if (cache && cache.expiresAt > now) {
    return cache.data;
  }

  // Check API call count - limit to 2 calls per key
  const shouldUseAPI = !cache || cache.apiCallCount < 2;

  if (shouldUseAPI) {
    try {
      // Fetch fresh data
      const freshData = await fetchFunction();
      
      // Update or create cache
      if (cache) {
        cache.data = freshData;
        cache.expiresAt = expiresAt;
        cache.apiCallCount += 1;
        await cache.save();
      } else {
        cache = await this.create({
          key,
          data: freshData,
          expiresAt,
          apiCallCount: 1,
        });
      }

      // Log cache operation (without logging large data structures)
      const isLargeData = typeof freshData === 'object' && JSON.stringify(freshData).length > 500;
      if (isLargeData) {
        logger.info(`Fetched fresh data (large dataset) for key: ${key}`, 'CACHE', { apiCallCount: `${cache.apiCallCount}/2` });
      } else {
        logger.debug(`Fetched fresh data for key: ${key}`, 'CACHE', { apiCallCount: `${cache.apiCallCount}/2`, data: freshData });
      }

      return freshData;
    } catch (error) {
      logger.error(`Error fetching data for ${key}`, 'CACHE', error.message);
      
      // If we have old cache data, return it even if expired
      if (cache && cache.data) {
        logger.warn(`Returning expired cache data for ${key}`, 'CACHE');
        return cache.data;
      }
      
      throw error;
    }
  } else {
    // Use cached data even if expired (to preserve API keys)
    if (cache && cache.data) {
      logger.debug(`Using cached data for ${key} (API limit reached)`, 'CACHE', { apiCallCount: `${cache.apiCallCount}/2` });
      return cache.data;
    }
    
    throw new Error(`No cached data available for ${key} and API limit reached`);
  }
};

const Cache = mongoose.model('Cache', cacheSchema);

export default Cache;

