/**
 * Content Studio Zustand Store
 *
 * Central state management for the content generation pipeline.
 * Manages transcript, content type selection, intelligence cache state,
 * generated content, quality metrics, and generation parameters.
 *
 * Architecture decision: Zustand matches the pattern used by speech-engine
 * and export-center modules - no provider needed, built-in selectors.
 */

import { create } from 'zustand';
import type {
  ContentType,
  ContentResult,
  ContentIntelligence,
  QualityMetrics,
  IntelligenceParams,
  ContentStudioState,
} from '../types';
import type { StandardTranscript } from '@/modules/speech-engine/types';
import { DEFAULT_PARAMS } from '../services/ContentIntelligenceCache';

export const useContentStudioStore = create<ContentStudioState>((set) => ({
  // Initial state
  transcript: null,
  selectedType: 'summary-short',
  generatedContent: null,
  intelligence: null,
  isGenerating: false,
  quality: null,
  error: null,
  params: { ...DEFAULT_PARAMS },

  // Actions
  setTranscript: (transcript: StandardTranscript | null) =>
    set({ transcript, generatedContent: null, quality: null, error: null }),

  setSelectedType: (type: ContentType) => set({ selectedType: type }),

  setGeneratedContent: (content: ContentResult | null) =>
    set({ generatedContent: content }),

  setIntelligence: (intelligence: ContentIntelligence | null) =>
    set({ intelligence }),

  setIsGenerating: (isGenerating: boolean) => set({ isGenerating }),

  setQuality: (quality: QualityMetrics | null) => set({ quality }),

  setError: (error: string | null) => set({ error }),

  setParams: (params: Partial<IntelligenceParams>) =>
    set((state) => ({
      params: { ...state.params, ...params },
    })),

  reset: () =>
    set({
      transcript: null,
      selectedType: 'summary-short',
      generatedContent: null,
      intelligence: null,
      isGenerating: false,
      quality: null,
      error: null,
      params: { ...DEFAULT_PARAMS },
    }),
}));
