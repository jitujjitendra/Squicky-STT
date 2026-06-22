/**
 * ContentIntelligenceCache
 *
 * Shared intelligence cache with a canonical interface consumed by
 * other modules (Meeting Intelligence, Creator Studio, Business Studio).
 *
 * Provides: getTopics, getKeywords, getSummary, isPopulated, isStale,
 * populate, invalidate.
 *
 * Architecture decision: A module-level singleton cache that persists
 * in sessionStorage. Other modules import and read from it without
 * needing to recompute intelligence. Cache invalidation is based on
 * transcript ID mismatch or age threshold (5 minutes).
 */

import type {
  ContentIntelligence,
  IntelligenceParams,
  DetectedTopic,
  ScoredKeyword,
  ScoredSentence,
} from '../types';
import type { StandardTranscript } from '@/modules/speech-engine/types';
import { rankSentences } from './TextRankService';
import { extractKeywordsWithBigrams } from './TfIdfService';
import { detectTopics } from './TopicDetectionService';

const CACHE_KEY = 'squicky:content_intelligence';

/** Cache staleness threshold (5 minutes) */
const STALE_THRESHOLD_MS = 5 * 60 * 1000;

/** Default intelligence parameters */
export const DEFAULT_PARAMS: IntelligenceParams = {
  damping: 0.85,
  topicThreshold: 0.25,
  maxIterations: 30,
};

/**
 * ContentIntelligenceCache - Canonical shared cache
 *
 * Other modules consume this cache for topics, keywords, and summary data
 * without recomputing intelligence.
 */
export const ContentIntelligenceCache = {
  /**
   * Get detected topics from cache
   */
  getTopics(): DetectedTopic[] | null {
    const cache = loadCache();
    return cache?.topics ?? null;
  },

  /**
   * Get ranked keywords from cache
   */
  getKeywords(): ScoredKeyword[] | null {
    const cache = loadCache();
    return cache?.keywords ?? null;
  },

  /**
   * Get summary (top ranked sentences) from cache
   */
  getSummary(topN: number = 5): ScoredSentence[] | null {
    const cache = loadCache();
    if (!cache) return null;
    return cache.rankedSentences.slice(0, topN);
  },

  /**
   * Check if cache is populated for a given transcript
   */
  isPopulated(transcriptId?: string): boolean {
    const cache = loadCache();
    if (!cache) return false;
    if (transcriptId && cache.transcriptId !== transcriptId) return false;
    return true;
  },

  /**
   * Check if cache is stale (older than threshold)
   */
  isStale(): boolean {
    const cache = loadCache();
    if (!cache) return true;
    return Date.now() - cache.computedAt > STALE_THRESHOLD_MS;
  },

  /**
   * Populate the cache by computing intelligence from a transcript
   */
  populate(
    transcript: StandardTranscript,
    params: IntelligenceParams = DEFAULT_PARAMS
  ): ContentIntelligence {
    const segments = transcript.segments;

    // Run TextRank
    const rankedSentences = rankSentences(segments, params.damping, params.maxIterations);

    // Extract keywords with bigrams
    const texts = segments.map((s) => s.text_display || s.text);
    const keywords = extractKeywordsWithBigrams(texts, 20);

    // Detect topics
    const topics = detectTopics(segments, 3, params.topicThreshold, params.damping);

    const intelligence: ContentIntelligence = {
      topics,
      keywords,
      rankedSentences,
      transcriptId: transcript.id,
      computedAt: Date.now(),
      params,
    };

    // Persist to sessionStorage
    saveCache(intelligence);

    return intelligence;
  },

  /**
   * Invalidate the cache
   */
  invalidate(): void {
    try {
      sessionStorage.removeItem(CACHE_KEY);
    } catch {
      // sessionStorage may not be available
    }
  },

  /**
   * Get the full intelligence object from cache
   */
  get(): ContentIntelligence | null {
    return loadCache();
  },
};

/**
 * Load cache from sessionStorage
 */
function loadCache(): ContentIntelligence | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ContentIntelligence;
  } catch {
    return null;
  }
}

/**
 * Save cache to sessionStorage
 */
function saveCache(intelligence: ContentIntelligence): void {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(intelligence));
  } catch {
    // sessionStorage may be full or unavailable
    console.warn('[ContentIntelligenceCache] Failed to persist to sessionStorage');
  }
}
