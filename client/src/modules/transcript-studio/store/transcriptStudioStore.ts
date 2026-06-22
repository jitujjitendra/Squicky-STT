/**
 * Transcript Studio Zustand Store
 *
 * Central state management for the transcript studio module.
 * Implements the three-layer architecture:
 *   Source Layer - immutable StandardTranscript
 *   Edit Layer - user modifications (non-destructive overlay)
 *   Display Layer - computed view for rendering
 *
 * Features: undo/redo, search, audio sync, session persistence,
 * speaker management, and display configuration.
 */

import { create } from 'zustand';
import type { StandardTranscript, SegmentId, SpeakerId } from '@/modules/speech-engine/types';
import type {
  EditLayer,
  EditOperation,
  SearchState,
  AudioSyncState,
  SpeakerDisplayConfig,
  TranscriptStudioConfig,
  DisplaySegment,
} from '../types';
import { applyOperation, revertOperation } from '../services/EditService';
import { searchTranscript } from '../services/SearchService';
import { computeDisplaySegments, computeStats } from '../services/MergeService';

/** Default speaker colors palette */
const SPEAKER_COLORS = [
  { color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)' },
  { color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)' },
  { color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' },
  { color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' },
  { color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)' },
  { color: '#ec4899', bgColor: 'rgba(236, 72, 153, 0.1)' },
  { color: '#06b6d4', bgColor: 'rgba(6, 182, 212, 0.1)' },
  { color: '#84cc16', bgColor: 'rgba(132, 204, 22, 0.1)' },
];

/** Initial empty edit layer */
const EMPTY_EDIT_LAYER: EditLayer = {
  textEdits: {},
  speakerChanges: {},
  deletedSegments: [],
  splits: {},
  merges: {},
  speakerRenames: {},
};

/** Default studio configuration */
const DEFAULT_CONFIG: TranscriptStudioConfig = {
  showTimestamps: true,
  showConfidence: true,
  showSpeakers: true,
  autoScroll: true,
  fontSize: 1,
};

/**
 * Transcript Studio store state
 */
export interface TranscriptStudioState {
  // Source Layer
  transcript: StandardTranscript | null;
  isLoading: boolean;
  error: string | null;

  // Edit Layer
  editLayer: EditLayer;
  undoStack: EditOperation[];
  redoStack: EditOperation[];

  // Search
  search: SearchState;

  // Audio Sync
  audio: AudioSyncState;

  // Speaker Management
  speakerConfigs: SpeakerDisplayConfig[];

  // Display Config
  config: TranscriptStudioConfig;

  // Computed Display Segments
  displaySegments: DisplaySegment[];

  // Stats
  stats: {
    wordCount: number;
    segmentCount: number;
    speakerCount: number;
    duration: number;
    qualityLabel: string;
    qualityScore: number;
  };

  // Editing state
  editingSegmentId: SegmentId | null;

  // Actions - Source
  setTranscript: (transcript: StandardTranscript) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Actions - Edit
  applyEdit: (operation: EditOperation) => void;
  undo: () => void;
  redo: () => void;
  setEditingSegment: (segmentId: SegmentId | null) => void;

  // Actions - Search
  openSearch: () => void;
  closeSearch: () => void;
  setSearchQuery: (query: string) => void;
  setSearchCaseSensitive: (caseSensitive: boolean) => void;
  nextMatch: () => void;
  prevMatch: () => void;

  // Actions - Audio
  setPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setPlaybackRate: (rate: number) => void;
  seekTo: (time: number) => void;

  // Actions - Speaker
  setSpeakerConfigs: (configs: SpeakerDisplayConfig[]) => void;
  updateSpeakerName: (speakerId: SpeakerId, name: string) => void;
  toggleSpeakerVisibility: (speakerId: SpeakerId) => void;

  // Actions - Config
  updateConfig: (config: Partial<TranscriptStudioConfig>) => void;

  // Actions - Session
  restoreSession: (
    editLayer: EditLayer,
    undoStack: EditOperation[],
    redoStack: EditOperation[],
    speakerConfigs: SpeakerDisplayConfig[]
  ) => void;

  // Actions - Reset
  reset: () => void;

  // Internal
  _recomputeDisplay: () => void;
}

export const useTranscriptStudioStore = create<TranscriptStudioState>((set, get) => ({
  // Initial state
  transcript: null,
  isLoading: false,
  error: null,
  editLayer: EMPTY_EDIT_LAYER,
  undoStack: [],
  redoStack: [],
  search: {
    query: '',
    isOpen: false,
    matches: [],
    activeMatchIndex: -1,
    caseSensitive: false,
  },
  audio: {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    activeSegmentId: null,
    playbackRate: 1,
  },
  speakerConfigs: [],
  config: DEFAULT_CONFIG,
  displaySegments: [],
  stats: {
    wordCount: 0,
    segmentCount: 0,
    speakerCount: 0,
    duration: 0,
    qualityLabel: 'good',
    qualityScore: 0,
  },
  editingSegmentId: null,

  // Source actions
  setTranscript: (transcript) => {
    const speakerConfigs = transcript.speakers.entries.map((speaker, index) => ({
      id: speaker.id,
      displayName: speaker.display_name ?? speaker.label,
      color: {
        speakerId: speaker.id,
        color: SPEAKER_COLORS[index % SPEAKER_COLORS.length]?.color ?? '#6b7280',
        bgColor: SPEAKER_COLORS[index % SPEAKER_COLORS.length]?.bgColor ?? 'rgba(107, 114, 128, 0.1)',
      },
      visible: true,
    }));

    set({ transcript, speakerConfigs, error: null });
    get()._recomputeDisplay();
  },

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  // Edit actions
  applyEdit: (operation) => {
    const { editLayer, undoStack } = get();
    const newEditLayer = applyOperation(editLayer, operation);
    set({
      editLayer: newEditLayer,
      undoStack: [...undoStack, operation],
      redoStack: [],
    });
    get()._recomputeDisplay();
  },

  undo: () => {
    const { undoStack, redoStack, editLayer } = get();
    if (undoStack.length === 0) return;

    const lastOp = undoStack[undoStack.length - 1];
    if (!lastOp) return;

    const newEditLayer = revertOperation(editLayer, lastOp);
    set({
      editLayer: newEditLayer,
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, lastOp],
    });
    get()._recomputeDisplay();
  },

  redo: () => {
    const { undoStack, redoStack, editLayer } = get();
    if (redoStack.length === 0) return;

    const lastOp = redoStack[redoStack.length - 1];
    if (!lastOp) return;

    const newEditLayer = applyOperation(editLayer, lastOp);
    set({
      editLayer: newEditLayer,
      undoStack: [...undoStack, lastOp],
      redoStack: redoStack.slice(0, -1),
    });
    get()._recomputeDisplay();
  },

  setEditingSegment: (segmentId) => set({ editingSegmentId: segmentId }),

  // Search actions
  openSearch: () => set((state) => ({ search: { ...state.search, isOpen: true } })),

  closeSearch: () =>
    set({
      search: {
        query: '',
        isOpen: false,
        matches: [],
        activeMatchIndex: -1,
        caseSensitive: false,
      },
    }),

  setSearchQuery: (query) => {
    const { transcript, editLayer, search } = get();
    if (!transcript) {
      set((state) => ({ search: { ...state.search, query, matches: [], activeMatchIndex: -1 } }));
      return;
    }

    const matches = searchTranscript(
      transcript.segments,
      editLayer,
      query,
      search.caseSensitive
    );

    set({
      search: {
        ...search,
        query,
        matches,
        activeMatchIndex: matches.length > 0 ? 0 : -1,
      },
    });
    get()._recomputeDisplay();
  },

  setSearchCaseSensitive: (caseSensitive) => {
    const { transcript, editLayer, search } = get();
    if (!transcript) {
      set((state) => ({ search: { ...state.search, caseSensitive } }));
      return;
    }

    const matches = searchTranscript(
      transcript.segments,
      editLayer,
      search.query,
      caseSensitive
    );

    set({
      search: {
        ...search,
        caseSensitive,
        matches,
        activeMatchIndex: matches.length > 0 ? 0 : -1,
      },
    });
    get()._recomputeDisplay();
  },

  nextMatch: () => {
    const { search } = get();
    if (search.matches.length === 0) return;
    const nextIndex = (search.activeMatchIndex + 1) % search.matches.length;
    set({ search: { ...search, activeMatchIndex: nextIndex } });
  },

  prevMatch: () => {
    const { search } = get();
    if (search.matches.length === 0) return;
    const prevIndex =
      search.activeMatchIndex <= 0
        ? search.matches.length - 1
        : search.activeMatchIndex - 1;
    set({ search: { ...search, activeMatchIndex: prevIndex } });
  },

  // Audio actions
  setPlaying: (isPlaying) => set((state) => ({ audio: { ...state.audio, isPlaying } })),

  setCurrentTime: (currentTime) => {
    const { transcript, audio } = get();
    if (!transcript) {
      set({ audio: { ...audio, currentTime } });
      return;
    }

    // Find active segment based on current time
    const activeSegment = transcript.segments.find(
      (seg) => currentTime >= seg.start && currentTime <= seg.end
    );

    const activeSegmentId = activeSegment?.id ?? null;

    if (activeSegmentId !== audio.activeSegmentId) {
      set({ audio: { ...audio, currentTime, activeSegmentId } });
      get()._recomputeDisplay();
    } else {
      set({ audio: { ...audio, currentTime } });
    }
  },

  setDuration: (duration) => set((state) => ({ audio: { ...state.audio, duration } })),

  setPlaybackRate: (playbackRate) =>
    set((state) => ({ audio: { ...state.audio, playbackRate } })),

  seekTo: (time) => {
    const { audio } = get();
    set({ audio: { ...audio, currentTime: time } });
  },

  // Speaker actions
  setSpeakerConfigs: (configs) => set({ speakerConfigs: configs }),

  updateSpeakerName: (speakerId, name) => {
    const { speakerConfigs } = get();
    const updated = speakerConfigs.map((config) =>
      config.id === speakerId ? { ...config, displayName: name } : config
    );
    set({ speakerConfigs: updated });
  },

  toggleSpeakerVisibility: (speakerId) => {
    const { speakerConfigs } = get();
    const updated = speakerConfigs.map((config) =>
      config.id === speakerId ? { ...config, visible: !config.visible } : config
    );
    set({ speakerConfigs: updated });
  },

  // Config actions
  updateConfig: (configUpdate) =>
    set((state) => ({ config: { ...state.config, ...configUpdate } })),

  // Session actions
  restoreSession: (editLayer, undoStack, redoStack, speakerConfigs) => {
    set({ editLayer, undoStack, redoStack, speakerConfigs });
    get()._recomputeDisplay();
  },

  // Reset
  reset: () =>
    set({
      transcript: null,
      isLoading: false,
      error: null,
      editLayer: EMPTY_EDIT_LAYER,
      undoStack: [],
      redoStack: [],
      search: {
        query: '',
        isOpen: false,
        matches: [],
        activeMatchIndex: -1,
        caseSensitive: false,
      },
      audio: {
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        activeSegmentId: null,
        playbackRate: 1,
      },
      speakerConfigs: [],
      config: DEFAULT_CONFIG,
      displaySegments: [],
      stats: {
        wordCount: 0,
        segmentCount: 0,
        speakerCount: 0,
        duration: 0,
        qualityLabel: 'good',
        qualityScore: 0,
      },
      editingSegmentId: null,
    }),

  // Internal recompute
  _recomputeDisplay: () => {
    const { transcript, editLayer, audio, search } = get();
    if (!transcript) {
      set({ displaySegments: [], stats: { wordCount: 0, segmentCount: 0, speakerCount: 0, duration: 0, qualityLabel: 'good', qualityScore: 0 } });
      return;
    }

    const displaySegments = computeDisplaySegments(
      transcript,
      editLayer,
      audio.activeSegmentId,
      search.matches
    );

    const stats = computeStats(transcript, displaySegments);

    set({ displaySegments, stats });
  },
}));
