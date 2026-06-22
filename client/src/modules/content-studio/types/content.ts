/**
 * Content Studio Types
 *
 * Core type definitions for the extractive intelligence pipeline,
 * content generation templates, and quality metrics.
 *
 * Architecture decision: Extractive-only (Stage 1) means all intelligence
 * is derived from the transcript text itself using TF-IDF and TextRank
 * algorithms. No external AI APIs are called.
 */

import type { StandardTranscript, TranscriptSegment } from '@/modules/speech-engine/types';

// ─── Content Type Identifiers ────────────────────────────────────────────────

/** Supported content generation types */
export type ContentType =
  | 'blog'
  | 'summary-short'
  | 'summary-detailed'
  | 'summary-executive'
  | 'faq'
  | 'notes-meeting'
  | 'notes-quick'
  | 'social-linkedin'
  | 'social-twitter';

// ─── Intelligence Types ──────────────────────────────────────────────────────

/**
 * A scored sentence from TextRank
 */
export interface ScoredSentence {
  /** Original sentence text */
  text: string;
  /** TextRank score (0-1 normalized) */
  score: number;
  /** Index in the original segment array */
  segmentIndex: number;
  /** The segment ID this sentence belongs to */
  segmentId: string;
}

/**
 * A keyword or keyphrase with its TF-IDF score
 */
export interface ScoredKeyword {
  /** The keyword or bigram */
  term: string;
  /** TF-IDF score */
  score: number;
  /** Number of occurrences */
  frequency: number;
}

/**
 * A detected topic boundary with associated metadata
 */
export interface DetectedTopic {
  /** Topic label derived from top keywords */
  label: string;
  /** Start segment index (inclusive) */
  startIndex: number;
  /** End segment index (exclusive) */
  endIndex: number;
  /** Top keywords for this topic */
  keywords: ScoredKeyword[];
  /** Top sentences within this topic */
  topSentences: ScoredSentence[];
}

/**
 * TF-IDF vector for a document or segment
 */
export interface TfIdfVector {
  /** Term to TF-IDF score mapping */
  terms: Record<string, number>;
}

// ─── Content Intelligence Cache ──────────────────────────────────────────────

/**
 * ContentIntelligence is the canonical shared cache that other modules
 * (Meeting Intelligence, Creator Studio, Business Studio) consume.
 */
export interface ContentIntelligence {
  /** Detected topics with boundaries and keywords */
  topics: DetectedTopic[];
  /** Global keywords ranked by TF-IDF */
  keywords: ScoredKeyword[];
  /** Sentences ranked by TextRank */
  rankedSentences: ScoredSentence[];
  /** Transcript ID this intelligence was computed from */
  transcriptId: string;
  /** Timestamp when intelligence was computed */
  computedAt: number;
  /** Parameters used for computation (for cache invalidation) */
  params: IntelligenceParams;
}

/**
 * Parameters that affect intelligence computation
 */
export interface IntelligenceParams {
  /** TextRank damping factor */
  damping: number;
  /** Topic boundary similarity threshold */
  topicThreshold: number;
  /** Max TextRank iterations */
  maxIterations: number;
}

// ─── Content Results ─────────────────────────────────────────────────────────

/**
 * A section within generated content
 */
export interface ContentSection {
  /** Section heading */
  heading?: string;
  /** Section body (paragraph or list of items) */
  body: string;
  /** Source segment indices used */
  sourceIndices: number[];
}

/**
 * FAQ item generated from question detection
 */
export interface FaqItem {
  /** The question */
  question: string;
  /** The answer (next 1-3 sentences) */
  answer: string;
  /** Source segment indices */
  sourceIndices: number[];
}

/**
 * Result of content generation
 */
export interface ContentResult {
  /** Content type that was generated */
  type: ContentType;
  /** Title of the generated content */
  title: string;
  /** Main body sections */
  sections: ContentSection[];
  /** FAQ items (only for 'faq' type) */
  faqItems?: FaqItem[];
  /** Social posts (only for social types) */
  socialPosts?: string[];
  /** Hashtags (only for social types) */
  hashtags?: string[];
  /** Full rendered text output */
  rendered: string;
  /** Segment indices that were used in output */
  usedSegmentIndices: number[];
  /** Generation timestamp */
  generatedAt: number;
}

// ─── Quality Metrics ─────────────────────────────────────────────────────────

/**
 * Quality assessment of generated content
 */
export interface QualityMetrics {
  /** How well sentences flow together (0-1) */
  coherence: number;
  /** What percentage of transcript topics are covered (0-1) */
  coverage: number;
  /** Readability score based on sentence length variance (0-1) */
  readability: number;
  /** Overall quality score (average of above) */
  overall: number;
}

// ─── Template Interface ──────────────────────────────────────────────────────

/**
 * Content template - a pure function that transforms intelligence + transcript into content
 */
export interface ContentTemplate {
  /** Template identifier */
  type: ContentType;
  /** Human-readable label */
  label: string;
  /** Brief description */
  description: string;
  /** Generate content from intelligence and transcript */
  generate: (intelligence: ContentIntelligence, transcript: StandardTranscript) => ContentResult;
}

// ─── Store State ─────────────────────────────────────────────────────────────

/**
 * Content Studio store state
 */
export interface ContentStudioState {
  /** Active transcript */
  transcript: StandardTranscript | null;
  /** Selected content type */
  selectedType: ContentType;
  /** Generated content result */
  generatedContent: ContentResult | null;
  /** Computed intelligence cache */
  intelligence: ContentIntelligence | null;
  /** Whether generation is in progress */
  isGenerating: boolean;
  /** Quality metrics for generated content */
  quality: QualityMetrics | null;
  /** Error message if generation fails */
  error: string | null;
  /** Intelligence computation parameters */
  params: IntelligenceParams;

  // Actions
  setTranscript: (transcript: StandardTranscript | null) => void;
  setSelectedType: (type: ContentType) => void;
  setGeneratedContent: (content: ContentResult | null) => void;
  setIntelligence: (intelligence: ContentIntelligence | null) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setQuality: (quality: QualityMetrics | null) => void;
  setError: (error: string | null) => void;
  setParams: (params: Partial<IntelligenceParams>) => void;
  reset: () => void;
}
