/**
 * Creator Studio Zustand Store
 *
 * Central state management for the creator content repurposing module.
 * Manages mode selection, transcript, per-mode outputs, generation state,
 * and card-level editing.
 *
 * Architecture decision: Zustand matches the pattern used by other modules
 * (speech-engine, content-studio, meeting-intelligence).
 */

import { create } from 'zustand';
import type {
  CreatorStudioState,
  CreatorMode,
  YouTubeOutputs,
  PodcastOutputs,
  ShortsOutputs,
  OutputCard,
} from '../types';
import type { StandardTranscript } from '@/modules/speech-engine/types';

/**
 * Helper to update a card within an outputs object by card id
 */
function updateCardInObject<T extends Record<string, OutputCard>>(
  outputs: T,
  cardId: string,
  content: string
): T {
  const updated = { ...outputs };
  for (const key of Object.keys(updated) as Array<keyof T>) {
    const card = updated[key] as OutputCard;
    if (card.id === cardId) {
      (updated[key] as unknown as OutputCard) = {
        ...card,
        content,
        charCount: content.length,
        isEdited: true,
      };
      break;
    }
  }
  return updated;
}

export const useCreatorStudioStore = create<CreatorStudioState>((set) => ({
  // Initial state
  mode: 'youtube',
  transcript: null,
  youtubeOutputs: null,
  podcastOutputs: null,
  shortsOutputs: null,
  isGenerating: false,
  error: null,

  // Actions
  setMode: (mode: CreatorMode) => set({ mode }),

  setTranscript: (transcript: StandardTranscript | null) =>
    set({
      transcript,
      youtubeOutputs: null,
      podcastOutputs: null,
      shortsOutputs: null,
      error: null,
    }),

  setYouTubeOutputs: (outputs: YouTubeOutputs | null) =>
    set({ youtubeOutputs: outputs }),

  setPodcastOutputs: (outputs: PodcastOutputs | null) =>
    set({ podcastOutputs: outputs }),

  setShortsOutputs: (outputs: ShortsOutputs | null) =>
    set({ shortsOutputs: outputs }),

  setIsGenerating: (isGenerating: boolean) => set({ isGenerating }),

  setError: (error: string | null) => set({ error }),

  updateCard: (mode: CreatorMode, cardId: string, content: string) =>
    set((state) => {
      switch (mode) {
        case 'youtube': {
          if (!state.youtubeOutputs) return state;
          return {
            youtubeOutputs: updateCardInObject(
              state.youtubeOutputs,
              cardId,
              content
            ),
          };
        }
        case 'podcast': {
          if (!state.podcastOutputs) return state;
          return {
            podcastOutputs: updateCardInObject(
              state.podcastOutputs,
              cardId,
              content
            ),
          };
        }
        case 'shorts': {
          if (!state.shortsOutputs) return state;
          return {
            shortsOutputs: updateCardInObject(
              state.shortsOutputs,
              cardId,
              content
            ),
          };
        }
        default:
          return state;
      }
    }),

  reset: () =>
    set({
      mode: 'youtube',
      transcript: null,
      youtubeOutputs: null,
      podcastOutputs: null,
      shortsOutputs: null,
      isGenerating: false,
      error: null,
    }),
}));
