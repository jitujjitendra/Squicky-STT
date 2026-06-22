/**
 * Logo Component - Premium Edition
 * 
 * Squicky brand logo with gradient accent styling and glow effect.
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
        <span className="text-xl font-bold text-gradient">S</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Logo icon with gradient background */}
      <div className="w-7 h-7 rounded-lg bg-gradient-accent flex items-center justify-center shadow-glow-accent-sm">
        <span className="text-sm font-bold text-primary-dark">S</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-base font-bold text-[var(--text-primary)]">
          Squicky
        </span>
        <span className="text-[10px] font-medium text-accent uppercase tracking-wider">
          STT
        </span>
      </div>
    </div>
  );
}
