/**
 * Speaker Analytics Service
 *
 * Computes per-speaker statistics from the transcript including
 * speaking time, segment count, participation percentage, and
 * questions asked.
 *
 * Architecture decision: Computed from the StandardTranscript speaker
 * metadata combined with segment-level analysis. Question detection
 * uses simple heuristics (question marks, interrogative patterns).
 */

import type { StandardTranscript, SpeakerId } from '@/modules/speech-engine/types';
import type { SpeakerStats } from '../types';

/** Question patterns */
const QUESTION_PATTERNS: RegExp[] = [
  /\?$/,
  /\bwhat\s/i,
  /\bhow\s/i,
  /\bwhy\s/i,
  /\bwhen\s/i,
  /\bwhere\s/i,
  /\bwho\s/i,
  /\bwhich\s/i,
  /\bdo\s+(?:you|we|they)\b/i,
  /\bis\s+(?:it|this|that|there)\b/i,
  /\bcan\s+(?:you|we)\b/i,
  /\bkya\b/i,
  /\bkaise\b/i,
  /\bkyun\b/i,
  /\bkab\b/i,
  /\bkahan\b/i,
];

/**
 * Determine if a segment is likely a question
 */
function isQuestion(text: string): boolean {
  for (const pattern of QUESTION_PATTERNS) {
    if (pattern.test(text)) return true;
  }
  return false;
}

/**
 * Compute speaker analytics from a transcript.
 *
 * @param transcript - The standard transcript
 * @returns Array of speaker statistics
 */
export function computeSpeakerStats(transcript: StandardTranscript): SpeakerStats[] {
  const speakers = transcript.speakers.entries;
  if (speakers.length === 0) return [];

  const segments = transcript.segments;
  const totalDuration = transcript.source.duration_seconds || 0;

  // Accumulate stats per speaker
  const statsMap = new Map<SpeakerId, {
    speakingTime: number;
    segmentCount: number;
    questionsAsked: number;
  }>();

  // Initialize all speakers
  for (const speaker of speakers) {
    statsMap.set(speaker.id, { speakingTime: 0, segmentCount: 0, questionsAsked: 0 });
  }

  // Process segments
  for (const segment of segments) {
    if (!segment.speaker_id) continue;
    const stats = statsMap.get(segment.speaker_id);
    if (!stats) continue;

    stats.segmentCount++;
    stats.speakingTime += segment.end - segment.start;

    const text = segment.text_display || segment.text;
    if (isQuestion(text)) {
      stats.questionsAsked++;
    }
  }

  // Also use speaking_time from transcript metadata if available
  const metaSpeakingTime = transcript.speakers.speaking_time || {};

  // Build results
  const totalSegments = segments.length;
  const results: SpeakerStats[] = [];

  for (const speaker of speakers) {
    const stats = statsMap.get(speaker.id);
    if (!stats) continue;

    // Prefer metadata speaking_time if available, else computed
    const speakingTime = metaSpeakingTime[speaker.id] ?? stats.speakingTime;
    const participationPercent = totalDuration > 0
      ? Math.round((speakingTime / totalDuration) * 100)
      : totalSegments > 0
        ? Math.round((stats.segmentCount / totalSegments) * 100)
        : 0;

    results.push({
      speakerId: speaker.id,
      displayName: speaker.display_name || speaker.label,
      speakingTime: Math.round(speakingTime * 10) / 10,
      segmentCount: stats.segmentCount,
      participationPercent: Math.min(100, participationPercent),
      questionsAsked: stats.questionsAsked,
    });
  }

  // Sort by participation descending
  return results.sort((a, b) => b.participationPercent - a.participationPercent);
}
