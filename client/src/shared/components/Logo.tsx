/**
 * Logo Component
 * 
 * Squicky brand logo - text-based with accent color styling.
 * Adapts size based on sidebar collapse state.
 */

interface LogoProps {
  /** Whether to show only the icon (for collapsed sidebar) */
  compact?: boolean;
  /** Additional CSS class */
  className?: string;
}

export function Logo({ compact = false, className = '' }: LogoProps) {
  if (compact) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <span className="text-xl font-bold text-accent">S</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xl font-bold text-accent">S</span>
      <span className="text-lg font-semibold text-[var(--text-primary)]">
        Squicky
      </span>
    </div>
  );
}
