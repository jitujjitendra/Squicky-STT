/**
 * Faster Whisper Engine Adapter (Placeholder)
 *
 * Adapter for CTranslate2-based Faster Whisper implementation.
 * Offers faster inference than standard Whisper with similar accuracy.
 * This is a structural placeholder for future WASM/WebGPU integration.
 *
 * Architecture decision: Faster Whisper is registered as a separate engine
 * rather than a configuration of the Whisper adapter because it has a
 * fundamentally different runtime (CTranslate2 vs PyTorch) and different
 * capability characteristics (streaming support, lower memory usage).
 */

import type {
  TranscriptionEngine,
  EngineCapabilities,
  TranscriptionOptions,
  AudioRef,
  StandardTranscript,
  PartialTranscript,
} from '../types';

export class FasterWhisperAdapter implements TranscriptionEngine {
  private ready = false;

  name(): string {
    return 'Faster Whisper';
  }

  version(): string {
    return '0.0.1-placeholder';
  }

  capabilities(): EngineCapabilities {
    return {
      streaming: true,
      diarization: true,
      word_timestamps: true,
      languages: [
        'en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'ja', 'zh', 'ko',
        'ar', 'hi', 'ru', 'pl', 'tr', 'vi', 'th', 'uk', 'cs', 'sv',
      ],
      max_duration_sec: 3600,
      compute_requirement: 'medium',
    };
  }

  isReady(): boolean {
    return this.ready;
  }

  async initialize(): Promise<void> {
    // Placeholder: In future, this will load the CTranslate2 WASM module
    // or connect to a WebGPU-accelerated runtime
    throw new Error(
      'Faster Whisper engine is not yet available. ' +
      'Use the Mock Engine for development and testing.'
    );
  }

  async transcribe(
    _audioRef: AudioRef,
    _options: TranscriptionOptions
  ): Promise<StandardTranscript> {
    throw new Error(
      'Faster Whisper engine not initialized. Call initialize() first.'
    );
  }

  async *stream(
    _audioChunks: AsyncIterable<ArrayBuffer>,
    _options: TranscriptionOptions
  ): AsyncGenerator<PartialTranscript> {
    throw new Error(
      'Faster Whisper engine not initialized. Call initialize() first.'
    );
  }

  async dispose(): Promise<void> {
    this.ready = false;
  }
}
