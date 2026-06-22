/**
 * Subtitle Studio Zustand Store
 *
 * Central state management for the subtitle editor module.
 * Manages cues, timeline state, validation results, configuration,
 * editing state, and undo/redo history.
 *
 * Architecture decision: Zustand matches the pattern used by speech-engine
 * and export-center modules - no provider needed, built-in selectors, simple API.
 */

import { create } from 'zustand';
import type { StandardTranscript } from '@/modules/speech-engine/types';
import type {
  SubtitleCue,
  CueId,
  SubtitleConfig,
  TimelineState,
  TimelineZoom,
  ValidationResults,
  HistoryEntry,
} from '../types';
import { DEFAULT_SUBTITLE_CONFIG } from '../types';
import { ValidationService } from '../services/ValidationService';

/** Maximum undo history length */
const MAX_HISTORY = 50;

/**
 * Subtitle Studio state interface
 */
export interface SubtitleStudioState {
  // Source data
  transcript: StandardTranscript | null;

  // Cues
  cues: SubtitleCue[];

  // Timeline
  timeline: TimelineState;

  // Validation
  validationResults: ValidationResults;

  // Configuration
  config: SubtitleConfig;

  // Editing state
  editingCueId: CueId | null;

  // History (undo/redo)
  history: HistoryEntry[];
  historyIndex: number;

  // Generation state
  isGenerating: boolean;
  hasWordTimestamps: boolean;

  // Error state
  error: string | null;

  // Actions - Source
  setTranscript: (transcript: StandardTranscript | null) => void;

  // Actions - Cues
  setCues: (cues: SubtitleCue[]) => void;
  updateCue: (cueId: CueId, updates: Partial<SubtitleCue>) => void;
  deleteCue: (cueId: CueId) => void;
  restoreCue: (cueId: CueId) => void;
  splitCue: (cueId: CueId, cursorPosition: number) => void;
  mergeCues: (cueId1: CueId, cueId2: CueId) => void;

  // Actions - Timeline
  setPlayheadPosition: (position: number) => void;
  setZoom: (zoom: TimelineZoom) => void;
  setScrollOffset: (offset: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setTotalDuration: (duration: number) => void;

  // Actions - Editing
  setEditingCueId: (cueId: CueId | null) => void;

  // Actions - Configuration
  setConfig: (config: Partial<SubtitleConfig>) => void;

  // Actions - Validation
  runValidation: () => void;

  // Actions - History
  undo: () => void;
  redo: () => void;
  pushHistory: (description: string) => void;

  // Actions - Generation
  setIsGenerating: (isGenerating: boolean) => void;
  setHasWordTimestamps: (has: boolean) => void;

  // Actions - Error
  setError: (error: string | null) => void;

  // Actions - Reset
  reset: () => void;
}

const initialTimeline: TimelineState = {
  zoom: 'fit',
  scrollOffset: 0,
  playheadPosition: 0,
  isPlaying: false,
  totalDuration: 0,
};

const initialValidation: ValidationResults = {
  totalIssues: 0,
  errors: 0,
  warnings: 0,
  issues: [],
  isValid: true,
};

export const useSubtitleStudioStore = create<SubtitleStudioState>((set, get) => ({
  // Initial state
  transcript: null,
  cues: [],
  timeline: initialTimeline,
  validationResults: initialValidation,
  config: DEFAULT_SUBTITLE_CONFIG,
  editingCueId: null,
  history: [],
  historyIndex: -1,
  isGenerating: false,
  hasWordTimestamps: false,
  error: null,

  // Source actions
  setTranscript: (transcript) => set({ transcript }),

  // Cue actions
  setCues: (cues) => {
    set({ cues });
    // Auto-validate after setting cues
    const state = get();
    const validationResults = ValidationService.validateAll(cues, state.config);
    set({ validationResults });
  },

  updateCue: (cueId, updates) => {
    const state = get();
    const cues = state.cues.map((cue) =>
      cue.id === cueId ? { ...cue, ...updates, isEdited: true } : cue
    );
    // Re-validate updated cue
    const updatedCues = cues.map((cue) => ({
      ...cue,
      validation: ValidationService.validateCue(cue, cues, state.config),
    }));
    const validationResults = ValidationService.validateAll(updatedCues, state.config);
    set({ cues: updatedCues, validationResults });
  },

  deleteCue: (cueId) => {
    const state = get();
    state.pushHistory('Delete cue');
    const cues = state.cues.map((cue) =>
      cue.id === cueId ? { ...cue, isDeleted: true } : cue
    );
    const validationResults = ValidationService.validateAll(cues, state.config);
    set({ cues, validationResults });
  },

  restoreCue: (cueId) => {
    const state = get();
    state.pushHistory('Restore cue');
    const cues = state.cues.map((cue) =>
      cue.id === cueId ? { ...cue, isDeleted: false } : cue
    );
    const validationResults = ValidationService.validateAll(cues, state.config);
    set({ cues, validationResults });
  },

  splitCue: (cueId, cursorPosition) => {
    const state = get();
    state.pushHistory('Split cue');
    const cueIndex = state.cues.findIndex((c) => c.id === cueId);
    if (cueIndex < 0) return;

    const cue = state.cues[cueIndex]!;
    const textBefore = cue.text.substring(0, cursorPosition).trim();
    const textAfter = cue.text.substring(cursorPosition).trim();

    if (!textBefore || !textAfter) return;

    // Proportional time split based on character count
    const totalChars = cue.text.replace(/\n/g, '').length;
    const beforeChars = textBefore.replace(/\n/g, '').length;
    const ratio = beforeChars / Math.max(totalChars, 1);
    const splitTime = cue.start + (cue.end - cue.start) * ratio;

    const rand = Math.random().toString(36).substring(2, 10);
    const time = Date.now().toString(36);
    const newId: CueId = `cue_${time}${rand}`;

    const firstCue: SubtitleCue = {
      ...cue,
      text: textBefore,
      end: splitTime - state.config.minGap / 2,
      isEdited: true,
      validation: { isValid: true, issues: [], cps: 0, lineCount: 1, maxLineLength: 0 },
    };

    const secondCue: SubtitleCue = {
      ...cue,
      id: newId,
      text: textAfter,
      start: splitTime + state.config.minGap / 2,
      sequenceIndex: cue.sequenceIndex + 1,
      isEdited: true,
      validation: { isValid: true, issues: [], cps: 0, lineCount: 1, maxLineLength: 0 },
    };

    const newCues = [...state.cues];
    newCues.splice(cueIndex, 1, firstCue, secondCue);

    // Re-index and validate
    const reindexed = newCues.map((c, i) => ({ ...c, sequenceIndex: i + 1 }));
    const validated = reindexed.map((c) => ({
      ...c,
      validation: ValidationService.validateCue(c, reindexed, state.config),
    }));
    const validationResults = ValidationService.validateAll(validated, state.config);
    set({ cues: validated, validationResults });
  },

  mergeCues: (cueId1, cueId2) => {
    const state = get();
    state.pushHistory('Merge cues');
    const idx1 = state.cues.findIndex((c) => c.id === cueId1);
    const idx2 = state.cues.findIndex((c) => c.id === cueId2);
    if (idx1 < 0 || idx2 < 0) return;

    const cue1 = state.cues[Math.min(idx1, idx2)]!;
    const cue2 = state.cues[Math.max(idx1, idx2)]!;

    const mergedCue: SubtitleCue = {
      ...cue1,
      text: `${cue1.text}\n${cue2.text}`,
      end: cue2.end,
      isEdited: true,
      validation: { isValid: true, issues: [], cps: 0, lineCount: 1, maxLineLength: 0 },
    };

    const newCues = state.cues.filter((c) => c.id !== cue2.id);
    const mergeIdx = newCues.findIndex((c) => c.id === cue1.id);
    if (mergeIdx >= 0) {
      newCues[mergeIdx] = mergedCue;
    }

    // Re-index and validate
    const reindexed = newCues.map((c, i) => ({ ...c, sequenceIndex: i + 1 }));
    const validated = reindexed.map((c) => ({
      ...c,
      validation: ValidationService.validateCue(c, reindexed, state.config),
    }));
    const validationResults = ValidationService.validateAll(validated, state.config);
    set({ cues: validated, validationResults });
  },

  // Timeline actions
  setPlayheadPosition: (position) =>
    set((state) => ({
      timeline: { ...state.timeline, playheadPosition: position },
    })),

  setZoom: (zoom) =>
    set((state) => ({
      timeline: { ...state.timeline, zoom },
    })),

  setScrollOffset: (offset) =>
    set((state) => ({
      timeline: { ...state.timeline, scrollOffset: Math.max(0, offset) },
    })),

  setIsPlaying: (isPlaying) =>
    set((state) => ({
      timeline: { ...state.timeline, isPlaying },
    })),

  setTotalDuration: (totalDuration) =>
    set((state) => ({
      timeline: { ...state.timeline, totalDuration },
    })),

  // Editing actions
  setEditingCueId: (cueId) => set({ editingCueId: cueId }),

  // Configuration actions
  setConfig: (configUpdate) =>
    set((state) => ({
      config: { ...state.config, ...configUpdate },
    })),

  // Validation actions
  runValidation: () => {
    const state = get();
    const validated = state.cues.map((c) => ({
      ...c,
      validation: ValidationService.validateCue(c, state.cues, state.config),
    }));
    const validationResults = ValidationService.validateAll(validated, state.config);
    set({ cues: validated, validationResults });
  },

  // History actions
  pushHistory: (description) => {
    const state = get();
    const entry: HistoryEntry = {
      cues: JSON.parse(JSON.stringify(state.cues)),
      description,
      timestamp: Date.now(),
    };

    // Truncate future history if we're not at the end
    const history = state.history.slice(0, state.historyIndex + 1);
    history.push(entry);

    // Limit history length
    if (history.length > MAX_HISTORY) {
      history.shift();
    }

    set({
      history,
      historyIndex: history.length - 1,
    });
  },

  undo: () => {
    const state = get();
    if (state.historyIndex < 0) return;

    const entry = state.history[state.historyIndex];
    if (!entry) return;

    set({
      cues: entry.cues,
      historyIndex: state.historyIndex - 1,
      validationResults: ValidationService.validateAll(entry.cues, state.config),
    });
  },

  redo: () => {
    const state = get();
    if (state.historyIndex >= state.history.length - 1) return;

    const nextEntry = state.history[state.historyIndex + 1];
    if (!nextEntry) return;

    // Actually redo should go forward, but our history stores the state BEFORE the action.
    // So to redo, we need the state that was produced after the next entry was created.
    // Since we store snapshots before actions, redo means we apply the NEXT snapshot.
    // Let's just use the next index state
    const nextNextEntry = state.history[state.historyIndex + 2];
    if (nextNextEntry) {
      set({
        cues: nextNextEntry.cues,
        historyIndex: state.historyIndex + 2,
        validationResults: ValidationService.validateAll(nextNextEntry.cues, state.config),
      });
    } else {
      // At the end, advance pointer
      set({ historyIndex: state.historyIndex + 1 });
    }
  },

  // Generation actions
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setHasWordTimestamps: (has) => set({ hasWordTimestamps: has }),

  // Error actions
  setError: (error) => set({ error }),

  // Reset
  reset: () =>
    set({
      transcript: null,
      cues: [],
      timeline: initialTimeline,
      validationResults: initialValidation,
      config: DEFAULT_SUBTITLE_CONFIG,
      editingCueId: null,
      history: [],
      historyIndex: -1,
      isGenerating: false,
      hasWordTimestamps: false,
      error: null,
    }),
}));
