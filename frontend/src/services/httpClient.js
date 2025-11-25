const isProduction =
  import.meta.env.PROD ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost');

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || (isProduction ? '/api' : 'http://localhost:5001/api');

let getToken = () => null;
let onUnauthorized = () => {};

export const configureHttpClient = ({ tokenProvider, unauthorizedHandler } = {}) => {
  if (typeof tokenProvider === 'function') {
    getToken = tokenProvider;
  }
  if (typeof unauthorizedHandler === 'function') {
    onUnauthorized = unauthorizedHandler;
  }
};

const buildHeaders = (options) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (options.withAuth !== false) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
};

const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    if (response.status === 401) {
      onUnauthorized();
    }
    const message =
      (isJson && (payload.message || payload.error)) ||
      payload ||
      'Request failed';
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
};

const prepareBody = (body) => {
  if (!body) {
    return undefined;
  }

  if (body instanceof FormData || typeof body === 'string') {
    return body;
  }

  return JSON.stringify(body);
};

export const httpClient = {
  request: async (endpoint, options = {}) => {
    const config = {
      method: options.method || 'GET',
      headers: buildHeaders(options),
      signal: options.signal,
    };

    if (options.body !== undefined) {
      config.body = prepareBody(options.body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    return handleResponse(response);
  },
  get: (endpoint, options = {}) =>
    httpClient.request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) =>
    httpClient.request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options = {}) =>
    httpClient.request(endpoint, { ...options, method: 'PUT', body }),
  delete: (endpoint, options = {}) =>
    httpClient.request(endpoint, { ...options, method: 'DELETE' }),
};


