import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api.js';

const ThemeContext = createContext(null);

function getInitialTheme() {
  const stored = localStorage.getItem('aerlume_theme');
  if (stored === 'light' || stored === 'dark') return stored;
  // Fall back to the OS preference on first visit.
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('aerlume_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      // Best-effort sync to the user's saved preference if logged in —
      // failure here (e.g. not authenticated) shouldn't block the toggle.
      api.patch('/auth/me', { preferences: { theme: next } }).catch(() => {});
      return next;
    });
  }, []);

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
