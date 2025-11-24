import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Targets API
export const targetsAPI = {
  getAll: () => api.get('/targets'),
  getById: (id) => api.get(`/targets/${id}`),
  create: (data) => api.post('/targets', data),
  update: (id, data) => api.put(`/targets/${id}`, data),
  delete: (id) => api.delete(`/targets/${id}`),
};

// Tests API
export const testsAPI = {
  getAll: () => api.get('/tests'),
  getById: (id) => api.get(`/tests/${id}`),
  create: (data) => api.post('/tests', data),
  delete: (id) => api.delete(`/tests/${id}`),
};

// Reports API
export const reportsAPI = {
  getAll: () => api.get('/reports'),
  getById: (id) => api.get(`/reports/${id}`),
  generate: (data) => api.post('/reports/generate', data),
  delete: (id) => api.delete(`/reports/${id}`),
};

export default api;
