/**
 * Navigation type definitions
 * 
 * Centralizes all navigation-related types to ensure consistency
 * across sidebar, routing, and module registration.
 */

export interface NavItem {
  /** Unique identifier for the nav item */
  id: string;
  /** Display label */
  label: string;
  /** Route path (used by React Router) */
  path: string;
  /** Icon identifier (maps to icon component) */
  icon: string;
  /** Brief description shown in tooltips and module pages */
  description: string;
  /** Whether the module is currently available */
  isActive: boolean;
}

export interface NavGroup {
  /** Group label displayed in sidebar */
  label: string;
  /** Navigation items within this group */
  items: NavItem[];
}

export type Theme = 'light' | 'dark';

export type SidebarState = 'expanded' | 'collapsed';
