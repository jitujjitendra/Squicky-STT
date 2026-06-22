/**
 * useContentGeneration Hook
 *
 * Orchestrates the content generation pipeline:
 * 1. Checks/populates intelligence cache
 * 2. Runs the selected template
 * 3. Computes quality metrics
 * 4. Handles errors and regeneration with varied parameters
 */

import { useCallback } from 'react';
import { useContentStudioStore } from '../store';
import {
  ContentIntelligenceCache,
  generateContent,
  computeQuality,
} from '../services';
import type { ContentType, IntelligenceParams } from '../types';

/**
 * Hook providing content generation and regeneration capabilities
 */
export function useContentGeneration() {
  const transcript = useContentStudioStore((s) => s.transcript);
  const selectedType = useContentStudioStore((s) => s.selectedType);
  const params = useContentStudioStore((s) => s.params);
  const intelligence = useContentStudioStore((s) => s.intelligence);
  const isGenerating = useContentStudioStore((s) => s.isGenerating);

  const setIntelligence = useContentStudioStore((s) => s.setIntelligence);
  const setGeneratedContent = useContentStudioStore((s) => s.setGeneratedContent);
  const setIsGenerating = useContentStudioStore((s) => s.setIsGenerating);
  const setQuality = useContentStudioStore((s) => s.setQuality);
  const setError = useContentStudioStore((s) => s.setError);
  const setParams = useContentStudioStore((s) => s.setParams);

  /**
   * Generate content using current settings
   */
  const generate = useCallback(async (type?: ContentType) => {
    if (!transcript) {
      setError('No transcript loaded. Please process an audio file first.');
      return;
    }

    if (transcript.segments.length === 0) {
      setError('Transcript is empty. Cannot generate content from an empty transcript.');
      return;
    }

    const contentType = type || selectedType;
    setIsGenerating(true);
    setError(null);

    // Warn about poor quality but still proceed
    const isPoorQuality = transcript.transcription_meta.quality.quality_label === 'poor';

    try {
      // Use microtask to allow UI to update
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Populate or reuse intelligence cache
      let intel = intelligence;
      if (
        !intel ||
        intel.transcriptId !== transcript.id ||
        ContentIntelligenceCache.isStale()
      ) {
        intel = ContentIntelligenceCache.populate(transcript, params);
        setIntelligence(intel);
      }

      // Generate content
      const result = generateContent(contentType, intel, transcript);
      setGeneratedContent(result);

      // Compute quality
      const quality = computeQuality(result, intel, transcript.segments.length);
      setQuality(quality);

      // Set warning for poor quality transcripts
      if (isPoorQuality) {
        setError('Warning: Transcript quality is poor. Results may be unreliable.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Content generation failed';
      setError(message);
      setGeneratedContent(null);
      setQuality(null);
    } finally {
      setIsGenerating(false);
    }
  }, [
    transcript, selectedType, params, intelligence,
    setIntelligence, setGeneratedContent, setIsGenerating,
    setQuality, setError,
  ]);

  /**
   * Regenerate with varied parameters for different results.
   * Varies damping (0.78-0.92) and topic threshold (0.22-0.38).
   */
  const regenerate = useCallback(async () => {
    // Randomize within ranges
    const newDamping = 0.78 + Math.random() * 0.14; // 0.78-0.92
    const newThreshold = 0.22 + Math.random() * 0.16; // 0.22-0.38

    const newParams: Partial<IntelligenceParams> = {
      damping: parseFloat(newDamping.toFixed(3)),
      topicThreshold: parseFloat(newThreshold.toFixed(3)),
    };

    setParams(newParams);

    // Invalidate cache to force recomputation
    ContentIntelligenceCache.invalidate();
    setIntelligence(null);

    // Generate with new params (will be picked up from store)
    if (!transcript) return;

    setIsGenerating(true);
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 0));

      const updatedParams: IntelligenceParams = {
        ...params,
        ...newParams,
      };

      const intel = ContentIntelligenceCache.populate(transcript, updatedParams);
      setIntelligence(intel);

      const result = generateContent(selectedType, intel, transcript);
      setGeneratedContent(result);

      const quality = computeQuality(result, intel, transcript.segments.length);
      setQuality(quality);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Regeneration failed';
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  }, [
    transcript, selectedType, params,
    setParams, setIntelligence, setIsGenerating,
    setError, setGeneratedContent, setQuality,
  ]);

  return {
    generate,
    regenerate,
    isGenerating,
  };
}
