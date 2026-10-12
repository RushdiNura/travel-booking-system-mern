import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // sends the httpOnly auth cookie
});

// Also attach a bearer token from localStorage as a fallback for clients
// that store it there (e.g. during local dev without cookie support).
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('aerlume_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    // Centralized place to react to auth expiry — components can still
    // catch specific errors themselves via the rejected promise.
    if (error.response?.status === 401) {
      localStorage.removeItem('aerlume_token');
    }
    return Promise.reject(error);
  }
);
