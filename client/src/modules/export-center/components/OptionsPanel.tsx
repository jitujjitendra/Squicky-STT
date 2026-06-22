/**
 * OptionsPanel Component
 *
 * Toggleable export options: timestamps, speakers, confidence, mode.
 * Uses checkboxes and radio buttons for clear interaction.
 */

import React from 'react';
import { useExportOptions } from '../hooks/useExportOptions';
import type { ExportMode } from '../types';

/**
 * Checkbox row component
 */
function OptionToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 text-accent focus:ring-accent"
      />
      <div>
        <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200 group-hover:text-accent transition-colors">
          {label}
        </span>
        <span className="block text-xs text-neutral-500 dark:text-neutral-400">
          {description}
        </span>
      </div>
    </label>
  );
}

/**
 * Export options panel
 */
export function OptionsPanel() {
  const {
    options,
    setIncludeTimestamps,
    setIncludeSpeakers,
    setIncludeConfidence,
    setMode,
  } = useExportOptions();

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
        Options
      </h3>

      <div className="space-y-3">
        <OptionToggle
          label="Include Timestamps"
          description="Add time markers to the output"
          checked={options.include_timestamps}
          onChange={setIncludeTimestamps}
        />
        <OptionToggle
          label="Include Speakers"
          description="Label content with speaker names"
          checked={options.include_speakers}
          onChange={setIncludeSpeakers}
        />
        <OptionToggle
          label="Include Confidence"
          description="Show confidence scores per segment"
          checked={options.include_confidence}
          onChange={setIncludeConfidence}
        />
      </div>

      {/* Mode selector */}
      <div className="space-y-2">
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Detail Level
        </span>
        <div className="flex gap-2">
          {(['compact', 'detailed'] as ExportMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setMode(mode)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${options.mode === mode
                  ? 'bg-accent text-primary-dark'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }
              `.trim()}
              aria-pressed={options.mode === mode}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
