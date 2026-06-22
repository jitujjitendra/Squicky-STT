/**
 * Header Component
 * 
 * Fixed top header (56px) containing:
 * - Logo (left)
 * - Search placeholder (center-left)
 * - Privacy indicator (always visible)
 * - Theme toggle (sun/moon)
 * - Session info ("Anonymous session")
 * 
 * Architecture decision: The header is always visible and provides
 * global actions and status. Privacy badge is always shown to
 * reinforce the platform's privacy-first commitment.
 */

import { Icon } from '@/shared/components/Icon';
import { Logo } from '@/shared/components/Logo';
import { PrivacyBadge } from '@/shared/components/PrivacyBadge';
import { ThemeToggle } from '@/shared/components/ThemeToggle';

interface HeaderProps {
  /** Callback to toggle mobile sidebar */
  onMenuToggle: () => void;
  /** Whether sidebar is collapsed (for offset) */
  isSidebarCollapsed: boolean;
  /** Whether in mobile viewport */
  isMobile: boolean;
}

export function Header({ onMenuToggle, isMobile }: HeaderProps) {
  return (
    <header
      className="
        fixed top-0 left-0 right-0 z-[var(--z-header)]
        h-header flex items-center px-4
        bg-[var(--bg-secondary)] border-b border-[var(--border-primary)]
        backdrop-blur-sm
      "
    >
      {/* Left section: Menu toggle (mobile) + Logo */}
      <div className="flex items-center gap-3">
        {isMobile && (
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-button hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
            aria-label="Toggle navigation menu"
          >
            <Icon name="menu" size={20} />
          </button>
        )}
        <Logo />
      </div>

      {/* Center section: Search (desktop only) */}
      {!isMobile && (
        <div className="flex-1 max-w-md mx-8">
          <div
            className="
              flex items-center gap-2 px-3 py-1.5
              rounded-button border border-[var(--border-primary)]
              bg-[var(--bg-primary)] text-[var(--text-tertiary)]
              text-sm cursor-text
            "
          >
            <Icon name="search" size={16} />
            <span>Search transcripts, modules...</span>
          </div>
        </div>
      )}

      {/* Right section: Privacy badge + Theme toggle + Session */}
      <div className="flex items-center gap-3 ml-auto">
        <PrivacyBadge />

        <ThemeToggle />

        {/* Session indicator */}
        {!isMobile && (
          <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
            <Icon name="user" size={14} />
            <span>Anonymous session</span>
          </div>
        )}
      </div>
    </header>
  );
}
