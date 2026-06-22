/**
 * Topic Detection Service
 *
 * Detects topic boundaries in transcripts using sliding window
 * cosine similarity. When similarity between adjacent windows
 * drops below a threshold, a topic boundary is marked.
 *
 * Architecture decision: Sliding window approach is lightweight,
 * requires no training data, and works well for detecting major
 * topic shifts in conversational content.
 */

import type { DetectedTopic, ScoredKeyword, ScoredSentence } from '../types';
import type { TranscriptSegment } from '@/modules/speech-engine/types';
import {
  tokenize,
  computeTfIdfVector,
  cosineSimilarity,
  extractKeywords,
} from './TfIdfService';
import { rankSentences } from './TextRankService';

/** Default sliding window size (number of sentences) */
const DEFAULT_WINDOW_SIZE = 3;

/** Default similarity threshold for boundary detection */
const DEFAULT_THRESHOLD = 0.25;

/**
 * Compute a merged TF-IDF vector for a window of segments.
 */
function windowVector(segments: TranscriptSegment[], start: number, size: number) {
  const windowSegments = segments.slice(start, start + size);
  const tokens = windowSegments.flatMap((s) => tokenize(s.text_display || s.text));
  return { vector: computeTfIdfVector(tokens), tokens };
}

/**
 * Detect topic boundaries using sliding window cosine similarity.
 *
 * @param segments - Ordered transcript segments
 * @param windowSize - Number of sentences per window (default 3)
 * @param threshold - Similarity threshold below which a boundary is marked (default 0.25)
 * @param damping - TextRank damping for top sentence extraction
 * @returns Array of detected topics with boundaries, keywords, and top sentences
 */
export function detectTopics(
  segments: TranscriptSegment[],
  windowSize: number = DEFAULT_WINDOW_SIZE,
  threshold: number = DEFAULT_THRESHOLD,
  damping: number = 0.85
): DetectedTopic[] {
  if (segments.length === 0) return [];

  // For very short transcripts, return single topic
  if (segments.length <= windowSize * 2) {
    const allTokens = segments.flatMap((s) => tokenize(s.text_display || s.text));
    const vector = computeTfIdfVector(allTokens);
    const keywords = extractKeywords(vector, 5, allTokens);
    const topSentences = rankSentences(segments, damping).slice(0, 3);

    return [{
      label: generateTopicLabel(keywords),
      startIndex: 0,
      endIndex: segments.length,
      keywords,
      topSentences,
    }];
  }

  // Find boundaries using sliding window comparison
  const boundaries: number[] = [0]; // Always start with index 0

  for (let i = 0; i <= segments.length - windowSize * 2; i++) {
    const leftWindow = windowVector(segments, i, windowSize);
    const rightWindow = windowVector(segments, i + windowSize, windowSize);

    const sim = cosineSimilarity(leftWindow.vector, rightWindow.vector);

    if (sim < threshold) {
      // Mark boundary at the start of the right window
      const boundaryIdx = i + windowSize;
      // Avoid boundaries too close together
      const lastBoundary = boundaries[boundaries.length - 1]!;
      if (boundaryIdx - lastBoundary >= windowSize) {
        boundaries.push(boundaryIdx);
      }
    }
  }

  // Build topics from boundaries
  const topics: DetectedTopic[] = [];

  for (let i = 0; i < boundaries.length; i++) {
    const startIndex = boundaries[i]!;
    const endIndex = i < boundaries.length - 1 ? boundaries[i + 1]! : segments.length;

    const topicSegments = segments.slice(startIndex, endIndex);
    const allTokens = topicSegments.flatMap((s) => tokenize(s.text_display || s.text));
    const vector = computeTfIdfVector(allTokens);
    const keywords = extractKeywords(vector, 5, allTokens);

    // Get top sentences for this topic
    const topSentences = rankSentences(topicSegments, damping)
      .slice(0, 3)
      .map((s) => ({
        ...s,
        segmentIndex: s.segmentIndex + startIndex,
      }));

    topics.push({
      label: generateTopicLabel(keywords),
      startIndex,
      endIndex,
      keywords,
      topSentences,
    });
  }

  return topics;
}

/**
 * Generate a human-readable topic label from top keywords.
 * Capitalizes first keyword and joins top 2-3 with commas.
 */
function generateTopicLabel(keywords: ScoredKeyword[]): string {
  if (keywords.length === 0) return 'General Discussion';

  const topTerms = keywords.slice(0, 3).map((k) => k.term);
  const label = topTerms.join(', ');

  // Capitalize first letter
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Get top sentences within a specific topic range.
 *
 * @param allRanked - All ranked sentences
 * @param startIndex - Topic start index
 * @param endIndex - Topic end index
 * @param topN - Number of top sentences to return
 */
export function getTopicSentences(
  allRanked: ScoredSentence[],
  startIndex: number,
  endIndex: number,
  topN: number
): ScoredSentence[] {
  return allRanked
    .filter((s) => s.segmentIndex >= startIndex && s.segmentIndex < endIndex)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .sort((a, b) => a.segmentIndex - b.segmentIndex);
}
