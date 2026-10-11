import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'aerlume_token';

export const getToken = () => SecureStore.getItemAsync(TOKEN_KEY);
export const setToken = (token) => SecureStore.setItemAsync(TOKEN_KEY, token);
export const clearToken = () => SecureStore.deleteItemAsync(TOKEN_KEY);

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api',
});

// SecureStore access is async, so this interceptor itself is async —
// axios waits for the returned promise before sending the request.
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await clearToken();
    }
    return Promise.reject(error);
  }
);
