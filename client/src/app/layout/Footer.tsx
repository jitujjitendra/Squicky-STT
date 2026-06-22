/**
 * Footer Component
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
        text-[var(--text-tertiary)] text-xs
      "
    >
      <span>Squicky Speech Intelligence Platform &copy; {new Date().getFullYear()} &mdash; Privacy-first, always.</span>
    </footer>
  );
}
