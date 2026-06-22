/**
 * Button Component - Premium Edition
 * 
 * Reusable button with variant support matching the design system.
 * Supports primary (with glow), secondary, ghost, and danger variants.
 */

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Full width */
  fullWidth?: boolean;
  /** Content */
  children: React.ReactNode;
}

const variantClasses: Record<string, string> = {
  primary:
    'bg-accent text-primary-dark font-semibold hover:bg-accent-hover active:bg-accent-dark shadow-glow-accent-sm hover:shadow-glow-accent',
  secondary:
    'bg-transparent border border-[var(--border-secondary)] text-[var(--text-secondary)] hover:border-[var(--border-accent)] hover:text-accent hover:shadow-glow-accent-sm',
  ghost:
    'bg-transparent hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
  danger:
    'bg-error/10 border border-error/20 text-error hover:bg-error/20 hover:border-error/40',
};

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        rounded-button transition-all duration-200
        focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2
        disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
