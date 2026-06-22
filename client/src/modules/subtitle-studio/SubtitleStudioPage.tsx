/**
 * Subtitle Studio Page Component
 *
 * Main page for the Subtitle Studio module. Provides subtitle generation,
 * timeline editing, validation, and preview capabilities.
 *
 * Layout:
 * - Top: Toolbar with actions
 * - Middle: Split view - Cue list (left/top) + Preview & Validation (right/bottom)
 * - Bottom: Timeline visualization
 *
 * Mobile: Single column with simplified timeline and compact cue list.
 *
 * Route: /subtitles
 */

import { useEffect } from 'react';
import { Button, Icon, Badge } from '@/shared/components';
import { useSubtitleStudioStore } from './store';
import { useActiveTranscript } from './hooks/useActiveTranscript';
import { useSubtitleGeneration } from './hooks/useSubtitleGeneration';
import { SubtitleToolbar } from './components/SubtitleToolbar';
import { CueList } from './components/CueList';
import { Timeline } from './components/Timeline';
import { PreviewPanel } from './components/PreviewPanel';
import { ValidationPanel } from './components/ValidationPanel';

/**
 * Subtitle Studio page - subtitle generation and editing workspace
 */
export function SubtitleStudioPage() {
  const { transcript, hasTranscript } = useActiveTranscript();
  const { generate, isGenerating } = useSubtitleGeneration();
  const cues = useSubtitleStudioStore((s) => s.cues);
  const error = useSubtitleStudioStore((s) => s.error);
  const setError = useSubtitleStudioStore((s) => s.setError);

  // Auto-generate subtitles when transcript is loaded and no cues exist
  useEffect(() => {
    if (transcript && cues.length === 0 && !isGenerating) {
      generate(transcript);
    }
  }, [transcript, cues.length, isGenerating, generate]);

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <Icon name="x" size={24} className="text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            Error
          </h2>
          <p className="text-sm text-neutral-500 mb-4">{error}</p>
          <Button variant="secondary" onClick={() => setError(null)}>
            Dismiss
          </Button>
        </div>
      </div>
    );
  }

  // Loading/generating state
  if (isGenerating) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-neutral-500">Generating subtitles...</p>
        </div>
      </div>
    );
  }

  // Empty state: no transcript loaded
  if (!hasTranscript) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center">
            <Icon name="subtitles" size={32} className="text-neutral-400" />
          </div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            No Transcript Loaded
          </h2>
          <p className="text-sm text-neutral-500 mb-2">
            Upload and transcribe an audio file from the Speech Engine, then send it here to generate subtitles.
          </p>
          <Badge variant="privacy" className="mb-4">
            All processing happens locally in your browser
          </Badge>
          <div className="mt-4">
            <Button
              variant="primary"
              onClick={() => { window.location.href = '/'; }}
            >
              <Icon name="mic" size={16} />
              Go to Speech Engine
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Toolbar */}
      <SubtitleToolbar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Cue list (left on desktop, top on mobile) */}
        <div className="flex-1 min-h-0 overflow-y-auto lg:border-r lg:border-neutral-200 lg:dark:border-neutral-700">
          <CueList />
        </div>

        {/* Right sidebar: Preview + Validation (desktop), below cues on mobile */}
        <div className="w-full lg:w-80 xl:w-96 overflow-y-auto p-3 space-y-3 border-t lg:border-t-0 border-neutral-200 dark:border-neutral-700">
          <PreviewPanel />
          <ValidationPanel />
        </div>
      </div>

      {/* Timeline (bottom) */}
      <Timeline />
    </div>
  );
}
