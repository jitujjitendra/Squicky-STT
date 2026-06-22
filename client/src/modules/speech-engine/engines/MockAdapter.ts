/**
 * Mock Transcription Engine Adapter
 *
 * Provides a fully functional mock implementation for development
 * and testing. Simulates realistic processing delays and generates
 * structured transcript output matching the StandardTranscript schema.
 *
 * Architecture decision: The mock adapter allows full UI development
 * and integration testing without requiring actual WASM model loading.
 * It implements the exact same interface as real engines.
 */

import type {
  TranscriptionEngine,
  EngineCapabilities,
  TranscriptionOptions,
  AudioRef,
  StandardTranscript,
  PartialTranscript,
  SegmentId,
  SpeakerId,
} from '../types';

/** Simulated processing time per second of audio */
const PROCESSING_RATIO = 0.1; // 10x faster than real-time

/** Generate a segment ID */
function segId(index: number): SegmentId {
  return `seg_${crypto.randomUUID().slice(0, 8)}_${index}` as SegmentId;
}

/** Generate a speaker ID */
function spkId(index: number): SpeakerId {
  return `spk_${String(index).padStart(3, '0')}` as SpeakerId;
}

/**
 * Mock transcript content for demonstration
 */
const MOCK_SEGMENTS = [
  { text: 'Welcome to the Squicky Speech Intelligence Platform.', speaker: 0 },
  { text: 'This is a demonstration of the transcription engine.', speaker: 0 },
  { text: 'The platform processes audio entirely on your device.', speaker: 1 },
  { text: 'No data is ever sent to external servers.', speaker: 1 },
  { text: 'You can upload audio or video files for transcription.', speaker: 0 },
  { text: 'Supported formats include MP3, WAV, FLAC, and many more.', speaker: 0 },
  { text: 'The engine supports multiple languages and speakers.', speaker: 1 },
  { text: 'Results are available in the standard transcript format.', speaker: 1 },
];

export class MockAdapter implements TranscriptionEngine {
  private ready = false;

  name(): string {
    return 'Mock Engine';
  }

  version(): string {
    return '1.0.0-mock';
  }

  capabilities(): EngineCapabilities {
    return {
      streaming: true,
      diarization: true,
      word_timestamps: true,
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'ja', 'zh', 'ko'],
      max_duration_sec: 3600,
      compute_requirement: 'wasm',
    };
  }

  isReady(): boolean {
    return this.ready;
  }

  async initialize(): Promise<void> {
    // Simulate model loading delay
    await this.delay(500);
    this.ready = true;
  }

  async transcribe(
    audioRef: AudioRef,
    options: TranscriptionOptions
  ): Promise<StandardTranscript> {
    if (!this.ready) {
      await this.initialize();
    }

    const duration = audioRef.duration_seconds;
    const processingTime = duration * PROCESSING_RATIO * 1000;
    const totalSteps = 20;
    const stepDelay = processingTime / totalSteps;

    // Simulate progress
    for (let i = 0; i < totalSteps; i++) {
      await this.delay(stepDelay);
      options.on_progress?.((i + 1) / totalSteps);
    }

    // Generate mock transcript
    return this.generateTranscript(audioRef, duration, options);
  }

  async *stream(
    _audioChunks: AsyncIterable<ArrayBuffer>,
    options: TranscriptionOptions
  ): AsyncGenerator<PartialTranscript> {
    let currentTime = 0;
    const segmentDuration = 3;

    for (const seg of MOCK_SEGMENTS) {
      await this.delay(200);
      const start = currentTime;
      const end = currentTime + segmentDuration;
      currentTime = end;

      options.on_progress?.(currentTime / (MOCK_SEGMENTS.length * segmentDuration));

      yield {
        is_final: false,
        text: seg.text,
        start,
        end,
        confidence: 0.85 + Math.random() * 0.14,
      };
    }

    // Final marker
    yield {
      is_final: true,
      text: '',
      start: currentTime,
      end: currentTime,
      confidence: 1,
    };
  }

  async dispose(): Promise<void> {
    this.ready = false;
  }

  private generateTranscript(
    audioRef: AudioRef,
    duration: number,
    options: TranscriptionOptions
  ): StandardTranscript {
    const segmentDuration = duration / MOCK_SEGMENTS.length;
    const speakers = [
      { id: spkId(1), label: 'Speaker 1', display_name: undefined },
      { id: spkId(2), label: 'Speaker 2', display_name: undefined },
    ];

    const segments = MOCK_SEGMENTS.map((seg, idx) => {
      const start = idx * segmentDuration;
      const end = start + segmentDuration;
      const confidence = 0.85 + Math.random() * 0.14;
      const words = options.word_timestamps
        ? this.generateWords(seg.text, start, end)
        : undefined;

      return {
        id: segId(idx),
        sequence_index: idx,
        start,
        end,
        text: seg.text,
        text_display: seg.text,
        speaker_id: options.diarization ? speakers[seg.speaker]!.id : undefined,
        confidence,
        words,
        language: options.language ?? 'en',
      };
    });

    const fullText = segments.map((s) => s.text).join(' ');

    return {
      schema_version: '1.1.0',
      id: `transcript_${crypto.randomUUID().slice(0, 12)}`,
      source: {
        filename: 'mock-audio',
        mime_type: audioRef.mime_type,
        size_bytes: audioRef.data instanceof Blob ? audioRef.data.size : 0,
        duration_seconds: duration,
      },
      speakers: {
        count: options.diarization ? 2 : 0,
        entries: options.diarization ? speakers : [],
        speaking_time: options.diarization
          ? { [speakers[0]!.id]: duration * 0.6, [speakers[1]!.id]: duration * 0.4 }
          : {},
      },
      segments,
      full_text: fullText,
      transcription_meta: {
        engine: this.name(),
        engine_version: this.version(),
        model: options.model_size ?? 'base',
        language: options.language ?? 'en',
        duration_seconds: duration,
        processing_time_ms: duration * PROCESSING_RATIO * 1000,
        quality: {
          quality_score: 0.92,
          quality_label: 'excellent',
        },
        processing_flags: {
          diarization: options.diarization ?? false,
          noise_reduction: false,
          punctuation_restored: true,
          is_partial: false,
          live_origin: false,
          hinglish_detected: false,
          transliteration_applied: null,
          topic_boundaries_detected: false,
          merge_artifacts: false,
        },
        created_at: new Date().toISOString(),
      },
    };
  }

  private generateWords(
    text: string,
    start: number,
    end: number
  ): Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
  }> {
    const wordList = text.split(' ');
    const wordDuration = (end - start) / wordList.length;
    return wordList.map((word, idx) => ({
      word,
      start: start + idx * wordDuration,
      end: start + (idx + 1) * wordDuration,
      confidence: 0.8 + Math.random() * 0.19,
    }));
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
