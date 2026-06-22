/**
 * Transcription Engine Interface
 *
 * Defines the pluggable engine contract. Each speech-to-text engine
 * (Whisper, Faster Whisper, future engines) must implement this interface
 * via an adapter.
 *
 * Architecture decision: The adapter pattern decouples the platform from
 * any single transcription engine. New engines are added by implementing
 * this interface without modifying existing code.
 */

import type { StandardTranscript } from './transcript';

/**
 * Engine capability declaration
 */
export interface EngineCapabilities {
  /** Supports real-time streaming transcription */
  streaming: boolean;
  /** Supports speaker diarization */
  diarization: boolean;
  /** Provides per-word timestamps */
  word_timestamps: boolean;
  /** Supported language codes */
  languages: string[];
  /** Maximum audio duration in seconds */
  max_duration_sec: number;
  /** Where this engine runs (determines compute-placement logic) */
  compute_requirement: 'cpu' | 'gpu' | 'wasm';
}

/**
 * Options passed to the transcription engine
 */
export interface TranscriptionOptions {
  /** Target language (auto-detect if not specified) */
  language?: string;
  /** Enable speaker diarization */
  diarization?: boolean;
  /** Enable word-level timestamps */
  word_timestamps?: boolean;
  /** Model size variant */
  model_size?: 'tiny' | 'base' | 'small' | 'medium' | 'large';
  /** Callback for progress updates */
  on_progress?: (progress: number) => void;
}

/**
 * Partial transcript emitted during streaming
 */
export interface PartialTranscript {
  /** Whether this is the final chunk */
  is_final: boolean;
  /** Partial text content */
  text: string;
  /** Start time of this chunk */
  start: number;
  /** End time of this chunk */
  end: number;
  /** Confidence for this chunk */
  confidence: number;
}

/**
 * Reference to an audio source for transcription
 */
export interface AudioRef {
  /** Type of audio source */
  type: 'blob' | 'url' | 'buffer';
  /** The audio data */
  data: Blob | string | ArrayBuffer;
  /** MIME type of the audio */
  mime_type: string;
  /** Duration in seconds */
  duration_seconds: number;
}

/**
 * TranscriptionEngine Interface
 *
 * Contract that all engine adapters must implement.
 * The platform never calls engine-specific APIs directly.
 */
export interface TranscriptionEngine {
  /** Engine display name */
  name(): string;
  /** Engine version string */
  version(): string;
  /** Declared capabilities */
  capabilities(): EngineCapabilities;
  /** Whether the engine is loaded and ready */
  isReady(): boolean;
  /** Initialize/load the engine (e.g., load WASM module) */
  initialize(): Promise<void>;
  /** Perform batch transcription */
  transcribe(audioRef: AudioRef, options: TranscriptionOptions): Promise<StandardTranscript>;
  /** Stream transcription results (if supported) */
  stream?(
    audioChunks: AsyncIterable<ArrayBuffer>,
    options: TranscriptionOptions
  ): AsyncGenerator<PartialTranscript>;
  /** Release engine resources */
  dispose(): Promise<void>;
}
