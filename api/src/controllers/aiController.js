import { getDailyInsight } from '../services/aiService.js';

// @desc    Get AI insight
// @route   GET /api/ai/insight
// @access  Private
export const getAIInsight = async (req, res, next) => {
  try {
    const insightData = await getDailyInsight(req.user.preferences);
    res.status(200).json({
      success: true,
      data: insightData,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

