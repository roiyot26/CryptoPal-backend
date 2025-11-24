// Auth utility functions for API integration
// Use relative URLs in production (same domain), localhost in development
const isProduction = import.meta.env.PROD || (typeof window !== 'undefined' && window.location.hostname !== 'localhost');
export const API_BASE_URL = import.meta.env.VITE_API_URL || (isProduction ? '/api' : 'http://localhost:5001/api');

const TOKEN_KEY = 'cryptopal_token';
const USER_KEY = 'cryptopal_user';
const AUTH_EVENT = 'cryptopal-auth-changed';
const isBrowser = typeof window !== 'undefined';

const notifyAuthChange = () => {
  if (isBrowser) {
    window.dispatchEvent(new Event(AUTH_EVENT));
  }
};

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem(TOKEN_KEY);
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

export const authService = {
  // Store token and user data
  setAuth: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    notifyAuthChange();
  },

  // Get stored token
  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },

  // Get stored user data
  getUser: () => {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if user has completed onboarding
  hasCompletedOnboarding: () => {
    const user = authService.getUser();
    return user && user.onboarded === true;
  },

  // Save user preferences
  savePreferences: async (preferences) => {
    try {
      const response = await apiCall('/users/preferences', {
        method: 'PUT',
        body: preferences,
      });

      if (response.success) {
        const user = authService.getUser();
        if (user) {
          const updatedUser = {
            ...user,
            preferences: response.preferences,
            onboarded: response.onboarded,
          };
          localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
          notifyAuthChange();
        }
        return response;
      }
    } catch (error) {
      throw error;
    }
  },

  // Get user preferences
  getPreferences: async () => {
    try {
      const response = await apiCall('/users/preferences');
      return response.preferences;
    } catch (error) {
      throw error;
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  // Clear authentication data
  clearAuth: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    notifyAuthChange();
  },

  logout: () => {
    authService.clearAuth();
  },

  // Register new user
  signup: async (email, name, password) => {
    try {
      const response = await apiCall('/auth/register', {
        method: 'POST',
        body: { email, name, password },
      });

      if (response.success) {
        authService.setAuth(response.token, response.user);
        return response;
      }
    } catch (error) {
      throw error;
    }
  },

  // Login user
  login: async (email, password) => {
    try {
      const response = await apiCall('/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      if (response.success) {
        authService.setAuth(response.token, response.user);
        return response;
      }
    } catch (error) {
      throw error;
    }
  },

  // Get current user from API
  getCurrentUser: async () => {
    try {
      const response = await apiCall('/auth/me');
      if (response.success) {
        authService.setAuth(authService.getToken(), response.user);
        return response.user;
      }
    } catch (error) {
      // If token is invalid, clear auth
      authService.clearAuth();
      throw error;
    }
  },

  subscribe: (callback) => {
    if (!isBrowser) {
      return () => {};
    }
    window.addEventListener(AUTH_EVENT, callback);
    return () => window.removeEventListener(AUTH_EVENT, callback);
  },
};
