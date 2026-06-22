/**
 * Meeting Summary Service
 *
 * Generates meeting summaries using extractive TextRank. Integrates with
 * ContentIntelligenceCache: if the cache is populated and not stale, reuses
 * existing ranked sentences. Otherwise, triggers its own extraction and
 * populates the cache for downstream modules.
 *
 * Architecture decision: Reuse ContentIntelligenceCache to avoid redundant
 * computation. TextRank extractive summarization provides a no-AI summary
 * by selecting the highest-ranked sentences from the transcript.
 */

import type { StandardTranscript } from '@/modules/speech-engine/types';
import type { MeetingSummary, MeetingType } from '../types';
import { ContentIntelligenceCache } from '@/modules/content-studio/services/ContentIntelligenceCache';

/** Default number of summary sentences */
const DEFAULT_SUMMARY_SENTENCES = 5;

/**
 * Generate a meeting summary.
 *
 * Checks ContentIntelligenceCache first. If populated and fresh, uses
 * cached data. Otherwise populates the cache and uses the result.
 *
 * @param transcript - The standard transcript
 * @param meetingType - Detected meeting type
 * @param topN - Number of top sentences (default 5)
 * @returns Meeting summary
 */
export function generateMeetingSummary(
  transcript: StandardTranscript,
  meetingType: MeetingType,
  topN: number = DEFAULT_SUMMARY_SENTENCES
): MeetingSummary {
  let sentences: string[] = [];

  // Check cache first
  if (ContentIntelligenceCache.isPopulated(transcript.id) && !ContentIntelligenceCache.isStale()) {
    const cached = ContentIntelligenceCache.getSummary(topN);
    if (cached && cached.length > 0) {
      sentences = cached.map((s) => s.text);
    }
  }

  // If cache miss, populate and use
  if (sentences.length === 0) {
    const intelligence = ContentIntelligenceCache.populate(transcript);
    const ranked = intelligence.rankedSentences.slice(0, topN);
    // Sort by original position for readability
    const sorted = ranked.sort((a, b) => a.segmentIndex - b.segmentIndex);
    sentences = sorted.map((s) => s.text);
  }

  return {
    sentences,
    durationSeconds: transcript.source.duration_seconds,
    participantCount: transcript.speakers.count,
    meetingType,
  };
}
