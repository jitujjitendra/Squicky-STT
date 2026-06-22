/**
 * Creator Studio Types
 *
 * Type definitions for the creator content repurposing module.
 * Three modes: YouTube, Podcast, Shorts/Reels. Each mode produces
 * platform-specific output cards from ContentIntelligenceCache data.
 *
 * Architecture decision: This is a THIN FORMATTING LAYER on top of
 * Content Studio intelligence. It does NOT re-run TextRank/TF-IDF.
 * It consumes ContentIntelligenceCache and adds platform-specific formatting.
 */

import type { StandardTranscript } from '@/modules/speech-engine/types';

// ─── Mode Identifiers ────────────────────────────────────────────────────────

/** Supported creator modes */
export type CreatorMode = 'youtube' | 'podcast' | 'shorts';

// ─── Output Card Types ───────────────────────────────────────────────────────

/**
 * A generic output card rendered in the UI
 */
export interface OutputCard {
  /** Unique card identifier */
  id: string;
  /** Card title (e.g., "Title Suggestions", "Description") */
  title: string;
  /** Generated content */
  content: string;
  /** Character count of the content */
  charCount: number;
  /** Maximum allowed characters (for display) */
  maxChars?: number;
  /** Whether the card content has been edited by the user */
  isEdited: boolean;
}

// ─── Chapter Detection ───────────────────────────────────────────────────────

/**
 * A chapter marker with timestamp and title
 */
export interface ChapterMarker {
  /** Timestamp in seconds */
  timestamp: number;
  /** Formatted timestamp string (e.g., "0:00", "2:15") */
  formattedTime: string;
  /** Chapter title derived from top keywords */
  title: string;
}

// ─── Highlight Detection (Shorts/Reels) ──────────────────────────────────────

/**
 * A highlight segment suitable for short-form content
 */
export interface HighlightSegment {
  /** Start time in seconds */
  start: number;
  /** End time in seconds */
  end: number;
  /** Duration in seconds */
  duration: number;
  /** The text content */
  text: string;
  /** Composite score: textrank x keyword x brevity */
  score: number;
}

// ─── Mode-Specific Outputs ───────────────────────────────────────────────────

/**
 * YouTube mode generated outputs
 */
export interface YouTubeOutputs {
  titleSuggestions: OutputCard;
  description: OutputCard;
  chapters: OutputCard;
  tags: OutputCard;
  hashtags: OutputCard;
  pinnedComment: OutputCard;
  shortsIdeas: OutputCard;
}

/**
 * Podcast mode generated outputs
 */
export interface PodcastOutputs {
  episodeTitle: OutputCard;
  showNotes: OutputCard;
  keyTakeaways: OutputCard;
  guestHighlights: OutputCard;
  chapterMarkers: OutputCard;
}

/**
 * Shorts/Reels mode generated outputs
 */
export interface ShortsOutputs {
  highlights: OutputCard;
  hookSuggestions: OutputCard;
  captionIdeas: OutputCard;
  bestTimestamps: OutputCard;
}

// ─── Store State ─────────────────────────────────────────────────────────────

/**
 * Creator Studio store state
 */
export interface CreatorStudioState {
  /** Active creator mode */
  mode: CreatorMode;
  /** Active transcript */
  transcript: StandardTranscript | null;
  /** YouTube mode outputs */
  youtubeOutputs: YouTubeOutputs | null;
  /** Podcast mode outputs */
  podcastOutputs: PodcastOutputs | null;
  /** Shorts/Reels mode outputs */
  shortsOutputs: ShortsOutputs | null;
  /** Whether generation is in progress */
  isGenerating: boolean;
  /** Error message */
  error: string | null;

  // Actions
  setMode: (mode: CreatorMode) => void;
  setTranscript: (transcript: StandardTranscript | null) => void;
  setYouTubeOutputs: (outputs: YouTubeOutputs | null) => void;
  setPodcastOutputs: (outputs: PodcastOutputs | null) => void;
  setShortsOutputs: (outputs: ShortsOutputs | null) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setError: (error: string | null) => void;
  updateCard: (mode: CreatorMode, cardId: string, content: string) => void;
  reset: () => void;
}
