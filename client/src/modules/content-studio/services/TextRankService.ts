/**
 * TextRank Service
 *
 * Graph-based sentence ranking algorithm. Builds a similarity graph
 * where nodes are sentences and edges are weighted by cosine similarity
 * between their TF-IDF vectors. Applies PageRank iteration to rank sentences.
 *
 * Architecture decision: TextRank provides extractive summarization without
 * any external AI. The PageRank-style iteration converges quickly (typically
 * 10-15 iterations) and produces stable sentence rankings.
 *
 * @see Mihalcea & Tarau (2004) "TextRank: Bringing Order into Texts"
 */

import type { ScoredSentence } from '../types';
import type { TranscriptSegment } from '@/modules/speech-engine/types';
import { tokenize, computeTfIdfVector, cosineSimilarity } from './TfIdfService';

/** Default damping factor (probability of following a link vs random jump) */
const DEFAULT_DAMPING = 0.85;

/** Default maximum iterations for PageRank convergence */
const DEFAULT_MAX_ITERATIONS = 30;

/** Convergence threshold - stop when max score change is below this */
const CONVERGENCE_THRESHOLD = 0.0001;

/**
 * Build a similarity matrix between sentences using cosine similarity
 * of their TF-IDF vectors.
 *
 * @param segments - Transcript segments (each treated as a sentence)
 * @returns Adjacency matrix (2D array of similarity scores)
 */
function buildSimilarityMatrix(segments: TranscriptSegment[]): number[][] {
  const n = segments.length;

  // Tokenize all segments
  const tokenized = segments.map((s) => tokenize(s.text_display || s.text));

  // Compute TF-IDF vectors
  const vectors = tokenized.map((tokens) => computeTfIdfVector(tokens));

  // Build similarity matrix
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const sim = cosineSimilarity(vectors[i]!, vectors[j]!);
      matrix[i]![j] = sim;
      matrix[j]![i] = sim;
    }
  }

  return matrix;
}

/**
 * Run PageRank iteration on the similarity matrix.
 *
 * @param matrix - Similarity (adjacency) matrix
 * @param damping - Damping factor (0.85 default)
 * @param maxIterations - Maximum number of iterations
 * @returns Array of scores (one per node/sentence)
 */
function pageRank(
  matrix: number[][],
  damping: number = DEFAULT_DAMPING,
  maxIterations: number = DEFAULT_MAX_ITERATIONS
): number[] {
  const n = matrix.length;
  if (n === 0) return [];

  // Initialize scores uniformly
  let scores: number[] = Array(n).fill(1 / n) as number[];

  // Precompute outgoing weight sums for normalization
  const outWeights = matrix.map((row) => row.reduce((sum, w) => sum + w, 0));

  for (let iter = 0; iter < maxIterations; iter++) {
    const newScores: number[] = Array(n).fill(0) as number[];
    let maxDiff = 0;

    for (let i = 0; i < n; i++) {
      let rank = (1 - damping) / n;

      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        if (outWeights[j]! > 0 && matrix[j]![i]! > 0) {
          rank += damping * (matrix[j]![i]! / outWeights[j]!) * scores[j]!;
        }
      }

      newScores[i] = rank;
      maxDiff = Math.max(maxDiff, Math.abs(rank - scores[i]!));
    }

    scores = newScores;

    // Check convergence
    if (maxDiff < CONVERGENCE_THRESHOLD) {
      break;
    }
  }

  return scores;
}

/**
 * Normalize scores to 0-1 range
 */
function normalizeScores(scores: number[]): number[] {
  const max = Math.max(...scores);
  const min = Math.min(...scores);
  const range = max - min;

  if (range === 0) return scores.map(() => 1 / scores.length);

  return scores.map((s) => (s - min) / range);
}

/**
 * Run TextRank on transcript segments and return scored sentences.
 *
 * @param segments - Transcript segments to rank
 * @param damping - Damping factor (default 0.85)
 * @param maxIterations - Maximum PageRank iterations (default 30)
 * @returns Scored sentences sorted by score descending
 */
export function rankSentences(
  segments: TranscriptSegment[],
  damping: number = DEFAULT_DAMPING,
  maxIterations: number = DEFAULT_MAX_ITERATIONS
): ScoredSentence[] {
  if (segments.length === 0) return [];

  // For very short transcripts, return all with equal scores
  if (segments.length <= 2) {
    return segments.map((seg, i) => ({
      text: seg.text_display || seg.text,
      score: 1,
      segmentIndex: i,
      segmentId: seg.id,
    }));
  }

  // Build similarity matrix
  const matrix = buildSimilarityMatrix(segments);

  // Run PageRank
  const rawScores = pageRank(matrix, damping, maxIterations);

  // Normalize to 0-1
  const normalized = normalizeScores(rawScores);

  // Build scored sentences
  const scored: ScoredSentence[] = segments.map((seg, i) => ({
    text: seg.text_display || seg.text,
    score: normalized[i],
    segmentIndex: i,
    segmentId: seg.id,
  }));

  // Sort by score descending
  return scored.sort((a, b) => b.score - a.score);
}

/**
 * Get the top N sentences by TextRank score.
 *
 * @param segments - Transcript segments
 * @param topN - Number of top sentences to return
 * @param damping - Damping factor
 * @param maxIterations - Max iterations
 * @returns Top N scored sentences, sorted by original position
 */
export function getTopSentences(
  segments: TranscriptSegment[],
  topN: number,
  damping: number = DEFAULT_DAMPING,
  maxIterations: number = DEFAULT_MAX_ITERATIONS
): ScoredSentence[] {
  const ranked = rankSentences(segments, damping, maxIterations);
  const top = ranked.slice(0, topN);
  // Sort by original position for readability
  return top.sort((a, b) => a.segmentIndex - b.segmentIndex);
}
