import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
import { comparePassword } from '../utils/password.js';

const sanitizeUser = (userDoc) => ({
  id: userDoc._id,
  email: userDoc.email,
  name: userDoc.name,
  onboarded: userDoc.onboarded,
  preferences: userDoc.preferences,
});

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const registerUser = async ({ email, name, password }) => {
  if (!email || !name || !password) {
    throw createHttpError(400, 'Please provide all required fields');
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    throw createHttpError(400, 'User already exists');
  }

  const user = await User.create({
    email,
    name,
    password,
    onboarded: false,
  });

  const token = generateToken(user._id);

  return {
    token,
    user: sanitizeUser(user),
  };
};

export const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    throw createHttpError(400, 'Please provide email and password');
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw createHttpError(401, 'Invalid credentials');
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    throw createHttpError(401, 'Invalid credentials');
  }

  const token = generateToken(user._id);

  return {
    token,
    user: sanitizeUser(user),
  };
};

export const getCurrentUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  return sanitizeUser(user);
};


