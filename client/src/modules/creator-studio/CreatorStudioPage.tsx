/**
 * Creator Studio Module - Page Component
 *
 * Content repurposing tool for creators with three modes:
 * YouTube, Podcast, and Shorts/Reels. Consumes ContentIntelligenceCache
 * to generate platform-specific formatted outputs.
 *
 * Privacy: 100% client-side processing, sessionStorage for persistence.
 * Mobile: Stacked cards, full-width mode tabs.
 *
 * Route: /creator
 */

import { useEffect } from 'react';
import { Button, Badge, Icon } from '@/shared/components';
import { ModeSelector, OutputPanel, QualityPanel } from './components';
import { useActiveTranscript } from './hooks/useActiveTranscript';
import { useCreatorGeneration } from './hooks/useCreatorGeneration';
import { useCreatorExport } from './hooks/useCreatorExport';
import { useCreatorStudioStore } from './store';

export function CreatorStudioPage() {
  const { hasTranscript } = useActiveTranscript();
  const { generate, regenerate, isGenerating } = useCreatorGeneration();
  const { exportAll, hasOutputs } = useCreatorExport();

  const mode = useCreatorStudioStore((s) => s.mode);
  const error = useCreatorStudioStore((s) => s.error);
  const youtubeOutputs = useCreatorStudioStore((s) => s.youtubeOutputs);
  const podcastOutputs = useCreatorStudioStore((s) => s.podcastOutputs);
  const shortsOutputs = useCreatorStudioStore((s) => s.shortsOutputs);

  /** Check if current mode has generated outputs */
  const currentModeHasOutputs =
    (mode === 'youtube' && youtubeOutputs !== null) ||
    (mode === 'podcast' && podcastOutputs !== null) ||
    (mode === 'shorts' && shortsOutputs !== null);

  /** Auto-generate when mode changes and transcript is available */
  useEffect(() => {
    if (hasTranscript && !currentModeHasOutputs && !isGenerating) {
      generate(mode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, hasTranscript]);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Icon name="creator" size={24} />
            Creator Studio
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Repurpose transcripts into platform-optimized content
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="privacy">Client-Side Only</Badge>
          {hasOutputs && (
            <Button variant="secondary" size="sm" onClick={exportAll}>
              <Icon name="download" size={16} />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Mode Selector */}
      <ModeSelector />

      {/* Error display */}
      {error && (
        <div
          className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* No transcript state */}
      {!hasTranscript && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Icon name="mic" size={48} className="text-neutral-400 dark:text-neutral-500 mb-4" />
          <h2 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
            No Transcript Loaded
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md">
            Process an audio file in the Speech Engine first, then return here
            to generate creator content.
          </p>
        </div>
      )}

      {/* Main content area */}
      {hasTranscript && (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Output cards */}
          <div className="flex-1 min-w-0">
            {/* Generation controls */}
            <div className="flex items-center gap-3 mb-4">
              <Button
                variant="primary"
                size="md"
                onClick={() => generate(mode)}
                disabled={isGenerating}
              >
                {isGenerating ? 'Generating...' : 'Generate'}
              </Button>
              {currentModeHasOutputs && (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={regenerate}
                  disabled={isGenerating}
                >
                  Regenerate
                </Button>
              )}
              {isGenerating && (
                <span className="text-sm text-neutral-500 dark:text-neutral-400 animate-pulse">
                  Processing...
                </span>
              )}
            </div>

            {/* Output panel */}
            <OutputPanel onRegenerate={regenerate} />

            {/* Empty state for current mode */}
            {!currentModeHasOutputs && !isGenerating && (
              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-lg">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Click Generate to create {mode === 'youtube' ? 'YouTube' : mode === 'podcast' ? 'Podcast' : 'Shorts/Reels'} content
                </p>
              </div>
            )}
          </div>

          {/* Quality sidebar */}
          <div className="w-full lg:w-64 shrink-0">
            <QualityPanel />
          </div>
        </div>
      )}
    </div>
  );
}
