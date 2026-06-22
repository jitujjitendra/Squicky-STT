/**
 * Speech Engine Zustand Store
 *
 * Central state management for the speech engine module.
 * Manages upload state, processing jobs, engine selection,
 * and UI state (drag-over, error messages, etc.).
 *
 * Architecture decision: Zustand over Context for module state because:
 * - No provider wrapping needed (works anywhere in the component tree)
 * - Built-in selectors prevent unnecessary re-renders
 * - Simple API for complex state transitions
 * - Middleware support for devtools and persistence
 */

import { create } from 'zustand';
import type { TranscriptionJob, TranscriptionJobOptions, StandardTranscript } from '../types';
import type { EngineInfo } from '../services/EngineRegistry';

/**
 * Upload state for the drag-and-drop zone
 */
export interface UploadState {
  /** Whether files are being dragged over the zone */
  isDragOver: boolean;
  /** Currently selected files (before processing) */
  selectedFiles: File[];
  /** Upload/validation errors */
  errors: string[];
  /** Whether upload is in progress */
  isUploading: boolean;
}

/**
 * Speech Engine module state
 */
export interface SpeechEngineState {
  // Upload state
  upload: UploadState;

  // Processing state
  jobs: TranscriptionJob[];
  activeJobId: string | null;

  // Engine state
  engines: EngineInfo[];
  selectedEngineId: string | null;

  // Results
  transcripts: Map<string, StandardTranscript>;

  // Default options
  defaultOptions: TranscriptionJobOptions;

  // Actions - Upload
  setDragOver: (isDragOver: boolean) => void;
  setSelectedFiles: (files: File[]) => void;
  addUploadError: (error: string) => void;
  clearUploadErrors: () => void;
  setIsUploading: (isUploading: boolean) => void;
  resetUpload: () => void;

  // Actions - Jobs
  addJob: (job: TranscriptionJob) => void;
  updateJob: (job: TranscriptionJob) => void;
  removeJob: (jobId: string) => void;
  setActiveJob: (jobId: string | null) => void;
  clearCompletedJobs: () => void;

  // Actions - Engines
  setEngines: (engines: EngineInfo[]) => void;
  setSelectedEngine: (engineId: string | null) => void;

  // Actions - Results
  addTranscript: (jobId: string, transcript: StandardTranscript) => void;
  removeTranscript: (jobId: string) => void;
  clearAllTranscripts: () => void;

  // Actions - Options
  setDefaultOptions: (options: Partial<TranscriptionJobOptions>) => void;

  // Actions - Reset
  reset: () => void;
}

const initialUploadState: UploadState = {
  isDragOver: false,
  selectedFiles: [],
  errors: [],
  isUploading: false,
};

const initialOptions: TranscriptionJobOptions = {
  diarization: false,
  word_timestamps: true,
  model_size: 'base',
};

export const useSpeechEngineStore = create<SpeechEngineState>((set) => ({
  // Initial state
  upload: initialUploadState,
  jobs: [],
  activeJobId: null,
  engines: [],
  selectedEngineId: null,
  transcripts: new Map(),
  defaultOptions: initialOptions,

  // Upload actions
  setDragOver: (isDragOver) =>
    set((state) => ({ upload: { ...state.upload, isDragOver } })),

  setSelectedFiles: (selectedFiles) =>
    set((state) => ({ upload: { ...state.upload, selectedFiles, errors: [] } })),

  addUploadError: (error) =>
    set((state) => ({
      upload: { ...state.upload, errors: [...state.upload.errors, error] },
    })),

  clearUploadErrors: () =>
    set((state) => ({ upload: { ...state.upload, errors: [] } })),

  setIsUploading: (isUploading) =>
    set((state) => ({ upload: { ...state.upload, isUploading } })),

  resetUpload: () => set({ upload: initialUploadState }),

  // Job actions
  addJob: (job) =>
    set((state) => ({ jobs: [...state.jobs, job] })),

  updateJob: (updatedJob) =>
    set((state) => ({
      jobs: state.jobs.map((j) => (j.id === updatedJob.id ? updatedJob : j)),
    })),

  removeJob: (jobId) =>
    set((state) => ({
      jobs: state.jobs.filter((j) => j.id !== jobId),
      activeJobId: state.activeJobId === jobId ? null : state.activeJobId,
    })),

  setActiveJob: (jobId) => set({ activeJobId: jobId }),

  clearCompletedJobs: () =>
    set((state) => ({
      jobs: state.jobs.filter(
        (j) => j.status !== 'completed' && j.status !== 'failed' && j.status !== 'cancelled'
      ),
    })),

  // Engine actions
  setEngines: (engines) => set({ engines }),

  setSelectedEngine: (engineId) => set({ selectedEngineId: engineId }),

  // Result actions
  addTranscript: (jobId, transcript) =>
    set((state) => {
      const newMap = new Map(state.transcripts);
      newMap.set(jobId, transcript);
      return { transcripts: newMap };
    }),

  removeTranscript: (jobId) =>
    set((state) => {
      const newMap = new Map(state.transcripts);
      newMap.delete(jobId);
      return { transcripts: newMap };
    }),

  clearAllTranscripts: () => set({ transcripts: new Map() }),

  // Options actions
  setDefaultOptions: (options) =>
    set((state) => ({
      defaultOptions: { ...state.defaultOptions, ...options },
    })),

  // Reset
  reset: () =>
    set({
      upload: initialUploadState,
      jobs: [],
      activeJobId: null,
      transcripts: new Map(),
      defaultOptions: initialOptions,
    }),
}));
