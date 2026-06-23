/**
 * Logo Component
 * 
 * Squicky brand logo using the SVG logo file from public/.
 * Shows the "S" icon from the actual logo with brand text.
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
        <img src="/squicky.svg" alt="Squicky" className="w-7 h-7" />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Logo icon from SVG file */}
      <img src="/squicky.svg" alt="Squicky" className="w-7 h-7" />
      <div className="flex items-baseline gap-1.5">
        <span className="text-base font-bold text-[var(--text-primary)]">
          Squicky
        </span>
        <span className="text-[10px] font-semibold text-accent uppercase tracking-wider">
          STT
        </span>
      </div>
    </div>
  );
}
