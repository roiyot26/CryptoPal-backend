import User from '../models/User.js';

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const getUserPreferences = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  return user.preferences;
};

export const updateUserPreferences = async (userId, { cryptoAssets, investorType, contentTypes }) => {
  const user = await User.findByIdAndUpdate(
    userId,
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
    },
  );

  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  return {
    preferences: user.preferences,
    onboarded: user.onboarded,
  };
};

export const getUserDisplayName = (user) => user?.name?.trim() || 'Anonymous';


