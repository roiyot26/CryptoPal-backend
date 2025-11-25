import {
  getPriceHistory as fetchPriceHistory,
  getPricesForUser,
} from '../services/priceService.js';

// @desc    Get historical price data for a coin
// @route   GET /api/prices/:coinId/history
// @access  Private
export const getPriceHistory = async (req, res, next) => {
  try {
    const historyData = await fetchPriceHistory({
      coinId: req.params.coinId,
      days: req.query.days || '7',
    });
    res.status(200).json({
      success: true,
      data: historyData,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        coinId: req.params.coinId,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to fetch price history',
    });
  }
};

// @desc    Get coin prices
// @route   GET /api/prices
// @access  Private
export const getPrices = async (req, res, next) => {
  try {
    const pricesData = await getPricesForUser(req.user.preferences);
    res.status(200).json({
      success: true,
      data: pricesData,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prices',
    });
  }
};

