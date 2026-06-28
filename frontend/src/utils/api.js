// src/utils/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Unwrap error messages from the backend
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.message ||
      (err.code === 'ECONNABORTED' ? 'Request timed out. Please try again.' : 'Network error. Please check your connection.');
    const error = new Error(message);
    error.response = err.response;
    error.status = err.response?.status;
    return Promise.reject(error);
  }
);

export default api;
