import Cache from '../models/Cache.js';
import { openRouterClient } from '../utils/apiClients.js';
import logger from '../utils/logger.js';
import memoryCache from '../utils/memoryCache.js';

const MEMORY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export const getDailyInsight = async (userPreferences = {}) => {
  const investorType = userPreferences.investorType || 'general';
  const cryptoAssets = userPreferences.cryptoAssets || [];
  const today = new Date().toISOString().split('T')[0];
  const assetsKey = cryptoAssets.length > 0 ? cryptoAssets.slice().sort().join('_') : 'default';
  const cacheKey = `ai_insight_${today}_${assetsKey}`;

  const cachedInsight = memoryCache.get(cacheKey);
  if (cachedInsight) {
    return cachedInsight;
  }

  const fetchInsight = async () => {
    try {
      const assetsList = cryptoAssets.length > 0 ? cryptoAssets.join(', ') : 'Bitcoin and Ethereum';
      const prompt = `As a crypto investment advisor, provide a brief daily insight (2-3 sentences) for a ${investorType} investor interested in ${assetsList}. Make it practical and actionable.`;

      const response = await openRouterClient([
        {
          role: 'system',
          content: 'You are a helpful crypto investment advisor. Provide concise, practical insights in 2-3 sentences.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ]);

      logger.debug('OpenRouter API response received', 'AI', {
        hasChoices: !!response.choices,
        choicesCount: response.choices?.length || 0,
      });

      let insight = 'Unable to generate insight at this time.';

      if (response.choices && response.choices.length > 0) {
        const choice = response.choices[0];
        insight = choice?.message?.content || choice?.message?.text || choice?.text || insight;
      } else if (response.message) {
        insight = response.message;
      } else if (response.text) {
        insight = response.text;
      }

      insight = insight.trim();

      if (!insight || insight === 'Unable to generate insight at this time.') {
        insight = `For ${investorType} investors interested in ${assetsList}, consider diversifying your portfolio and staying informed about market trends. Always do your own research before making investment decisions.`;
      }

      return {
        insight,
        date: today,
        investorType,
        assets: cryptoAssets,
      };
    } catch (error) {
      logger.error('OpenRouter API error', 'AI', error.message);
      throw error;
    }
  };

  const insightData = await Cache.getOrCreate(cacheKey, fetchInsight, 24);
  memoryCache.set(cacheKey, insightData, MEMORY_TTL_MS);

  return insightData;
};


