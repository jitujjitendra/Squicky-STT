/**
 * Theme Toggle Component - Premium Edition
 * 
 * Sun/Moon icon button that switches between light and dark themes.
 * Uses smooth icon transition with subtle glow for visual polish.
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
        p-2 rounded-button transition-all duration-200
        hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)]
        hover:text-accent hover:shadow-glow-accent-sm
        ${className}
      `.trim()}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
    </button>
  );
}
