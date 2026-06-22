/**
 * useCreatorGeneration Hook
 *
 * Orchestrates creator content generation:
 * 1. Checks/populates ContentIntelligenceCache
 * 2. Calls the appropriate mode service (YouTube/Podcast/Shorts)
 * 3. Handles regeneration with offset (2nd-5th ranked items)
 *
 * Architecture decision: This hook consumes ContentIntelligenceCache
 * rather than re-computing intelligence. If cache is empty, it triggers
 * extraction via the shared cache populate method.
 */

import { useCallback, useRef } from 'react';
import { useCreatorStudioStore } from '../store';
import { ContentIntelligenceCache, DEFAULT_PARAMS } from '@/modules/content-studio/services/ContentIntelligenceCache';
import { generateYouTubeOutputs } from '../services/YouTubeService';
import { generatePodcastOutputs } from '../services/PodcastService';
import { generateShortsOutputs } from '../services/ShortsService';
import type { CreatorMode } from '../types';

/**
 * Hook providing creator content generation and regeneration
 */
export function useCreatorGeneration() {
  const transcript = useCreatorStudioStore((s) => s.transcript);
  const mode = useCreatorStudioStore((s) => s.mode);
  const isGenerating = useCreatorStudioStore((s) => s.isGenerating);

  const setYouTubeOutputs = useCreatorStudioStore((s) => s.setYouTubeOutputs);
  const setPodcastOutputs = useCreatorStudioStore((s) => s.setPodcastOutputs);
  const setShortsOutputs = useCreatorStudioStore((s) => s.setShortsOutputs);
  const setIsGenerating = useCreatorStudioStore((s) => s.setIsGenerating);
  const setError = useCreatorStudioStore((s) => s.setError);

  /** Track regeneration offset */
  const regenerationOffset = useRef(0);

  /**
   * Generate content for the current or specified mode
   */
  const generate = useCallback(async (targetMode?: CreatorMode) => {
    if (!transcript) {
      setError('No transcript loaded. Please process an audio file first.');
      return;
    }

    if (transcript.segments.length === 0) {
      setError('Transcript is empty. Cannot generate content from an empty transcript.');
      return;
    }

    const activeMode = targetMode || mode;
    setIsGenerating(true);
    setError(null);
    regenerationOffset.current = 0;

    try {
      // Allow UI to update
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Get or populate intelligence cache
      let intelligence = ContentIntelligenceCache.get();

      if (
        !intelligence ||
        intelligence.transcriptId !== transcript.id ||
        ContentIntelligenceCache.isStale()
      ) {
        intelligence = ContentIntelligenceCache.populate(transcript, DEFAULT_PARAMS);
      }

      // Generate mode-specific outputs
      switch (activeMode) {
        case 'youtube': {
          const outputs = generateYouTubeOutputs(intelligence, transcript, 0);
          setYouTubeOutputs(outputs);
          break;
        }
        case 'podcast': {
          const outputs = generatePodcastOutputs(intelligence, transcript, 0);
          setPodcastOutputs(outputs);
          break;
        }
        case 'shorts': {
          const outputs = generateShortsOutputs(intelligence, transcript, 0);
          setShortsOutputs(outputs);
          break;
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Content generation failed';
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  }, [
    transcript, mode,
    setYouTubeOutputs, setPodcastOutputs, setShortsOutputs,
    setIsGenerating, setError,
  ]);

  /**
   * Regenerate with shuffled keyword order and different ranked sentences.
   * Uses offset 1-4 (2nd-5th instead of top) for variety.
   */
  const regenerate = useCallback(async () => {
    if (!transcript) {
      setError('No transcript loaded.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    // Increment offset for variety (cycle through 1-4)
    regenerationOffset.current = (regenerationOffset.current % 4) + 1;
    const offset = regenerationOffset.current;

    try {
      await new Promise((resolve) => setTimeout(resolve, 0));

      let intelligence = ContentIntelligenceCache.get();

      if (!intelligence || intelligence.transcriptId !== transcript.id) {
        intelligence = ContentIntelligenceCache.populate(transcript, DEFAULT_PARAMS);
      }

      switch (mode) {
        case 'youtube': {
          const outputs = generateYouTubeOutputs(intelligence, transcript, offset);
          setYouTubeOutputs(outputs);
          break;
        }
        case 'podcast': {
          const outputs = generatePodcastOutputs(intelligence, transcript, offset);
          setPodcastOutputs(outputs);
          break;
        }
        case 'shorts': {
          const outputs = generateShortsOutputs(intelligence, transcript, offset);
          setShortsOutputs(outputs);
          break;
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Regeneration failed';
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  }, [
    transcript, mode,
    setYouTubeOutputs, setPodcastOutputs, setShortsOutputs,
    setIsGenerating, setError,
  ]);

  return {
    generate,
    regenerate,
    isGenerating,
  };
}
