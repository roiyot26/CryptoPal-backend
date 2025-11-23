// Auth utility functions for token management
// Currently using localStorage mock - will be replaced with actual backend API calls

const TOKEN_KEY = 'cryptopal_token';
const USER_KEY = 'cryptopal_user';
const USERS_KEY = 'cryptopal_users'; // Store registered users

// Initialize users array if it doesn't exist
const getUsers = () => {
  const usersStr = localStorage.getItem(USERS_KEY);
  return usersStr ? JSON.parse(usersStr) : [];
};

// Save users array
const saveUsers = (users) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const authService = {
  // Store token and user data (mock for now)
  setAuth: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
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
  savePreferences: (preferences) => {
    const user = authService.getUser();
    if (user) {
      const updatedUser = {
        ...user,
        preferences,
        onboarded: true,
      };
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      
      // Also update in users array
      const users = getUsers();
      const userIndex = users.findIndex(u => u.email === user.email);
      if (userIndex !== -1) {
        users[userIndex] = {
          ...users[userIndex],
          preferences,
          onboarded: true,
        };
        saveUsers(users);
      }
    }
  },

  // Get user preferences
  getPreferences: () => {
    const user = authService.getUser();
    return user && user.preferences ? user.preferences : null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  // Clear authentication data
  clearAuth: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  // Mock API calls - will be replaced with actual backend integration
  login: async (email, password) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const users = getUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
      throw new Error('User not found. Please sign up first.');
    }

    if (user.password !== password) {
      throw new Error('Invalid email or password');
    }

    const mockToken = 'mock_jwt_token_' + Date.now();
    const mockUser = {
      email: user.email,
      name: user.name,
      onboarded: user.onboarded || false,
      preferences: user.preferences || null,
    };
    
    authService.setAuth(mockToken, mockUser);
    return { success: true, token: mockToken, user: mockUser };
  },

  signup: async (email, name, password) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!email || !name || !password) {
      throw new Error('All fields are required');
    }

    const users = getUsers();
    
    // Check if user already exists
    if (users.find(u => u.email === email)) {
      throw new Error('User with this email already exists');
    }

    // Create new user
    const newUser = {
      email,
      name,
      password, // In real app, this would be hashed
    };

    users.push(newUser);
    saveUsers(users);

    const mockToken = 'mock_jwt_token_' + Date.now();
    const mockUser = {
      email: newUser.email,
      name: newUser.name,
      onboarded: false, // New users haven't completed onboarding
      preferences: null,
    };
    
    authService.setAuth(mockToken, mockUser);
    return { success: true, token: mockToken, user: mockUser };
  },
};

