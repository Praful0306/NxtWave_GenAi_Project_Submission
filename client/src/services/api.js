import axios from 'axios';
import useAuthStore from '../store/authStore';

/**
 * Axios instance for server-node (CRUD API).
 * Base URL points to the Node backend.
 * Automatically attaches Bearer token from auth store.
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * OAuth is a full-page redirect to server-node, so it can't go through axios.
 * Derived from the same base URL — hardcoding localhost here breaks production.
 */
export const oauthUrl = (provider) => `${API_BASE_URL}/auth/${provider}`;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request interceptor: attach JWT ───
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor: handle 401 → logout ───
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
