const cache = new Map();

const getNow = () => Date.now();

export const get = (key) => {
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= getNow()) {
    cache.delete(key);
    return null;
  }

  return entry.data;
};

export const set = (key, data, ttlMs) => {
  const expiresAt = getNow() + ttlMs;
  cache.set(key, { data, expiresAt });
};

export const del = (key) => {
  cache.delete(key);
};

export const clear = () => {
  cache.clear();
};

export default {
  get,
  set,
  del,
  clear,
};

