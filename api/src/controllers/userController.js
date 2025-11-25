import {
  getUserPreferences as fetchUserPreferences,
  updateUserPreferences as persistUserPreferences,
} from '../services/userService.js';

// @desc    Get user preferences
// @route   GET /api/users/preferences
// @access  Private
export const getPreferences = async (req, res, next) => {
  try {
    const preferences = await fetchUserPreferences(req.user.id);
    res.status(200).json({
      success: true,
      preferences,
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

// @desc    Update user preferences
// @route   PUT /api/users/preferences
// @access  Private
export const updatePreferences = async (req, res, next) => {
  try {
    const { preferences, onboarded } = await persistUserPreferences(req.user.id, req.body);
    res.status(200).json({
      success: true,
      preferences,
      onboarded,
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

