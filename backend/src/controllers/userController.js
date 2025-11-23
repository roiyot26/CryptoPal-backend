import User from '../models/User.js';

// @desc    Get user preferences
// @route   GET /api/users/preferences
// @access  Private
export const getPreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      preferences: user.preferences,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user preferences
// @route   PUT /api/users/preferences
// @access  Private
export const updatePreferences = async (req, res, next) => {
  try {
    const { cryptoAssets, investorType, contentTypes } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        preferences: {
          cryptoAssets: cryptoAssets || [],
          investorType: investorType || '',
          contentTypes: contentTypes || [],
        },
        onboarded: true,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      preferences: user.preferences,
      onboarded: user.onboarded,
    });
  } catch (error) {
    next(error);
  }
};

