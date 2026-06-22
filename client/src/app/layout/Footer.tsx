/**
 * Footer Component - Premium Edition
 * 
 * Subtle 40px footer with copyright and version information.
 * Stays at the bottom of the main content area.
 */

export function Footer() {
  return (
    <footer
      className="
        h-footer flex items-center justify-center px-4
        border-t border-[var(--border-primary)]
        text-[var(--text-muted)] text-xs
        bg-[var(--bg-glass)]
      "
    >
      <span className="flex items-center gap-2">
        <span className="w-1 h-1 rounded-full bg-accent/50" />
        Squicky Speech Intelligence Platform &copy; {new Date().getFullYear()} &mdash; Privacy-first, always.
      </span>
    </footer>
  );
}
