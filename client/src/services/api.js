import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token from localStorage to every outbound request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sentinelai_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials).then((r) => r.data),
  register: (userData) => api.post('/auth/register', userData).then((r) => r.data),
  getMe: () => api.get('/auth/me').then((r) => r.data),
};

export const threatsApi = {
  getStats: () => api.get('/threats/stats').then((r) => r.data),
  getThreats: (params = {}) => api.get('/threats', { params }).then((r) => r.data),
  getThreatById: (id) => api.get(`/threats/${id}`).then((r) => r.data),
  updateStatus: (id, { resolved, notes }) =>
    api.patch(`/threats/${id}/status`, { resolved, notes }).then((r) => r.data),
  inspect: (payload) => api.post('/threats/inspect', payload).then((r) => r.data),
};

export const systemApi = {
  getHealth: () => api.get('/health').then((r) => r.data),
};

export const adminApi = {
  getStats: () => api.get('/admin/stats').then((r) => r.data),
  getUsers: (params = {}) => api.get('/admin/users', { params }).then((r) => r.data),
  getUserById: (id) => api.get(`/admin/users/${id}`).then((r) => r.data),
  updateRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }).then((r) => r.data),
  updateStatus: (id, status) => api.patch(`/admin/users/${id}/status`, { status }).then((r) => r.data),
  unlockUser: (id) => api.post(`/admin/users/${id}/unlock`).then((r) => r.data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`).then((r) => r.data),
};

export default api;
