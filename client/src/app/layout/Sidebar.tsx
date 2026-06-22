/**
 * Sidebar Component - Premium Edition
 * 
 * Collapsible navigation sidebar (240px expanded, 64px collapsed)
 * with glassmorphism background and accent glow on active items.
 * Shows navigation groups (CORE, STUDIOS) with icon+label or icon-only.
 * On mobile, renders as a slide-in overlay with backdrop.
 * 
 * Architecture decision: Sidebar collapse state persists in localStorage
 * so user preferences survive page refreshes. Mobile uses overlay
 * pattern to avoid shifting content.
 */

import { NavLink } from 'react-router-dom';
import { Icon } from '@/shared/components/Icon';
import { navigationGroups } from '@/shared/lib/navigation';

interface SidebarProps {
  /** Whether sidebar is collapsed */
  isCollapsed: boolean;
  /** Toggle callback */
  onToggle: () => void;
  /** Whether in mobile viewport */
  isMobile: boolean;
  /** Whether mobile sidebar is open */
  isMobileOpen: boolean;
  /** Close mobile sidebar */
  onCloseMobile: () => void;
}

export function Sidebar({
  isCollapsed,
  onToggle,
  isMobile,
  isMobileOpen,
  onCloseMobile,
}: SidebarProps) {
  // Determine whether to show
  const isVisible = isMobile ? isMobileOpen : true;

  if (!isVisible && isMobile) return null;

  const sidebarContent = (
    <nav
      className={`
        flex flex-col h-full
        bg-[var(--sidebar-bg)] border-r border-[var(--border-primary)]
        backdrop-blur-xl
        transition-[width] duration-300 ease-in-out
        ${isMobile ? 'w-[var(--sidebar-width)]' : isCollapsed ? 'w-[var(--sidebar-collapsed-width)]' : 'w-[var(--sidebar-width)]'}
      `}
      aria-label="Main navigation"
    >
      {/* Sidebar header with collapse toggle */}
      <div className="h-header flex items-center justify-end px-3 border-b border-[var(--border-primary)]">
        {isMobile ? (
          <button
            onClick={onCloseMobile}
            className="p-2 rounded-button hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors"
            aria-label="Close navigation"
          >
            <Icon name="x" size={18} />
          </button>
        ) : (
          <button
            onClick={onToggle}
            className="p-2 rounded-button hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Icon name={isCollapsed ? 'chevron-right' : 'chevron-left'} size={16} />
          </button>
        )}
      </div>

      {/* Navigation groups */}
      <div className="flex-1 overflow-y-auto py-4 px-2">
        {navigationGroups.map((group) => (
          <div key={group.label} className="mb-5">
            {/* Group label (hidden when collapsed) */}
            {!isCollapsed && (
              <span className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] block">
                {group.label}
              </span>
            )}

            {/* Nav items */}
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={item.id}>
                  <NavLink
                    to={item.path}
                    onClick={() => isMobile && onCloseMobile()}
                    className={({ isActive }) => `
                      relative flex items-center gap-3 px-3 py-2.5
                      rounded-button transition-all duration-200
                      ${isCollapsed ? 'justify-center' : ''}
                      ${
                        isActive
                          ? 'bg-[var(--sidebar-item-active)] text-accent shadow-glow-accent-sm'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--text-primary)]'
                      }
                    `.trim()}
                    title={isCollapsed ? item.label : undefined}
                  >
                    {({ isActive }) => (
                      <>
                        {/* Active indicator bar */}
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-accent shadow-glow-accent-sm" />
                        )}
                        <Icon name={item.icon} size={18} />
                        {!isCollapsed && (
                          <span className="text-sm font-medium truncate">
                            {item.label}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Sidebar footer */}
      <div className="px-3 py-3 border-t border-[var(--border-primary)]">
        {!isCollapsed && (
          <div className="flex items-center gap-2 justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <p className="text-[10px] text-[var(--text-tertiary)]">
              Squicky v0.1.0
            </p>
          </div>
        )}
      </div>
    </nav>
  );

  // Mobile: wrap in overlay
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[var(--z-overlay)] animate-in fade-in"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
        {/* Sidebar overlay */}
        <div className="fixed top-0 left-0 bottom-0 z-[var(--z-sidebar)]">
          {sidebarContent}
        </div>
      </>
    );
  }

  // Desktop: static sidebar
  return (
    <aside className="fixed top-header left-0 bottom-0 z-[var(--z-sidebar)]">
      {sidebarContent}
    </aside>
  );
}
