/**
 * Transcript Studio Editor Types
 *
 * Defines the editing layer, search state, audio sync state,
 * session persistence, and display models for the transcript studio.
 *
 * Architecture: Three-layer model:
 *   Source Layer - immutable StandardTranscript from speech engine
 *   Edit Layer - user modifications (edits, splits, merges, deletes)
 *   Display Layer - computed view combining source + edits + search highlights
 */

import type { SegmentId, SpeakerId } from '@/modules/speech-engine/types';

/** Types of edit operations supported */
export type EditOperationType =
  | 'edit_text'
  | 'split_segment'
  | 'merge_segments'
  | 'delete_segment'
  | 'restore_segment'
  | 'change_speaker'
  | 'rename_speaker';

/**
 * A single atomic edit operation for undo/redo tracking
 */
export interface EditOperation {
  /** Unique operation ID */
  id: string;
  /** Type of edit */
  type: EditOperationType;
  /** Timestamp of operation */
  timestamp: number;
  /** Segment(s) affected */
  segmentIds: SegmentId[];
  /** Previous value (for undo) */
  previousValue: unknown;
  /** New value (for redo) */
  newValue: unknown;
}

/**
 * The edit layer tracks all user modifications to the transcript.
 * These modifications are non-destructive overlays on the source transcript.
 */
export interface EditLayer {
  /** Map of segment ID to edited text_display */
  textEdits: Record<string, string>;
  /** Map of segment ID to new speaker assignment */
  speakerChanges: Record<string, SpeakerId>;
  /** Set of deleted segment IDs */
  deletedSegments: string[];
  /** Split operations: original segment ID to array of new segment data */
  splits: Record<string, Array<{ id: string; text: string; start: number; end: number }>>;
  /** Merge operations: first segment ID to array of merged segment IDs */
  merges: Record<string, string[]>;
  /** Speaker renames: speaker ID to new display name */
  speakerRenames: Record<string, string>;
}

/**
 * A single search match within the transcript
 */
export interface SearchMatch {
  /** Segment ID containing the match */
  segmentId: SegmentId;
  /** Character offset within the segment text */
  startOffset: number;
  /** Length of the match */
  length: number;
  /** Match index for navigation */
  index: number;
}

/**
 * Search state for find-in-transcript functionality
 */
export interface SearchState {
  /** Current search query */
  query: string;
  /** Whether search is active/visible */
  isOpen: boolean;
  /** All matches found */
  matches: SearchMatch[];
  /** Currently highlighted match index */
  activeMatchIndex: number;
  /** Whether search is case-sensitive */
  caseSensitive: boolean;
}

/**
 * Audio playback synchronization state
 */
export interface AudioSyncState {
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Current playback position in seconds */
  currentTime: number;
  /** Total audio duration in seconds */
  duration: number;
  /** Currently active segment (based on playback position) */
  activeSegmentId: SegmentId | null;
  /** Playback rate (1.0 = normal) */
  playbackRate: number;
}

/**
 * Color assignment for speakers
 */
export interface SpeakerColor {
  /** Speaker ID */
  speakerId: SpeakerId;
  /** CSS color value */
  color: string;
  /** Background color (lighter variant) */
  bgColor: string;
}

/**
 * Speaker display configuration
 */
export interface SpeakerDisplayConfig {
  /** Speaker ID */
  id: SpeakerId;
  /** Display name (user-edited or machine label) */
  displayName: string;
  /** Assigned color */
  color: SpeakerColor;
  /** Whether to show this speaker's segments */
  visible: boolean;
}

/**
 * Session data persisted to localStorage
 */
export interface SessionData {
  /** Transcript ID this session belongs to */
  transcriptId: string;
  /** Edit layer state */
  editLayer: EditLayer;
  /** Undo history */
  undoStack: EditOperation[];
  /** Redo history */
  redoStack: EditOperation[];
  /** Speaker display configs */
  speakerConfigs: SpeakerDisplayConfig[];
  /** Last saved timestamp */
  savedAt: number;
  /** Session version for migration */
  version: number;
}

/**
 * Configuration for the transcript studio
 */
export interface TranscriptStudioConfig {
  /** Whether to show timestamps */
  showTimestamps: boolean;
  /** Whether to show confidence indicators */
  showConfidence: boolean;
  /** Whether to show speaker labels */
  showSpeakers: boolean;
  /** Auto-scroll to active segment during playback */
  autoScroll: boolean;
  /** Font size multiplier */
  fontSize: number;
}

/**
 * Display segment - computed from source + edit layer
 * Used by the TranscriptViewer for rendering
 */
export interface DisplaySegment {
  /** Segment ID */
  id: SegmentId;
  /** Display text (edit layer override or source) */
  text: string;
  /** Original text from source */
  originalText: string;
  /** Start time in seconds */
  start: number;
  /** End time in seconds */
  end: number;
  /** Speaker ID */
  speakerId: SpeakerId | undefined;
  /** Confidence score */
  confidence: number;
  /** Whether this segment has been edited */
  isEdited: boolean;
  /** Whether this segment is deleted */
  isDeleted: boolean;
  /** Whether this is the currently active segment (audio sync) */
  isActive: boolean;
  /** Search matches within this segment */
  searchMatches: SearchMatch[];
  /** Sequence index for ordering */
  sequenceIndex: number;
}
