// API.JS - API utility functions aligned with the FastAPI backend

const API_BASE_URL = (() => {
  const stored = localStorage.getItem('creditiq.apiBase');
  if (stored) return stored.replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.location.protocol !== 'file:') {
    return window.location.origin.replace(/\/$/, '');
  }
  return 'http://127.0.0.1:8000';
})();

const API_TIMEOUT = 30000;

function buildApiEndpoint(endpoint) {
  return endpoint.startsWith('/') ? `${API_BASE_URL}${endpoint}` : `${API_BASE_URL}/${endpoint}`;
}

function getStoredUser() {
  const raw = sessionStorage.getItem('creditiq.user') || localStorage.getItem('creditiq.user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function apiCall(endpoint, options = {}) {
  const url = buildApiEndpoint(endpoint);
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = typeof getAuthToken === 'function' ? getAuthToken() : (sessionStorage.getItem('creditiq.token') || localStorage.getItem('authToken'));
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      method: options.method || 'GET',
      headers,
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.detail || `API Error: ${response.status}`);
    }
    return data;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function login(username, password) {
  const response = await apiCall('/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

  const token = response.access_token || response.token;
  if (token) {
    if (typeof setAuthToken === 'function') setAuthToken(token);
    localStorage.setItem('authToken', token);
    sessionStorage.setItem('creditiq.token', token);
  }
  if (response.user) {
    sessionStorage.setItem('creditiq.user', JSON.stringify(response.user));
  }
  return response;
}

async function signup(email, username, password) {
  return apiCall('/signup', {
    method: 'POST',
    body: JSON.stringify({ email, username, password }),
  });
}

async function getCurrentUser() {
  return getStoredUser();
}

function logout() {
  if (typeof clearAuthToken === 'function') clearAuthToken();
  localStorage.removeItem('authToken');
  localStorage.removeItem('creditiq.user');
  sessionStorage.removeItem('creditiq.token');
  sessionStorage.removeItem('creditiq.user');
}

async function getBuilds(owner = 'guest') {
  return apiCall(`/api/builds?owner=${encodeURIComponent(owner)}`);
}

async function getBuild(buildName, owner = 'guest') {
  return apiCall(`/builds/${encodeURIComponent(buildName)}?owner=${encodeURIComponent(owner)}`);
}

async function createBuild(buildData) {
  return apiCall('/builds', {
    method: 'POST',
    body: JSON.stringify(buildData),
  });
}

async function updateBuild(buildName, buildData = {}) {
  return apiCall('/builds', {
    method: 'POST',
    body: JSON.stringify({
      ...buildData,
      name: buildData.name || buildData.build_name || buildName,
    }),
  });
}

async function deleteBuild(buildName, owner = 'guest') {
  return apiCall(`/builds/${encodeURIComponent(buildName)}?owner=${encodeURIComponent(owner)}`, {
    method: 'DELETE',
  });
}

async function getVariables(buildId) {
  return apiCall(`/builder/variables?build_id=${encodeURIComponent(buildId)}`);
}

async function createVariable(buildName, variableData, owner = 'guest') {
  return apiCall('/builder/variable', {
    method: 'POST',
    body: JSON.stringify({
      build_name: buildName,
      owner,
      variable: variableData,
      auto_config: true,
    }),
  });
}

async function updateVariable(buildName, variableData, owner = 'guest') {
  return createVariable(buildName, variableData, owner);
}

async function deleteVariable(buildName, variableName, owner = 'guest') {
  return apiCall(`/builds/${encodeURIComponent(buildName)}/variable/${encodeURIComponent(variableName)}?owner=${encodeURIComponent(owner)}`, {
    method: 'DELETE',
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    apiCall,
    login,
    signup,
    getCurrentUser,
    logout,
    getBuilds,
    getBuild,
    createBuild,
    updateBuild,
    deleteBuild,
    getVariables,
    createVariable,
    updateVariable,
    deleteVariable,
  };
}
