import { httpClient, configureHttpClient } from './httpClient.js';

const TOKEN_KEY = 'cryptopal_token';
const USER_KEY = 'cryptopal_user';
const AUTH_EVENT = 'cryptopal-auth-changed';
const isBrowser = typeof window !== 'undefined';

const notifyAuthChange = () => {
  if (isBrowser) {
    window.dispatchEvent(new Event(AUTH_EVENT));
  }
};

const getStoredToken = () => {
  if (!isBrowser) return null;
  return localStorage.getItem(TOKEN_KEY);
};

const getStoredUser = () => {
  if (!isBrowser) return null;
  const userStr = localStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

const clearAuthData = () => {
  if (!isBrowser) return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  notifyAuthChange();
};

configureHttpClient({
  tokenProvider: getStoredToken,
  unauthorizedHandler: clearAuthData,
});

const persistUser = (user) => {
  if (!isBrowser) return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

const persistToken = (token) => {
  if (!isBrowser) return;
  localStorage.setItem(TOKEN_KEY, token);
};

export const authService = {
  setAuth: (token, user) => {
    persistToken(token);
    persistUser(user);
    notifyAuthChange();
  },
  getToken: getStoredToken,
  getUser: getStoredUser,
  hasCompletedOnboarding: () => {
    const user = getStoredUser();
    return user && user.onboarded === true;
  },
  savePreferences: async (preferences) => {
    const response = await httpClient.put('/users/preferences', preferences);
    if (response.success) {
      const user = getStoredUser();
      if (user) {
        const updatedUser = {
          ...user,
          preferences: response.preferences,
          onboarded: response.onboarded,
        };
        persistUser(updatedUser);
        notifyAuthChange();
      }
    }
    return response;
  },
  getPreferences: async () => {
    const response = await httpClient.get('/users/preferences');
    return response.preferences;
  },
  isAuthenticated: () => !!getStoredToken(),
  clearAuth: () => {
    clearAuthData();
  },
  logout: () => {
    clearAuthData();
  },
  signup: async (email, name, password) => {
    const response = await httpClient.post('/auth/register', {
      email,
      name,
      password,
    });
    if (response.success) {
      authService.setAuth(response.token, response.user);
    }
    return response;
  },
  login: async (email, password) => {
    const response = await httpClient.post('/auth/login', {
      email,
      password,
    });
    if (response.success) {
      authService.setAuth(response.token, response.user);
    }
    return response;
  },
  getCurrentUser: async () => {
    const response = await httpClient.get('/auth/me');
    if (response.success) {
      const token = getStoredToken();
      if (token) {
        authService.setAuth(token, response.user);
      }
      return response.user;
    }
    return null;
  },
  subscribe: (callback) => {
    if (!isBrowser) {
      return () => {};
    }
    window.addEventListener(AUTH_EVENT, callback);
    return () => window.removeEventListener(AUTH_EVENT, callback);
  },
};


