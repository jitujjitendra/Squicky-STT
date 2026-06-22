/**
 * Meeting Intelligence Zustand Store
 *
 * Central state management for the meeting analysis pipeline.
 * Manages meeting type, extracted items, speaker stats, analysis state,
 * and the review workflow (confirm/dismiss actions).
 *
 * Architecture decision: Zustand matches the pattern used by other modules.
 * The updateItemStatus action enables human-in-the-loop review by toggling
 * items between suggested/confirmed/dismissed.
 */

import { create } from 'zustand';
import type {
  MeetingIntelligenceState,
  MeetingType,
  ActionItem,
  Decision,
  Risk,
  Deadline,
  MeetingSummary,
  SpeakerStats,
  ReviewStatus,
} from '../types';

export const useMeetingIntelligenceStore = create<MeetingIntelligenceState>((set) => ({
  // Initial state
  meetingType: null,
  actionItems: [],
  decisions: [],
  risks: [],
  deadlines: [],
  summary: null,
  speakerStats: [],
  isAnalyzing: false,
  error: null,

  // Actions
  setMeetingType: (type: MeetingType | null) => set({ meetingType: type }),

  setActionItems: (items: ActionItem[]) => set({ actionItems: items }),

  setDecisions: (decisions: Decision[]) => set({ decisions }),

  setRisks: (risks: Risk[]) => set({ risks }),

  setDeadlines: (deadlines: Deadline[]) => set({ deadlines }),

  setSummary: (summary: MeetingSummary | null) => set({ summary }),

  setSpeakerStats: (stats: SpeakerStats[]) => set({ speakerStats: stats }),

  setIsAnalyzing: (isAnalyzing: boolean) => set({ isAnalyzing }),

  setError: (error: string | null) => set({ error }),

  updateItemStatus: (
    category: 'actionItems' | 'decisions' | 'risks' | 'deadlines',
    id: string,
    status: ReviewStatus
  ) =>
    set((state) => {
      switch (category) {
        case 'actionItems': {
          const items = state.actionItems.map((item) =>
            item.id === id ? { ...item, status } : item
          );
          return { actionItems: items };
        }
        case 'decisions': {
          const items = state.decisions.map((item) =>
            item.id === id ? { ...item, status } : item
          );
          return { decisions: items };
        }
        case 'risks': {
          const items = state.risks.map((item) =>
            item.id === id ? { ...item, status } : item
          );
          return { risks: items };
        }
        case 'deadlines': {
          const items = state.deadlines.map((item) =>
            item.id === id ? { ...item, status } : item
          );
          return { deadlines: items };
        }
        default:
          return state;
      }
    }),

  reset: () =>
    set({
      meetingType: null,
      actionItems: [],
      decisions: [],
      risks: [],
      deadlines: [],
      summary: null,
      speakerStats: [],
      isAnalyzing: false,
      error: null,
    }),
}));
