/**
 * Theme Hook
 * 
 * Manages light/dark theme switching with localStorage persistence
 * and system preference detection.
 * 
 * Architecture decision: Theme state is stored via data-theme attribute
 * on the <html> element, allowing CSS custom properties to cascade
 * without React re-renders for theme changes.
 */

import { useCallback, useEffect, useState } from 'react';
import type { Theme } from '@/types';

const STORAGE_KEY = 'squicky-theme';

/**
 * Detects the user's system color scheme preference
 */
function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Reads the persisted theme from localStorage, falling back to system preference
 */
function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return getSystemTheme();
}

/**
 * Applies the theme to the document root element
 */
function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);

  // Apply theme on mount and when it changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't set a manual preference
      if (!localStorage.getItem(STORAGE_KEY)) {
        const newTheme = e.matches ? 'dark' : 'light';
        setThemeState(newTheme);
      }
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme };
}
