/**
 * Export Center Types
 *
 * Core type definitions for the export pipeline, format converters,
 * templates, and delivery system.
 *
 * Architecture decision: A typed pipeline with discrete stages ensures
 * each transformation step is predictable and testable. The IntermediateDocument
 * model decouples template logic from format-specific rendering.
 */

import type { StandardTranscript } from '@/modules/speech-engine/types';

/** Supported export format identifiers */
export type ExportFormat =
  | 'txt'
  | 'markdown'
  | 'html'
  | 'csv'
  | 'json'
  | 'srt'
  | 'vtt'
  | 'pdf'
  | 'docx';

/** Export mode controlling output verbosity */
export type ExportMode = 'compact' | 'detailed';

/** Template identifiers for structured output */
export type TemplateName =
  | 'standard'
  | 'meeting'
  | 'interview'
  | 'podcast'
  | 'business'
  | 'youtube';

/** Pipeline stage identifiers */
export type PipelineStage =
  | 'receive'
  | 'validate'
  | 'template'
  | 'convert'
  | 'package'
  | 'download';

/**
 * Export options configurable by the user
 */
export interface ExportOptions {
  /** Include timestamps in output */
  include_timestamps: boolean;
  /** Include speaker labels */
  include_speakers: boolean;
  /** Include confidence scores */
  include_confidence: boolean;
  /** Output verbosity mode */
  mode: ExportMode;
  /** Selected template */
  template: TemplateName;
}

/**
 * Export payload containing source data and configuration
 */
export interface ExportPayload {
  /** Source transcript data */
  transcript: StandardTranscript;
  /** Selected export formats */
  formats: ExportFormat[];
  /** Export options */
  options: ExportOptions;
}

/**
 * Section within an IntermediateDocument
 */
export interface DocumentSection {
  /** Section type for rendering hints */
  type: 'header' | 'metadata' | 'speakers' | 'content' | 'footer' | 'separator';
  /** Section title (optional) */
  title?: string;
  /** Lines of content */
  lines: string[];
}

/**
 * IntermediateDocument model - template output consumed by format converters
 *
 * Decouples template logic from format rendering. Templates produce this
 * structure; converters transform it into format-specific strings.
 */
export interface IntermediateDocument {
  /** Document title */
  title: string;
  /** Document metadata key-value pairs */
  metadata: Record<string, string>;
  /** Ordered sections */
  sections: DocumentSection[];
  /** Raw segments for formats that need direct access (SRT, VTT) */
  segments: Array<{
    index: number;
    start: number;
    end: number;
    speaker?: string;
    text: string;
    confidence?: number;
  }>;
}

/**
 * Format converter interface - transforms IntermediateDocument to string output
 */
export interface FormatConverter {
  /** Format identifier */
  format: ExportFormat;
  /** Human-readable format name */
  label: string;
  /** File extension (including dot) */
  extension: string;
  /** MIME type for download */
  mimeType: string;
  /** Whether this converter is fully implemented */
  available: boolean;
  /** Convert IntermediateDocument to format string */
  convert(doc: IntermediateDocument, options: ExportOptions): string;
}

/**
 * Export template definition
 */
export interface ExportTemplate {
  /** Template identifier */
  name: TemplateName;
  /** Human-readable label */
  label: string;
  /** Brief description */
  description: string;
  /** Transform transcript into IntermediateDocument */
  apply(transcript: StandardTranscript, options: ExportOptions): IntermediateDocument;
}

/**
 * Result of a single format export
 */
export interface ExportResult {
  /** Format that was exported */
  format: ExportFormat;
  /** Generated content as string */
  content: string;
  /** Filename for download */
  filename: string;
  /** MIME type */
  mimeType: string;
  /** Content size in bytes */
  sizeBytes: number;
  /** Whether export was successful */
  success: boolean;
  /** Error message if failed */
  error?: string;
}

/**
 * Export pipeline progress state
 */
export interface ExportProgress {
  /** Current pipeline stage */
  stage: PipelineStage;
  /** Overall progress (0-100) */
  percent: number;
  /** Status message */
  message: string;
}
