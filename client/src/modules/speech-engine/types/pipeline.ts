/**
 * Processing Pipeline Types
 *
 * Defines the stages, states, and job structures for the
 * Upload -> Validate -> Queue -> Preprocess -> Transcribe -> Deliver pipeline.
 *
 * Architecture decision: Each pipeline stage is explicitly typed to enable
 * fine-grained status tracking, retry logic, and UI progress indicators.
 */

import type { StandardTranscript } from './transcript';

/**
 * Pipeline processing stages in order
 */
export type PipelineStage =
  | 'upload'
  | 'validation'
  | 'queued'
  | 'preprocessing'
  | 'transcription'
  | 'normalization'
  | 'completed'
  | 'failed';

/**
 * Job status within the queue
 */
export type JobStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'retrying';

/**
 * Job priority levels
 */
export type JobPriority = 'low' | 'normal' | 'high';

/**
 * File validation result
 */
export interface ValidationResult {
  /** Whether the file is valid */
  valid: boolean;
  /** Validation errors (if any) */
  errors: ValidationError[];
  /** File metadata extracted during validation */
  metadata?: FileMetadata;
}

/**
 * Validation error detail
 */
export interface ValidationError {
  /** Error code for programmatic handling */
  code: ValidationErrorCode;
  /** Human-readable error message */
  message: string;
  /** Additional context */
  details?: string;
}

/**
 * Validation error codes
 */
export type ValidationErrorCode =
  | 'UNSUPPORTED_FORMAT'
  | 'FILE_TOO_LARGE'
  | 'DURATION_TOO_LONG'
  | 'EMPTY_FILE'
  | 'CORRUPT_FILE'
  | 'NO_AUDIO_STREAM'
  | 'INVALID_ENCODING';

/**
 * File metadata extracted during validation
 */
export interface FileMetadata {
  /** Original filename */
  filename: string;
  /** MIME type */
  mime_type: string;
  /** File size in bytes */
  size_bytes: number;
  /** Duration in seconds (estimated from file size if not determinable) */
  duration_seconds: number;
  /** Number of audio channels */
  channels?: number;
  /** Sample rate in Hz */
  sample_rate?: number;
  /** Bit rate in kbps */
  bit_rate?: number;
  /** Whether the file contains video */
  has_video: boolean;
}

/**
 * Preprocessing options
 */
export interface PreprocessingOptions {
  /** Target sample rate in Hz */
  target_sample_rate: number;
  /** Convert to mono */
  mono: boolean;
  /** Normalize volume */
  normalize_volume: boolean;
  /** Extract audio from video container */
  extract_audio: boolean;
}

/**
 * A transcription job in the processing queue
 */
export interface TranscriptionJob {
  /** Unique job identifier */
  id: string;
  /** Original file reference */
  file: File;
  /** File metadata */
  metadata: FileMetadata;
  /** Current pipeline stage */
  stage: PipelineStage;
  /** Job status */
  status: JobStatus;
  /** Priority level */
  priority: JobPriority;
  /** Progress percentage (0-100) */
  progress: number;
  /** Engine to use for transcription */
  engine_id: string;
  /** Transcription options */
  options: TranscriptionJobOptions;
  /** Result (when completed) */
  result?: StandardTranscript;
  /** Error (when failed) */
  error?: PipelineError;
  /** Number of retry attempts */
  retry_count: number;
  /** Maximum retries allowed */
  max_retries: number;
  /** Timestamp when job was created */
  created_at: number;
  /** Timestamp when job started processing */
  started_at?: number;
  /** Timestamp when job completed/failed */
  completed_at?: number;
}

/**
 * Options for a transcription job
 */
export interface TranscriptionJobOptions {
  /** Target language (auto if not set) */
  language?: string;
  /** Enable diarization */
  diarization: boolean;
  /** Enable word timestamps */
  word_timestamps: boolean;
  /** Model size */
  model_size: 'tiny' | 'base' | 'small' | 'medium' | 'large';
}

/**
 * Pipeline error structure
 */
export interface PipelineError {
  /** Error code */
  code: PipelineErrorCode;
  /** Human-readable message */
  message: string;
  /** Stage where the error occurred */
  stage: PipelineStage;
  /** Whether the error is retryable */
  retryable: boolean;
  /** Timestamp */
  timestamp: number;
}

/**
 * Pipeline error codes
 */
export type PipelineErrorCode =
  | 'VALIDATION_FAILED'
  | 'PREPROCESSING_FAILED'
  | 'ENGINE_NOT_READY'
  | 'TRANSCRIPTION_FAILED'
  | 'TRANSCRIPTION_TIMEOUT'
  | 'OUT_OF_MEMORY'
  | 'NORMALIZATION_FAILED'
  | 'CANCELLED'
  | 'UNKNOWN_ERROR';

/**
 * Supported audio formats
 */
export const SUPPORTED_AUDIO_FORMATS = [
  'audio/mpeg',        // MP3
  'audio/wav',         // WAV
  'audio/x-wav',       // WAV alternate
  'audio/mp4',         // M4A
  'audio/x-m4a',       // M4A alternate
  'audio/aac',         // AAC
  'audio/ogg',         // OGG
  'audio/flac',        // FLAC
  'audio/x-flac',      // FLAC alternate
] as const;

/**
 * Supported video formats (audio will be extracted)
 */
export const SUPPORTED_VIDEO_FORMATS = [
  'video/mp4',         // MP4
  'video/quicktime',   // MOV
  'video/x-matroska',  // MKV
  'video/x-msvideo',   // AVI
  'video/webm',        // WEBM
] as const;

/**
 * All supported MIME types
 */
export const SUPPORTED_FORMATS = [
  ...SUPPORTED_AUDIO_FORMATS,
  ...SUPPORTED_VIDEO_FORMATS,
] as const;

/**
 * File extension to MIME type mapping
 */
export const EXTENSION_MIME_MAP: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.ogg': 'audio/ogg',
  '.flac': 'audio/flac',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.mkv': 'video/x-matroska',
  '.avi': 'video/x-msvideo',
  '.webm': 'video/webm',
};

/**
 * File size limits
 */
export const FILE_SIZE_LIMITS = {
  /** Maximum audio file size: 200MB */
  AUDIO_MAX_BYTES: 200 * 1024 * 1024,
  /** Maximum video file size: 500MB */
  VIDEO_MAX_BYTES: 500 * 1024 * 1024,
} as const;

/**
 * Duration limits
 */
export const DURATION_LIMITS = {
  /** Maximum duration: 60 minutes */
  MAX_DURATION_SECONDS: 60 * 60,
} as const;
