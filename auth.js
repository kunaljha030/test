// ════════════════════════════════════════════════════════════════
// AUTH.JS - Authentication utilities for testing
// Default credentials: username: guest, password: guest
// ════════════════════════════════════════════════════════════════

const testCredentials = {
  username: 'guest',
  password: 'guest'
};

function validateCredentials(username, password) {
  return username === testCredentials.username && password === testCredentials.password;
}

function getAuthToken() {
  return localStorage.getItem('authToken');
}

function setAuthToken(token) {
  localStorage.setItem('authToken', token);
}

function clearAuthToken() {
  localStorage.removeItem('authToken');
}

function isAuthenticated() {
  return !!getAuthToken();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testCredentials,
    validateCredentials,
    getAuthToken,
    setAuthToken,
    clearAuthToken,
    isAuthenticated
  };
}
