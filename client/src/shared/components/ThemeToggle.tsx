/**
 * Theme Toggle Component
 * 
 * Sun/Moon icon button that switches between light and dark themes.
 * Uses smooth icon transition for visual polish.
 */

import { Icon } from './Icon';
import { useTheme } from '@/shared/hooks';

interface ThemeToggleProps {
  /** Additional CSS class */
  className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        p-2 rounded-button transition-colors duration-200
        hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]
        hover:text-[var(--text-primary)]
        ${className}
      `.trim()}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
    </button>
  );
}
