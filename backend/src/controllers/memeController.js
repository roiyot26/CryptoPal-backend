import Cache from '../models/Cache.js';
import { memeClient } from '../utils/apiClients.js';
import logger from '../utils/logger.js';
import memoryCache from '../utils/memoryCache.js';

const FALLBACK_KEYWORD = 'crypto';
const NO_MEMES_ERROR_CODE = 'NO_MEMES_FOR_KEYWORD';

const getKeywordFromPreferences = (preferences = {}) => {
  const assets = preferences.cryptoAssets || [];
  if (assets.length === 0) {
    return FALLBACK_KEYWORD;
  }

  const randomIndex = Math.floor(Math.random() * assets.length);
  return assets[randomIndex] || FALLBACK_KEYWORD;
};

const normalizeKeyword = (keyword) => {
  if (!keyword) return FALLBACK_KEYWORD;
  return keyword.toLowerCase().trim();
};

const getCacheKey = (normalizedKeyword) =>
  `meme_${normalizedKeyword.replace(/\s+/g, '_')}`;

const formatMemeResults = (rawMemes = [], keyword) => {
  if (!Array.isArray(rawMemes)) {
    return [];
  }

  return rawMemes
    .map((meme, index) => {
      const image =
        meme.image ||
        meme.url ||
        meme.picture ||
        meme.thumbnail ||
        null;

      return {
        id: meme.id?.toString() || image || meme.source || `meme_${keyword}_${index}`,
        title: meme.title || meme.name || `Crypto Meme #${index + 1}`,
        image,
        url: meme.url || meme.source || null,
        description: meme.description || meme.text || meme.excerpt || null,
        source: meme.source || meme.author || null,
      };
    })
    .filter((meme) => !!meme.image);
};

export const getMemes = async (req, res, next) => {
  try {
    const userPreferences = req.user?.preferences || {};
    const requestedKeyword = getKeywordFromPreferences(userPreferences);
    const normalizedKeyword = normalizeKeyword(requestedKeyword);
    const cacheKey = getCacheKey(normalizedKeyword);
    const MEMORY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

    const cachedMemes = memoryCache.get(cacheKey);
    if (cachedMemes) {
      return res.status(200).json({
        success: true,
        data: cachedMemes,
      });
    }

    const fetchMemes = async (displayKeyword, keywordForApi) => {
      logger.debug(
        `Fetching memes for keyword="${displayKeyword}" (api keyword="${keywordForApi}")`,
        'MEME'
      );

      const data = await memeClient('/search-memes', {
        keywords: keywordForApi,
        number: 3,
      });

      const memeResults =
        data?.memes ||
        data?.results ||
        data?.data ||
        (Array.isArray(data) ? data : []);

      const formattedResults = formatMemeResults(memeResults, keywordForApi);

      if (!formattedResults.length) {
        const noMemesError = new Error(
          `No memes returned for keyword "${displayKeyword}"`
        );
        noMemesError.code = NO_MEMES_ERROR_CODE;
        noMemesError.meta = {
          keyword: displayKeyword,
          normalizedKeyword: keywordForApi,
          apiResultCount: memeResults?.length || 0,
        };
        throw noMemesError;
      }

      return {
        keyword: displayKeyword,
        resolvedKeyword: keywordForApi,
        results: formattedResults,
        fetchedAt: new Date().toISOString(),
      };
    };

    let memesData;
    try {
      memesData = await Cache.getOrCreate(cacheKey, () =>
        fetchMemes(requestedKeyword, normalizedKeyword)
      );
    } catch (error) {
      if (error.code === NO_MEMES_ERROR_CODE && normalizedKeyword !== FALLBACK_KEYWORD) {
        logger.warn(
          `No memes for keyword "${requestedKeyword}" (${normalizedKeyword}). Falling back to "${FALLBACK_KEYWORD}"`,
          'MEME',
          error.meta
        );

        const fallbackNormalized = normalizeKeyword(FALLBACK_KEYWORD);
        const fallbackCacheKey = getCacheKey(fallbackNormalized);

        const fallbackData = await Cache.getOrCreate(fallbackCacheKey, () =>
          fetchMemes(FALLBACK_KEYWORD, fallbackNormalized)
        );

        memesData = {
          ...fallbackData,
          keyword: requestedKeyword,
          resolvedKeyword: fallbackData.resolvedKeyword,
          fallbackUsed: true,
        };
      } else {
        throw error;
      }
    }

    memoryCache.set(cacheKey, memesData, MEMORY_TTL_MS);

    res.status(200).json({
      success: true,
      data: memesData,
    });
  } catch (error) {
    next(error);
  }
};

