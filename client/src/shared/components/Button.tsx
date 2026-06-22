/**
 * Button Component
 * 
 * Reusable button with variant support matching the design system.
 * Supports primary, secondary, ghost, and danger variants.
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
    'bg-accent text-primary-dark hover:bg-accent-hover active:bg-accent-dark font-medium',
  secondary:
    'bg-transparent border border-neutral-400 dark:border-neutral-600 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800',
  ghost:
    'bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300',
  danger:
    'bg-error text-white hover:bg-red-600 active:bg-red-700',
};

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-sm',
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
        disabled:opacity-50 disabled:cursor-not-allowed
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
