/**
 * Subtitle Studio Types
 *
 * Core type definitions for subtitle generation, editing, validation,
 * and timeline visualization.
 *
 * Architecture decision: Subtitle cues are derived from transcript segments
 * but maintained as independent data. This allows editing cue text and timing
 * without mutating the source transcript.
 */

import type { SpeakerId, LanguageCode } from '@/modules/speech-engine/types';

/** Unique cue identifier with `cue_` prefix */
export type CueId = `cue_${string}`;

/**
 * Validation severity levels
 */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/**
 * Validation issue types
 */
export type ValidationIssueType =
  | 'overlap'
  | 'duration_min'
  | 'duration_max'
  | 'cps_warning'
  | 'cps_error'
  | 'line_length'
  | 'empty_text'
  | 'sequential_timing';

/**
 * Validation issue for a single cue
 */
export interface ValidationIssue {
  /** Issue type identifier */
  type: ValidationIssueType;
  /** Severity level */
  severity: ValidationSeverity;
  /** Human-readable description */
  message: string;
  /** ID of the affected cue */
  cueId: CueId;
  /** Whether this issue can be auto-fixed */
  autoFixable: boolean;
}

/**
 * Per-cue validation state
 */
export interface CueValidation {
  /** Whether the cue passes all checks */
  isValid: boolean;
  /** List of issues found */
  issues: ValidationIssue[];
  /** Characters per second */
  cps: number;
  /** Number of lines */
  lineCount: number;
  /** Max line length in characters */
  maxLineLength: number;
}

/**
 * A single subtitle cue
 */
export interface SubtitleCue {
  /** Unique cue identifier */
  id: CueId;
  /** Display order index */
  sequenceIndex: number;
  /** Start time in seconds */
  start: number;
  /** End time in seconds */
  end: number;
  /** Cue text content (may contain newlines for multi-line) */
  text: string;
  /** Speaker attribution */
  speakerId?: SpeakerId;
  /** Speaker display name */
  speakerName?: string;
  /** Language of this cue */
  language?: LanguageCode;
  /** Per-cue validation state */
  validation: CueValidation;
  /** Whether this cue has been manually edited */
  isEdited: boolean;
  /** Whether this cue has been soft-deleted */
  isDeleted: boolean;
}

/**
 * Generation configuration for subtitle rules
 */
export interface SubtitleConfig {
  /** Maximum characters per line */
  maxCharsPerLine: number;
  /** Maximum number of lines per cue */
  maxLines: number;
  /** Minimum cue duration in seconds */
  minDuration: number;
  /** Maximum cue duration in seconds */
  maxDuration: number;
  /** Minimum gap between cues in seconds */
  minGap: number;
  /** Target characters per second */
  targetCPS: number;
  /** Warning threshold for CPS */
  warnCPS: number;
  /** Error threshold for CPS */
  errorCPS: number;
}

/** Default subtitle generation configuration */
export const DEFAULT_SUBTITLE_CONFIG: SubtitleConfig = {
  maxCharsPerLine: 42,
  maxLines: 2,
  minDuration: 1.0,
  maxDuration: 7.0,
  minGap: 0.08,
  targetCPS: 17,
  warnCPS: 25,
  errorCPS: 30,
};

/**
 * Timeline zoom levels
 */
export type TimelineZoom = 'fit' | '30s' | '10s' | '3s';

/**
 * Timeline state
 */
export interface TimelineState {
  /** Current zoom level */
  zoom: TimelineZoom;
  /** Scroll offset in seconds */
  scrollOffset: number;
  /** Playhead position in seconds */
  playheadPosition: number;
  /** Whether playback is active */
  isPlaying: boolean;
  /** Total duration in seconds */
  totalDuration: number;
}

/**
 * Undo/redo history entry
 */
export interface HistoryEntry {
  /** Snapshot of cues at this point */
  cues: SubtitleCue[];
  /** Description of the action */
  description: string;
  /** Timestamp of the action */
  timestamp: number;
}

/**
 * Validation results summary
 */
export interface ValidationResults {
  /** Total number of issues */
  totalIssues: number;
  /** Number of errors */
  errors: number;
  /** Number of warnings */
  warnings: number;
  /** All issues across all cues */
  issues: ValidationIssue[];
  /** Whether all cues pass validation */
  isValid: boolean;
}
