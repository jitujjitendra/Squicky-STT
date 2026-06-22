/**
 * Preprocessing Service
 *
 * Handles audio preprocessing steps: audio extraction from video,
 * format normalization, sample rate conversion, mono conversion,
 * and volume normalization.
 *
 * Architecture decision: This service uses the Web Audio API where possible.
 * In Stage 1, preprocessing is lightweight (metadata extraction + passthrough).
 * The service architecture is designed for future expansion with WASM-based
 * audio processing (noise reduction, echo cancellation, voice isolation).
 *
 * Future expansion hooks:
 * - Noise reduction (via RNNoise WASM)
 * - Echo cancellation
 * - Voice isolation (source separation)
 */

import type { AudioRef, PreprocessingOptions, FileMetadata } from '../types';

/** Default preprocessing configuration */
const DEFAULT_OPTIONS: PreprocessingOptions = {
  target_sample_rate: 16000,
  mono: true,
  normalize_volume: true,
  extract_audio: true,
};

export interface PreprocessingResult {
  /** Processed audio reference */
  audioRef: AudioRef;
  /** Updated metadata after preprocessing */
  metadata: FileMetadata;
  /** Processing duration in ms */
  processing_time_ms: number;
}

export class PreprocessingService {
  private options: PreprocessingOptions;

  constructor(options?: Partial<PreprocessingOptions>) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Preprocess a file for transcription
   *
   * In Stage 1, this performs basic validation and creates an AudioRef
   * from the file. Future stages will add actual audio processing.
   */
  async process(
    file: File,
    metadata: FileMetadata,
    onProgress?: (progress: number) => void
  ): Promise<PreprocessingResult> {
    const startTime = performance.now();

    onProgress?.(10);

    // Read file as ArrayBuffer
    const buffer = await file.arrayBuffer();
    onProgress?.(40);

    // Create audio blob
    // In future: apply normalization, resampling, noise reduction here
    const audioBlob = new Blob([buffer], { type: metadata.mime_type });
    onProgress?.(70);

    // Attempt to get accurate duration via Web Audio API
    let duration = metadata.duration_seconds;
    try {
      duration = await this.getAudioDuration(audioBlob);
    } catch {
      // Fall back to estimated duration from metadata
    }
    onProgress?.(90);

    const audioRef: AudioRef = {
      type: 'blob',
      data: audioBlob,
      mime_type: metadata.mime_type,
      duration_seconds: duration,
    };

    const updatedMetadata: FileMetadata = {
      ...metadata,
      duration_seconds: duration,
      sample_rate: this.options.target_sample_rate,
      channels: this.options.mono ? 1 : metadata.channels,
    };

    onProgress?.(100);

    return {
      audioRef,
      metadata: updatedMetadata,
      processing_time_ms: performance.now() - startTime,
    };
  }

  /**
   * Get audio duration using Web Audio API
   * Falls back on error (e.g., unsupported format in AudioContext)
   */
  private async getAudioDuration(blob: Blob): Promise<number> {
    const audioContext = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      return audioBuffer.duration;
    } finally {
      await audioContext.close();
    }
  }

  /**
   * Update preprocessing options
   */
  setOptions(options: Partial<PreprocessingOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get current preprocessing options
   */
  getOptions(): PreprocessingOptions {
    return { ...this.options };
  }
}
