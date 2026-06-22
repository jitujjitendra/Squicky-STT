/**
 * useSubtitleGeneration Hook
 *
 * Orchestrates subtitle generation from a loaded transcript.
 * Handles the generation lifecycle: checking for word timestamps,
 * running the generation service, and updating the store.
 */

import { useCallback } from 'react';
import { useSubtitleStudioStore } from '../store';
import { GenerationService } from '../services/GenerationService';
import type { StandardTranscript } from '@/modules/speech-engine/types';

/**
 * Hook for subtitle generation from transcript data
 */
export function useSubtitleGeneration() {
  const setCues = useSubtitleStudioStore((s) => s.setCues);
  const setIsGenerating = useSubtitleStudioStore((s) => s.setIsGenerating);
  const setHasWordTimestamps = useSubtitleStudioStore((s) => s.setHasWordTimestamps);
  const setTotalDuration = useSubtitleStudioStore((s) => s.setTotalDuration);
  const setError = useSubtitleStudioStore((s) => s.setError);
  const config = useSubtitleStudioStore((s) => s.config);
  const isGenerating = useSubtitleStudioStore((s) => s.isGenerating);
  const pushHistory = useSubtitleStudioStore((s) => s.pushHistory);

  /**
   * Generate subtitles from a transcript
   */
  const generate = useCallback(
    (transcript: StandardTranscript) => {
      try {
        setIsGenerating(true);
        setError(null);

        // Check for word timestamps
        const hasWords = GenerationService.hasWordTimestamps(transcript);
        setHasWordTimestamps(hasWords);

        // Set total duration
        setTotalDuration(transcript.source.duration_seconds);

        // Generate cues
        const cues = GenerationService.generate(transcript, config);

        // Push initial state to history
        pushHistory('Generate subtitles');

        // Update store
        setCues(cues);
        setIsGenerating(false);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Generation failed';
        setError(message);
        setIsGenerating(false);
      }
    },
    [config, setCues, setIsGenerating, setHasWordTimestamps, setTotalDuration, setError, pushHistory]
  );

  /**
   * Regenerate subtitles with current config
   */
  const regenerate = useCallback(() => {
    const transcript = useSubtitleStudioStore.getState().transcript;
    if (transcript) {
      generate(transcript);
    }
  }, [generate]);

  return {
    generate,
    regenerate,
    isGenerating,
  };
}
