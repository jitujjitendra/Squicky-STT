/**
 * Export Center Zustand Store
 *
 * Central state management for the export pipeline.
 * Manages payload, format selection, options, progress,
 * results, and error state.
 *
 * Architecture decision: Zustand matches the pattern used by speech-engine
 * and other modules - no provider needed, built-in selectors, simple API.
 */

import { create } from 'zustand';
import type {
  ExportFormat,
  ExportOptions,
  ExportProgress,
  ExportResult,
  TemplateName,
} from '../types';
import type { StandardTranscript } from '@/modules/speech-engine/types';

/**
 * Export Center state interface
 */
export interface ExportCenterState {
  // Source data
  transcript: StandardTranscript | null;

  // Format selection
  selectedFormats: ExportFormat[];

  // Options
  options: ExportOptions;

  // Pipeline state
  isExporting: boolean;
  progress: ExportProgress | null;

  // Results
  results: ExportResult[];

  // Errors
  errors: string[];

  // Preview
  previewContent: string | null;
  previewFormat: ExportFormat | null;

  // Actions - Source
  setTranscript: (transcript: StandardTranscript | null) => void;

  // Actions - Formats
  toggleFormat: (format: ExportFormat) => void;
  setFormats: (formats: ExportFormat[]) => void;
  clearFormats: () => void;

  // Actions - Options
  setOption: <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) => void;
  setTemplate: (template: TemplateName) => void;
  resetOptions: () => void;

  // Actions - Pipeline
  setIsExporting: (isExporting: boolean) => void;
  setProgress: (progress: ExportProgress | null) => void;

  // Actions - Results
  addResult: (result: ExportResult) => void;
  setResults: (results: ExportResult[]) => void;
  clearResults: () => void;

  // Actions - Errors
  addError: (error: string) => void;
  clearErrors: () => void;

  // Actions - Preview
  setPreview: (content: string | null, format: ExportFormat | null) => void;

  // Actions - Reset
  reset: () => void;
}

const defaultOptions: ExportOptions = {
  include_timestamps: true,
  include_speakers: true,
  include_confidence: false,
  mode: 'compact',
  template: 'standard',
};

export const useExportCenterStore = create<ExportCenterState>((set) => ({
  // Initial state
  transcript: null,
  selectedFormats: [],
  options: defaultOptions,
  isExporting: false,
  progress: null,
  results: [],
  errors: [],
  previewContent: null,
  previewFormat: null,

  // Source actions
  setTranscript: (transcript) => set({ transcript }),

  // Format actions
  toggleFormat: (format) =>
    set((state) => {
      const isSelected = state.selectedFormats.includes(format);
      return {
        selectedFormats: isSelected
          ? state.selectedFormats.filter((f) => f !== format)
          : [...state.selectedFormats, format],
      };
    }),

  setFormats: (formats) => set({ selectedFormats: formats }),

  clearFormats: () => set({ selectedFormats: [] }),

  // Option actions
  setOption: (key, value) =>
    set((state) => ({
      options: { ...state.options, [key]: value },
    })),

  setTemplate: (template) =>
    set((state) => ({
      options: { ...state.options, template },
    })),

  resetOptions: () => set({ options: defaultOptions }),

  // Pipeline actions
  setIsExporting: (isExporting) => set({ isExporting }),

  setProgress: (progress) => set({ progress }),

  // Result actions
  addResult: (result) =>
    set((state) => ({ results: [...state.results, result] })),

  setResults: (results) => set({ results }),

  clearResults: () => set({ results: [] }),

  // Error actions
  addError: (error) =>
    set((state) => ({ errors: [...state.errors, error] })),

  clearErrors: () => set({ errors: [] }),

  // Preview actions
  setPreview: (content, format) => set({ previewContent: content, previewFormat: format }),

  // Reset
  reset: () =>
    set({
      transcript: null,
      selectedFormats: [],
      options: defaultOptions,
      isExporting: false,
      progress: null,
      results: [],
      errors: [],
      previewContent: null,
      previewFormat: null,
    }),
}));
