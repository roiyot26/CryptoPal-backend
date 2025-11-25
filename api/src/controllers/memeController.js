import { getMemesForUser } from '../services/memeService.js';

export const getMemes = async (req, res, next) => {
  try {
    const memesData = await getMemesForUser(req.user?.preferences);
    res.status(200).json({
      success: true,
      data: memesData,
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

