/**
 * Module Placeholder Component
 * 
 * Generic placeholder page for modules that haven't been implemented yet.
 * Shows module name, description, and a "Coming soon" indicator.
 * 
 * Architecture decision: Each module gets a placeholder to establish
 * routing and navigation early, making it easy to incrementally
 * implement features without breaking the overall structure.
 */

import { Icon } from './Icon';

interface ModulePlaceholderProps {
  /** Module display name */
  name: string;
  /** Brief module description */
  description: string;
  /** Icon name for the module */
  icon: string;
}

export function ModulePlaceholder({ name, description, icon }: ModulePlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      {/* Module icon */}
      <div
        className="
          w-20 h-20 rounded-2xl flex items-center justify-center mb-6
          bg-[var(--bg-tertiary)] text-accent
        "
      >
        <Icon name={icon} size={36} />
      </div>

      {/* Module name */}
      <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">
        {name}
      </h1>

      {/* Module description */}
      <p className="text-[var(--text-secondary)] text-center max-w-md mb-8">
        {description}
      </p>

      {/* Coming soon indicator */}
      <div
        className="
          inline-flex items-center gap-2 px-4 py-2
          rounded-full border border-[var(--border-primary)]
          bg-[var(--bg-secondary)] text-[var(--text-tertiary)]
          text-sm
        "
      >
        <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        <span>Coming soon</span>
      </div>
    </div>
  );
}
