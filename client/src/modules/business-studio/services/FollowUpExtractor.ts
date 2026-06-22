/**
 * Follow-Up Extractor
 *
 * Detects follow-up items from transcript segments:
 * - "[Who] will [what] by [when]" structure
 * - Open questions that need answers
 * - Pending items mentioned
 *
 * Architecture decision: Pattern-based detection. Extracts who/what/when
 * components where possible. Open questions are detected by question patterns.
 */

import type { TranscriptSegment, SpeakerEntry, SpeakerId } from '@/modules/speech-engine/types';
import type { FollowUp } from '../types';

/** Follow-up action patterns */
const FOLLOW_UP_PATTERNS: RegExp[] = [
  /\bfollow\s+up\b/i,
  /\bget\s+back\s+(?:to|on)\b/i,
  /\bneed\s+to\s+(?:check|confirm|verify|send|share|update)\b/i,
  /\bwill\s+(?:send|share|check|update|confirm|schedule|arrange)\b/i,
  /\baction\s+(?:item|required)\b/i,
  /\bpending\b/i,
  /\bnext\s+steps?\b/i,
  /\bto\s*(?:-|\s)?do\b/i,
  /\breminder\b/i,
  /\bschedule\s+(?:a|the)\b/i,
];

/** Who-will-what-by-when pattern (captures components) */
const WHO_WILL_PATTERN = /\b(\w+)\s+will\s+(.+?)(?:\s+by\s+(.+?))?[.!]?$/i;

/** Open question patterns */
const QUESTION_PATTERNS: RegExp[] = [
  /\bwhat\s+(?:about|if|is|are|do|should)\b/i,
  /\bhow\s+(?:do|will|can|should)\b/i,
  /\bwhen\s+(?:will|can|do|should)\b/i,
  /\bwho\s+(?:will|is|should)\b/i,
  /\bcan\s+(?:we|you|someone)\b.*\?/i,
  /\bshould\s+we\b/i,
  /\bwhat\s+(?:happens|if)\b/i,
  /\?$/,
];

/** Hindi follow-up patterns */
const HINDI_FOLLOW_UP_PATTERNS: RegExp[] = [
  /\bbaad\s+mein\b/i,
  /\bkal\s+(?:tak|ko)\b/i,
  /\bfollow\s+up\s+kar(?:na|enge|o)\b/i,
  /\bbhejn?a\s+(?:hai|hoga)\b/i,
  /\bcheck\s+kar(?:na|enge|o)\b/i,
  /\bconfirm\s+kar(?:na|enge|o)\b/i,
];

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `fu_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Resolve speaker name from speaker ID
 */
function resolveSpeaker(
  speakerId: SpeakerId | undefined,
  speakers: SpeakerEntry[]
): { name: string; spkId?: SpeakerId } {
  if (speakerId) {
    const speaker = speakers.find((s) => s.id === speakerId);
    if (speaker) {
      return { name: speaker.display_name || speaker.label, spkId: speakerId };
    }
  }
  return { name: 'Unknown' };
}

/**
 * Check if text contains a follow-up action
 */
function isFollowUp(text: string): boolean {
  return FOLLOW_UP_PATTERNS.some((p) => p.test(text))
    || HINDI_FOLLOW_UP_PATTERNS.some((p) => p.test(text));
}

/**
 * Check if text is an open question
 */
function isOpenQuestion(text: string): boolean {
  return QUESTION_PATTERNS.some((p) => p.test(text));
}

/**
 * Extract who/what/when from text
 */
function extractComponents(text: string, speakerName: string): { who: string; what: string; when?: string } {
  const match = WHO_WILL_PATTERN.exec(text);
  if (match) {
    return {
      who: match[1] || speakerName,
      what: match[2]?.trim() || text,
      when: match[3]?.trim(),
    };
  }
  return { who: speakerName, what: text };
}

/**
 * Extract follow-up items from transcript segments.
 *
 * @param segments - Transcript segments
 * @param speakers - Speaker registry entries
 * @returns Array of detected follow-ups
 */
export function extractFollowUps(
  segments: TranscriptSegment[],
  speakers: SpeakerEntry[]
): FollowUp[] {
  const followUps: FollowUp[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]!;
    const text = segment.text_display || segment.text;
    const hasFollowUp = isFollowUp(text);
    const hasQuestion = isOpenQuestion(text);

    if (!hasFollowUp && !hasQuestion) continue;

    const speaker = resolveSpeaker(segment.speaker_id, speakers);
    const components = extractComponents(text, speaker.name);

    followUps.push({
      id: generateId(),
      who: components.who,
      what: components.what,
      when: components.when,
      text: text.trim(),
      isOpenQuestion: hasQuestion && !hasFollowUp,
      speakerId: speaker.spkId,
      status: 'suggested',
      segmentIndex: i,
    });
  }

  return followUps;
}
