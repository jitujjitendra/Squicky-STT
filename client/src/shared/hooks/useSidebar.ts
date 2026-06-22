/**
 * Sidebar Hook
 * 
 * Manages sidebar expand/collapse state with localStorage persistence
 * and responsive behavior for mobile/tablet breakpoints.
 * 
 * Architecture decision: Sidebar state is persisted to localStorage
 * so user preferences survive page refreshes. On mobile, the sidebar
 * is always hidden by default and shown as an overlay.
 */

import { useCallback, useEffect, useState } from 'react';
import type { SidebarState } from '@/types';

const STORAGE_KEY = 'squicky-sidebar-state';
const MOBILE_BREAKPOINT = 768;

/**
 * Reads persisted sidebar state from localStorage
 */
function getStoredState(): SidebarState {
  if (typeof window === 'undefined') return 'expanded';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'expanded' || stored === 'collapsed') return stored;
  return 'expanded';
}

export function useSidebar() {
  const [state, setState] = useState<SidebarState>(getStoredState);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Track viewport width for responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile sidebar when switching to desktop
  useEffect(() => {
    if (!isMobile) {
      setIsMobileOpen(false);
    }
  }, [isMobile]);

  const toggle = useCallback(() => {
    if (isMobile) {
      setIsMobileOpen((prev) => !prev);
    } else {
      setState((prev) => {
        const next = prev === 'expanded' ? 'collapsed' : 'expanded';
        localStorage.setItem(STORAGE_KEY, next);
        return next;
      });
    }
  }, [isMobile]);

  const collapse = useCallback(() => {
    setState('collapsed');
    localStorage.setItem(STORAGE_KEY, 'collapsed');
  }, []);

  const expand = useCallback(() => {
    setState('expanded');
    localStorage.setItem(STORAGE_KEY, 'expanded');
  }, []);

  const closeMobile = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  const isCollapsed = state === 'collapsed';

  return {
    state,
    isCollapsed,
    isMobile,
    isMobileOpen,
    toggle,
    collapse,
    expand,
    closeMobile,
  };
}
