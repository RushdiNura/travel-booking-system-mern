import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setToken, clearToken } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    await setToken(data.data.token);
    setUser(data.data.user);
    return data.data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    await setToken(data.data.token);
    setUser(data.data.user);
    return data.data.user;
  };

  const logout = async () => {
    await api.post('/auth/logout').catch(() => {});
    await clearToken();
    setUser(null);
  };

  const value = { user, loading, login, register, logout, refreshSession };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
