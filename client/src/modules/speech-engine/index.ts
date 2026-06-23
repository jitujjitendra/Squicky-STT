/**
 * Speech Engine Module - Barrel exports
 *
 * The core module for audio upload and speech-to-text processing.
 * Entry point: SpeechEnginePage (route: /speech-engine)
 *
 * Module structure:
 * - types/     - TypeScript interfaces and constants
 * - services/  - Processing pipeline services
 * - engines/   - Transcription engine adapters
 * - store/     - Zustand state management
 * - hooks/     - React hooks for component logic
 * - components/ - Reusable UI components
 */

export { SpeechEnginePage } from './SpeechEnginePage';

// Re-export types for cross-module consumption
export type {
  StandardTranscript,
  TranscriptSegment,
  TranscriptWord,
  SpeakerEntry,
  TranscriptionEngine,
  EngineCapabilities,
} from './types';
