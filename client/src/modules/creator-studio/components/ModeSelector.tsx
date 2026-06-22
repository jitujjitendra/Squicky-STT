/**
 * ModeSelector Component
 *
 * Three-tab mode selector for Creator Studio: YouTube, Podcast, Shorts/Reels.
 * User selects one mode which determines the visible output cards.
 * Full-width tabs on mobile for responsive design.
 */

import { useCreatorStudioStore } from '../store';
import type { CreatorMode } from '../types';

/** Mode configuration */
const MODES: Array<{ id: CreatorMode; label: string; description: string }> = [
  {
    id: 'youtube',
    label: 'YouTube',
    description: 'Titles, descriptions, chapters, tags',
  },
  {
    id: 'podcast',
    label: 'Podcast',
    description: 'Show notes, takeaways, chapters',
  },
  {
    id: 'shorts',
    label: 'Shorts / Reels',
    description: 'Highlights, hooks, captions',
  },
];

export function ModeSelector() {
  const mode = useCreatorStudioStore((s) => s.mode);
  const setMode = useCreatorStudioStore((s) => s.setMode);

  return (
    <div className="w-full">
      <div
        className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-neutral-100 dark:bg-neutral-800"
        role="tablist"
        aria-label="Creator mode"
      >
        {MODES.map((m) => (
          <button
            key={m.id}
            role="tab"
            aria-selected={mode === m.id}
            aria-controls={`panel-${m.id}`}
            onClick={() => setMode(m.id)}
            className={`
              flex flex-col items-center gap-0.5 px-3 py-2 rounded-md
              text-sm font-medium transition-all duration-200
              focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2
              ${mode === m.id
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }
            `.trim()}
          >
            <span className="font-semibold">{m.label}</span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 hidden sm:block">
              {m.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
