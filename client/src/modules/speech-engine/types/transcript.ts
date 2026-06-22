/**
 * StandardTranscript Schema v1.1.0
 *
 * Universal transcript schema consumed by all downstream modules.
 * Implements stable UUIDs, dual text fields, speaker identity layer,
 * per-word timestamps, and quality metadata.
 *
 * Architecture decision: A single canonical schema prevents each module
 * from defining its own transcript format. All engines normalize output
 * to this structure via their adapters.
 */

/** Unique segment identifier with `seg_` prefix */
export type SegmentId = `seg_${string}`;

/** Unique speaker identifier with `spk_` prefix */
export type SpeakerId = `spk_${string}`;

/** ISO 639-1 language code */
export type LanguageCode = string;

/**
 * Per-word timing and metadata within a segment
 */
export interface TranscriptWord {
  /** The word text */
  word: string;
  /** Start time in seconds */
  start: number;
  /** End time in seconds */
  end: number;
  /** Word-level confidence (0-1) */
  confidence: number;
  /** Language tag for multilingual content */
  language?: LanguageCode;
}

/**
 * Speaker entry in the speakers registry
 */
export interface SpeakerEntry {
  /** Stable speaker ID */
  id: SpeakerId;
  /** Machine label (e.g., "Speaker 1") */
  label: string;
  /** User-assigned display name (editable) */
  display_name?: string;
}

/**
 * A single transcript segment with timestamps and speaker attribution
 */
export interface TranscriptSegment {
  /** Stable UUID for the segment */
  id: SegmentId;
  /** Order index for sorting */
  sequence_index: number;
  /** Start time in seconds */
  start: number;
  /** End time in seconds */
  end: number;
  /** Immutable engine output text */
  text: string;
  /** User-facing text (supports transliteration/editing) */
  text_display: string;
  /** Speaker attribution */
  speaker_id?: SpeakerId;
  /** Segment-level confidence (0-1) */
  confidence: number;
  /** Per-word breakdown with timing */
  words?: TranscriptWord[];
  /** Language detected for this segment */
  language?: LanguageCode;
}

/**
 * Quality assessment metadata
 */
export interface QualityMeta {
  /** Overall quality score (0-1) */
  quality_score: number;
  /** Human-readable quality label */
  quality_label: 'excellent' | 'good' | 'fair' | 'poor';
  /** Signal-to-noise ratio in dB (if measured) */
  snr_db?: number;
}

/**
 * Processing flags indicating what operations were performed
 */
export interface ProcessingFlags {
  /** Whether speaker diarization was applied */
  diarization: boolean;
  /** Whether noise reduction was applied */
  noise_reduction: boolean;
  /** Whether punctuation was restored */
  punctuation_restored: boolean;
  /** Whether this is a partial/streaming result */
  is_partial: boolean;
  /** Whether the source was a live stream */
  live_origin: boolean;
}

/**
 * Transcription metadata
 */
export interface TranscriptionMeta {
  /** Engine that produced this transcript */
  engine: string;
  /** Engine version */
  engine_version: string;
  /** Model identifier used */
  model: string;
  /** Primary detected language */
  language: LanguageCode;
  /** Total audio duration in seconds */
  duration_seconds: number;
  /** Processing time in milliseconds */
  processing_time_ms: number;
  /** Quality assessment */
  quality: QualityMeta;
  /** Processing flags */
  processing_flags: ProcessingFlags;
  /** Timestamp of transcription completion */
  created_at: string;
}

/**
 * StandardTranscript v1.1.0
 *
 * The canonical transcript structure shared across all platform modules.
 */
export interface StandardTranscript {
  /** Schema version */
  schema_version: '1.1.0';
  /** Unique transcript identifier */
  id: string;
  /** Source file information */
  source: {
    /** Original filename */
    filename: string;
    /** MIME type */
    mime_type: string;
    /** File size in bytes */
    size_bytes: number;
    /** Audio duration in seconds */
    duration_seconds: number;
  };
  /** Speakers registry */
  speakers: {
    /** Number of detected speakers */
    count: number;
    /** Speaker entries */
    entries: SpeakerEntry[];
  };
  /** Ordered transcript segments */
  segments: TranscriptSegment[];
  /** Full concatenated text */
  full_text: string;
  /** Transcription metadata */
  transcription_meta: TranscriptionMeta;
}
