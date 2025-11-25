import { getNewsForUser } from '../services/newsService.js';

// @desc    Get crypto news
// @route   GET /api/news
// @access  Private
export const getNews = async (req, res, next) => {
  try {
    const newsData = await getNewsForUser(req.user.preferences);
    res.status(200).json({
      success: true,
      data: newsData,
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

