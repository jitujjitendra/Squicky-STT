/**
 * Transcript Studio Module - Barrel exports
 *
 * The central workspace for reviewing, editing, and refining transcripts.
 * Features: inline editing, search, speaker management, audio sync,
 * undo/redo, session persistence, and multi-module integration.
 */

export { TranscriptStudioPage } from './TranscriptStudioPage';
export { useTranscriptStudioStore } from './store';
export type { TranscriptStudioState } from './store';
export type {
  EditOperation,
  EditLayer,
  SearchState,
  AudioSyncState,
  SpeakerDisplayConfig,
  TranscriptStudioConfig,
  DisplaySegment,
  SessionData,
} from './types';
