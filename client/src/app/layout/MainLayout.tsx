/**
 * Main Layout Component - Premium Edition
 * 
 * Orchestrates the complete application layout:
 * - Fixed header (56px top) with glassmorphism
 * - Collapsible sidebar (240px / 64px) with gradient background
 * - Fluid main content area
 * - Subtle footer (40px)
 * 
 * Architecture decision: Layout uses CSS variables for dimensions
 * so all child components can reference them. The sidebar width
 * transition is CSS-driven for smooth 60fps animation.
 * 
 * Responsive behavior:
 * - Desktop (1024+): Full layout with collapsible sidebar
 * - Tablet (768-1024): Collapsed sidebar by default
 * - Mobile (<768): Hamburger menu with overlay sidebar
 */

import { Outlet } from 'react-router-dom';
import { useSidebar } from '@/shared/hooks';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

export function MainLayout() {
  const sidebar = useSidebar();

  // Calculate content margin based on sidebar state
  const contentMargin = sidebar.isMobile
    ? '0px'
    : sidebar.isCollapsed
    ? 'var(--sidebar-collapsed-width)'
    : 'var(--sidebar-width)';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Fixed Header */}
      <Header
        onMenuToggle={sidebar.toggle}
        isSidebarCollapsed={sidebar.isCollapsed}
        isMobile={sidebar.isMobile}
      />

      {/* Sidebar */}
      <Sidebar
        isCollapsed={sidebar.isCollapsed}
        onToggle={sidebar.toggle}
        isMobile={sidebar.isMobile}
        isMobileOpen={sidebar.isMobileOpen}
        onCloseMobile={sidebar.closeMobile}
      />

      {/* Main content area */}
      <main
        className="flex-1 pt-header transition-[margin-left] duration-300 ease-in-out"
        style={{ marginLeft: contentMargin }}
      >
        {/* Page content from route */}
        <div className="p-4 md:p-6 lg:p-8 min-h-[calc(100vh-var(--header-height)-var(--footer-height))]">
          <Outlet />
        </div>

        {/* Footer */}
        <Footer />
      </main>
    </div>
  );
}
