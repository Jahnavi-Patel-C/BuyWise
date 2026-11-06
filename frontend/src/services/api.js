function resolveApiBase() {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl || typeof envUrl !== 'string') {
    return '/api';
  }
  let clean = envUrl.trim().replace(/\/+$/, '');
  // If remote URL was configured without /api suffix (e.g. https://buywise-backend.onrender.com), ensure /api is attached
  if (clean.startsWith('http') && !clean.endsWith('/api')) {
    clean = `${clean}/api`;
  }
  return clean;
}

const API_BASE = resolveApiBase();

function getAuthHeaders() {
  const token = localStorage.getItem('buywise_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(endpoint, options = {}) {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE}${normalizedEndpoint}`;

  // 60-second timeout provides tolerance for Render free-tier cold-start wakeups
  const timeoutMs = options.timeoutMs || 60000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const config = {
    ...options,
    signal: controller.signal,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      const timeoutError = new Error(
        'Server took too long to respond. Render free-tier backends spin down on idle and take ~30-45s to wake up. Please wait 15 seconds and try again.'
      );
      timeoutError.status = 504;
      throw timeoutError;
    }
    const networkError = new Error(
      `Cannot connect to BuyWise backend (${API_BASE}). If the server is waking up from idle sleep, please wait 15 seconds and retry.`
    );
    networkError.status = 0;
    networkError.cause = err;
    throw networkError;
  } finally {
    clearTimeout(timeoutId);
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  auth: {
    register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    getMe: () => request('/auth/me'),
    loadDemo: () => request('/seed/demo', { method: 'POST' }),
  },
  profile: {
    get: () => request('/profile'),
    update: (body) => request('/profile', { method: 'PUT', body: JSON.stringify(body) }),
  },
  transactions: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/transactions${query ? `?${query}` : ''}`);
    },
    create: (body) => request('/transactions', { method: 'POST', body: JSON.stringify(body) }),
    delete: (id) => request(`/transactions/${id}`, { method: 'DELETE' }),
    autoCategorize: (description) =>
      request('/transactions/auto-categorize', { method: 'POST', body: JSON.stringify({ description }) }),
  },
  obligations: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/obligations${query ? `?${query}` : ''}`);
    },
    create: (body) => request('/obligations', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/obligations/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id) => request(`/obligations/${id}`, { method: 'DELETE' }),
  },
  decisions: {
    evaluatePurchase: (body) => request('/decisions/evaluate-purchase', { method: 'POST', body: JSON.stringify(body) }),
    evaluateDaily: (body) => request('/decisions/evaluate-daily', { method: 'POST', body: JSON.stringify(body) }),
    simulate: (body) => request('/decisions/simulate', { method: 'POST', body: JSON.stringify(body) }),
    getHistory: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/decisions/history${query ? `?${query}` : ''}`);
    },
    deleteHistory: (id) => request(`/decisions/history/${id}`, { method: 'DELETE' }),
  },
  analytics: {
    getIntelligence: () => request('/analytics/spending-intelligence'),
    getRecommendations: () => request('/analytics/recommendations'),
    getTimeline: () => request('/analytics/timeline'),
  },
};

