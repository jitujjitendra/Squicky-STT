/**
 * Speech Engine Types - Barrel exports
 *
 * Centralizes all type exports for the speech engine module.
 */

export type {
  SegmentId,
  SpeakerId,
  LanguageCode,
  TranscriptWord,
  SpeakerEntry,
  TranscriptSegment,
  QualityMeta,
  ProcessingFlags,
  TranscriptionMeta,
  StandardTranscript,
} from './transcript';

export type {
  EngineCapabilities,
  TranscriptionOptions,
  PartialTranscript,
  AudioRef,
  TranscriptionEngine,
} from './engine';

export type {
  PipelineStage,
  JobStatus,
  JobPriority,
  ValidationResult,
  ValidationError,
  ValidationErrorCode,
  FileMetadata,
  PreprocessingOptions,
  TranscriptionJob,
  TranscriptionJobOptions,
  PipelineError,
  PipelineErrorCode,
} from './pipeline';

export {
  SUPPORTED_AUDIO_FORMATS,
  SUPPORTED_VIDEO_FORMATS,
  SUPPORTED_FORMATS,
  EXTENSION_MIME_MAP,
  FILE_SIZE_LIMITS,
  DURATION_LIMITS,
} from './pipeline';
