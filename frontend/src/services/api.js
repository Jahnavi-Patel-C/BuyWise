const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
  : '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('buywise_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  };

  const response = await fetch(url, config);
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

