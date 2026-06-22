/**
 * Badge Component - Premium Edition
 * 
 * Status/label badges with color variants and subtle glow effects.
 */

interface BadgeProps {
  /** Visual variant */
  variant?: 'default' | 'info' | 'success' | 'warning' | 'error' | 'privacy';
  /** Content */
  children: React.ReactNode;
  /** Additional CSS class */
  className?: string;
}

const variantClasses: Record<string, string> = {
  default: 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-primary)]',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  error: 'bg-red-500/10 text-red-400 border-red-500/20',
  privacy: 'bg-emerald-500/10 text-privacy border-emerald-500/20',
};

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-0.5
        rounded-full text-[11px] font-medium
        border
        ${variantClasses[variant]}
        ${className}
      `.trim()}
    >
      {children}
    </span>
  );
}
