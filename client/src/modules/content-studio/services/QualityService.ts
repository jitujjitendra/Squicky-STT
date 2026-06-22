/**
 * Quality Service
 *
 * Computes quality metrics for generated content:
 * - Coherence: sentence flow measured by adjacent similarity
 * - Coverage: percentage of transcript topics represented
 * - Readability: based on sentence length variance
 */

import type { QualityMetrics, ContentResult, ContentIntelligence } from '../types';

/**
 * Compute quality metrics for generated content.
 *
 * @param result - The generated content result
 * @param intelligence - The intelligence cache
 * @param totalSegments - Total number of segments in transcript
 * @returns Quality metrics object
 */
export function computeQuality(
  result: ContentResult,
  intelligence: ContentIntelligence,
  _totalSegments: number
): QualityMetrics {
  const coherence = computeCoherence(result);
  const coverage = computeCoverage(result, intelligence);
  const readability = computeReadability(result);
  const overall = (coherence + coverage + readability) / 3;

  return { coherence, coverage, readability, overall };
}

/**
 * Coherence: measures how well sentences flow together.
 * Uses the ratio of used segments that are near each other.
 */
function computeCoherence(result: ContentResult): number {
  const indices = result.usedSegmentIndices.sort((a, b) => a - b);
  if (indices.length <= 1) return 1;

  let adjacentPairs = 0;
  for (let i = 1; i < indices.length; i++) {
    if (indices[i]! - indices[i - 1]! <= 3) {
      adjacentPairs++;
    }
  }

  return Math.min(1, adjacentPairs / (indices.length - 1));
}

/**
 * Coverage: what percentage of topics are represented in the output.
 */
function computeCoverage(
  result: ContentResult,
  intelligence: ContentIntelligence
): number {
  if (intelligence.topics.length === 0) return 1;

  const usedSet = new Set(result.usedSegmentIndices);
  let coveredTopics = 0;

  for (const topic of intelligence.topics) {
    // A topic is covered if at least one of its segments is used
    let covered = false;
    for (let i = topic.startIndex; i < topic.endIndex; i++) {
      if (usedSet.has(i)) {
        covered = true;
        break;
      }
    }
    if (covered) coveredTopics++;
  }

  return coveredTopics / intelligence.topics.length;
}

/**
 * Readability: based on sentence length variance.
 * Lower variance = more consistent = higher readability.
 */
function computeReadability(result: ContentResult): number {
  const sentences = result.rendered
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (sentences.length <= 1) return 0.8;

  const lengths = sentences.map((s) => s.split(/\s+/).length);
  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance =
    lengths.reduce((sum, len) => sum + Math.pow(len - avg, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);

  // Normalize: stdDev of 0 = perfect, stdDev of 15+ = poor
  const score = Math.max(0, Math.min(1, 1 - stdDev / 15));
  return score;
}
