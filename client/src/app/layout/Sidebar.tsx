/**
 * Sidebar Component
 * 
 * Collapsible navigation sidebar (240px expanded, 64px collapsed).
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
        bg-[var(--bg-secondary)] border-r border-[var(--border-primary)]
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
            className="p-2 rounded-button hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
            aria-label="Close navigation"
          >
            <Icon name="x" size={18} />
          </button>
        ) : (
          <button
            onClick={onToggle}
            className="p-2 rounded-button hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Icon name={isCollapsed ? 'chevron-right' : 'chevron-left'} size={16} />
          </button>
        )}
      </div>

      {/* Navigation groups */}
      <div className="flex-1 overflow-y-auto py-3 px-2">
        {navigationGroups.map((group) => (
          <div key={group.label} className="mb-4">
            {/* Group label (hidden when collapsed) */}
            {!isCollapsed && (
              <span className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] block">
                {group.label}
              </span>
            )}

            {/* Nav items */}
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.id}>
                  <NavLink
                    to={item.path}
                    onClick={() => isMobile && onCloseMobile()}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-2
                      rounded-button transition-colors duration-150
                      ${isCollapsed ? 'justify-center' : ''}
                      ${
                        isActive
                          ? 'bg-accent/10 text-accent border-l-2 border-accent'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                      }
                    `.trim()}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon name={item.icon} size={18} />
                    {!isCollapsed && (
                      <span className="text-sm font-medium truncate">
                        {item.label}
                      </span>
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
          <p className="text-[10px] text-[var(--text-tertiary)] text-center">
            Squicky v0.1.0
          </p>
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
          className="fixed inset-0 bg-black/50 z-[var(--z-overlay)] animate-in fade-in"
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
