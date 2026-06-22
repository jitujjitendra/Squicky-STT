/**
 * Privacy Badge Component
 * 
 * Always-visible privacy indicator showing the platform's
 * privacy-first commitment. Displays a green shield icon
 * with "Private" text.
 * 
 * Architecture decision: This badge is always visible in the header
 * to reinforce the privacy-first design principle to users.
 */

import { Icon } from './Icon';

interface PrivacyBadgeProps {
  /** Additional CSS class */
  className?: string;
}

export function PrivacyBadge({ className = '' }: PrivacyBadgeProps) {
  return (
    <div
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1
        rounded-full text-xs font-medium
        bg-emerald-100 dark:bg-emerald-900/20
        text-privacy border border-emerald-200 dark:border-emerald-800
        ${className}
      `.trim()}
      title="All processing happens locally - your data never leaves your device"
      aria-label="Privacy mode active - local processing only"
    >
      <Icon name="shield" size={14} />
      <span>Private</span>
    </div>
  );
}
