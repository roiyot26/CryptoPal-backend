import Cache from '../models/Cache.js';
import { openRouterClient } from '../utils/apiClients.js';
import logger from '../utils/logger.js';

// @desc    Get AI insight
// @route   GET /api/ai/insight
// @access  Private
export const getAIInsight = async (req, res, next) => {
  try {
    const userPreferences = req.user.preferences;
    const investorType = userPreferences?.investorType || 'general';
    const cryptoAssets = userPreferences?.cryptoAssets || [];

    // Create cache key for daily insight - include user preferences for personalization
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const assetsKey = cryptoAssets.length > 0 ? cryptoAssets.sort().join('_') : 'default';
    const cacheKey = `ai_insight_${today}_${assetsKey}`;

    const fetchInsight = async () => {
      try {
        const assetsList = cryptoAssets.length > 0 
          ? cryptoAssets.join(', ') 
          : 'Bitcoin and Ethereum';

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
          insight = choice?.message?.content || 
                   choice?.message?.text ||
                   choice?.text || 
                   insight;
        } else if (response.message) {
          insight = response.message;
        } else if (response.text) {
          insight = response.text;
        }
        
        // Clean up the insight text
        insight = insight.trim();
        
        if (!insight || insight === 'Unable to generate insight at this time.') {
          // Fallback insight
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

    const insightData = await Cache.getOrCreate(cacheKey, fetchInsight, 24); // Cache for 24 hours (daily)

    res.status(200).json({
      success: true,
      data: insightData,
    });
  } catch (error) {
    next(error);
  }
};

