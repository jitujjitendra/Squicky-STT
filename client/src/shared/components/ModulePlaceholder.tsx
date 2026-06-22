/**
 * Module Placeholder Component - Premium Edition
 * 
 * Generic placeholder page for modules that haven't been implemented yet.
 * Shows module name, description, and a "Coming soon" indicator with
 * premium glassmorphism styling and glow effects.
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
      {/* Background glow orb */}
      <div className="absolute w-64 h-64 rounded-full bg-accent/5 blur-3xl pointer-events-none pulse-glow" />

      {/* Module icon with gradient background */}
      <div
        className="
          relative w-20 h-20 rounded-2xl flex items-center justify-center mb-6
          bg-accent/10 text-accent
          border border-[var(--border-accent)]
          shadow-glow-accent-sm
        "
      >
        <Icon name={icon} size={36} />
      </div>

      {/* Module name */}
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
        {name}
      </h1>

      {/* Module description */}
      <p className="text-[var(--text-secondary)] text-center max-w-md mb-8 leading-relaxed">
        {description}
      </p>

      {/* Coming soon indicator */}
      <div
        className="
          inline-flex items-center gap-2 px-5 py-2.5
          rounded-full border border-[var(--border-accent)]
          bg-[var(--surface-card)] text-accent
          text-sm font-medium
          backdrop-blur-sm
          shadow-glow-accent-sm
        "
      >
        <div className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-glow-accent-sm" />
        <span>Coming soon</span>
      </div>
    </div>
  );
}
