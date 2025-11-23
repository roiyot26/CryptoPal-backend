// API Client utilities for external API calls

export const cryptopanicClient = async (endpoint, params = {}) => {
  const apiKey = process.env.CRYPTOPANIC_API_KEY || 'a99e5c3ffb5190c39855b2a1579cdacf4e9fa546';
  if (!apiKey) {
    throw new Error('CryptoPanic API key not configured');
  }

  const baseUrl = 'https://cryptopanic.com/api/developer/v2';
  const queryParams = new URLSearchParams({
    auth_token: apiKey,
  });

  // Add other params
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      queryParams.append(key, params[key]);
    }
  });

  const url = `${baseUrl}${endpoint}?${queryParams.toString()}`;

  const response = await fetch(url);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('CryptoPanic API error response:', errorText);
    throw new Error(`CryptoPanic API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data;
};

export const coingeckoClient = async (endpoint, params = {}) => {
  const apiKey = process.env.COINGECKO_API_KEY;
  const baseUrl = 'https://api.coingecko.com/api/v3';

  let url = `${baseUrl}${endpoint}`;
  
  if (Object.keys(params).length > 0) {
    const queryParams = new URLSearchParams(params);
    url += `?${queryParams.toString()}`;
  }

  const headers = {};
  if (apiKey) {
    headers['x-cg-demo-api-key'] = apiKey;
  }

  const response = await fetch(url, { headers });
  
  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.statusText}`);
  }

  return await response.json();
};

// List of models to try in order (fallback system)
const OPENROUTER_MODELS = [
  'x-ai/grok-4.1-fast:free',
  'x-ai/grok-4.1-fast',
  'kwaipilot/kat-coder-pro:free',
  'nvidia/nemotron-nano-12b-v2-vl:free',
];

const tryOpenRouterRequest = async (apiKey, messages, model) => {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
      'X-Title': 'CryptoPal Dashboard',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 150,
    }),
  });

  if (!response.ok) {
    let errorMessage = `OpenRouter API error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || errorData.message || errorMessage;
    } catch (e) {
      const errorText = await response.text();
      console.error('OpenRouter API error response:', errorText);
    }
    throw new Error(errorMessage);
  }

  return await response.json();
};

export const openRouterClient = async (messages, model = null) => {
  const apiKey = process.env.OPENROUTER_API_KEY || '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';
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  // If a specific model is provided, try only that one
  if (model) {
    try {
      return await tryOpenRouterRequest(apiKey, messages, model);
    } catch (error) {
      console.error(`OpenRouter API call failed with model ${model}:`, error.message);
      throw error;
    }
  }

  // Try models in order until one works
  let lastError = null;
  for (const tryModel of OPENROUTER_MODELS) {
    try {
      // Try next model (logging handled by logger utility if needed)
      const data = await tryOpenRouterRequest(apiKey, messages, tryModel);
      return data;
    } catch (error) {
      lastError = error;
      // If it's a 404 (model not found), try the next model
      if (error.message.includes('404') || error.message.includes('No endpoints found')) {
        continue;
      }
      // For other errors, throw immediately
      throw error;
    }
  }

  // If all models failed, throw the last error
  throw lastError || new Error('All OpenRouter models failed');
};

