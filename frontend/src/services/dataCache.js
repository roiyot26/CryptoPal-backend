const cacheStore = new Map();

const isExpired = (entry) => {
  if (!entry) {
    return true;
  }
  if (!entry.expiresAt) {
    return false;
  }
  return entry.expiresAt < Date.now();
};

export const getCachedData = (key) => {
  const entry = cacheStore.get(key);
  if (!entry) {
    return null;
  }
  if (isExpired(entry)) {
    cacheStore.delete(key);
    return null;
  }
  return entry.value;
};

export const setCachedData = (key, value, ttlMs = 5 * 60 * 1000) => {
  cacheStore.set(key, {
    value,
    expiresAt: ttlMs ? Date.now() + ttlMs : null,
  });
};

export const clearCachedData = (key) => {
  cacheStore.delete(key);
};


