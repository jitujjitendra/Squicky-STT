/**
 * Whisper Engine Adapter (Placeholder)
 *
 * Adapter for OpenAI Whisper running via WASM in the browser.
 * This is a structural placeholder that implements the TranscriptionEngine
 * interface. The actual WASM integration will be added in a future stage.
 *
 * Architecture decision: The adapter is registered at startup so the UI
 * can show it as an available (but not yet ready) engine option.
 * When WASM support is added, only this file changes - no other code
 * needs modification.
 */

import type {
  TranscriptionEngine,
  EngineCapabilities,
  TranscriptionOptions,
  AudioRef,
  StandardTranscript,
} from '../types';

export class WhisperAdapter implements TranscriptionEngine {
  private ready = false;

  name(): string {
    return 'Whisper';
  }

  version(): string {
    return '0.0.1-placeholder';
  }

  capabilities(): EngineCapabilities {
    return {
      streaming: false,
      diarization: false,
      word_timestamps: true,
      languages: [
        'en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'ja', 'zh', 'ko',
        'ar', 'hi', 'ru', 'pl', 'tr', 'vi', 'th', 'uk', 'cs', 'sv',
      ],
      max_duration_sec: 1800,
      compute_requirement: 'high',
    };
  }

  isReady(): boolean {
    return this.ready;
  }

  async initialize(): Promise<void> {
    // Placeholder: In future, this will load the Whisper WASM module
    // and download/cache the model weights via IndexedDB
    throw new Error(
      'Whisper WASM engine is not yet available. ' +
      'Use the Mock Engine for development and testing.'
    );
  }

  async transcribe(
    _audioRef: AudioRef,
    _options: TranscriptionOptions
  ): Promise<StandardTranscript> {
    throw new Error(
      'Whisper engine not initialized. Call initialize() first.'
    );
  }

  async dispose(): Promise<void> {
    this.ready = false;
  }
}
