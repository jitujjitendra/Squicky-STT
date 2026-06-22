/**
 * Commitment Detector
 *
 * Detects commitments from transcript segments:
 * - External ("we will send", "hum bhej denge") - higher accountability
 * - Internal ("let's review", "internally discuss") - lower accountability
 *
 * Architecture decision: Pattern-based detection differentiating between
 * external-facing (client/customer) commitments and internal team commitments.
 * External commitments carry higher accountability.
 */

import type { TranscriptSegment, SpeakerEntry, SpeakerId } from '@/modules/speech-engine/types';
import type { Commitment, CommitmentScope, AccountabilityLevel } from '../types';

/** External commitment patterns (EN + HI) - directed at client/customer */
const EXTERNAL_PATTERNS: RegExp[] = [
  /\bwe\s+will\s+(?:send|deliver|provide|share|get\s+back)\b/i,
  /\bi(?:'ll|'ll|ll)\s+(?:send|share|get\s+back|email|deliver)\b/i,
  /\bwe(?:'ll|'ll|ll)\s+(?:have\s+it|get\s+it|deliver|send)\b/i,
  /\byou(?:'ll|'ll|ll)\s+(?:receive|get|have)\s+(?:it|the)\b/i,
  /\bby\s+(?:end\s+of\s+day|tomorrow|next\s+week|monday|friday)\b/i,
  /\bpromise\b/i,
  /\bguarantee\b/i,
  /\bcommit\s+to\b/i,
  /\bhum\s+bhej\s+denge\b/i,
  /\bde\s+denge\b/i,
  /\bkar\s+denge\b/i,
  /\bkal\s+tak\s+(?:mil|bhej|de)\b/i,
  /\bpakka\b/i,
  /\baapko\s+(?:mil|bhej)\b/i,
];

/** Internal commitment patterns (EN + HI) - team/internal actions */
const INTERNAL_PATTERNS: RegExp[] = [
  /\blet(?:'s|s)\s+(?:review|discuss|check|look\s+into|follow\s+up)\b/i,
  /\binternally\s+(?:discuss|review|check)\b/i,
  /\bwe\s+(?:need\s+to|should)\s+(?:review|discuss|check|plan|align)\b/i,
  /\bi(?:'ll|'ll|ll)\s+(?:check|review|look\s+into|investigate)\b/i,
  /\bwill\s+(?:circle\s+back|loop\s+in|sync\s+up)\b/i,
  /\bteam\s+(?:meeting|sync|discussion)\b/i,
  /\bapne\s+(?:mein|taraf\s+se)\s+(?:dekhte|karte)\b/i,
  /\binternal(?:ly)?\s+(?:dekhte|karte|discuss)\b/i,
  /\bteam\s+(?:se|mein)\s+(?:baat|discuss)\b/i,
];

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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
 * Match text against commitment patterns
 */
function matchCommitmentScope(text: string): CommitmentScope | null {
  for (const pattern of EXTERNAL_PATTERNS) {
    if (pattern.test(text)) return 'external';
  }
  for (const pattern of INTERNAL_PATTERNS) {
    if (pattern.test(text)) return 'internal';
  }
  return null;
}

/**
 * Get accountability level based on commitment scope
 */
function getAccountability(scope: CommitmentScope): AccountabilityLevel {
  return scope === 'external' ? 'high' : 'medium';
}

/**
 * Detect commitments from transcript segments.
 *
 * @param segments - Transcript segments
 * @param speakers - Speaker registry entries
 * @returns Array of detected commitments
 */
export function detectCommitments(
  segments: TranscriptSegment[],
  speakers: SpeakerEntry[]
): Commitment[] {
  const commitments: Commitment[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]!;
    const text = segment.text_display || segment.text;
    const scope = matchCommitmentScope(text);

    if (!scope) continue;

    const speaker = resolveSpeaker(segment.speaker_id, speakers);
    commitments.push({
      id: generateId(),
      text: text.trim(),
      madeBy: speaker.name,
      madeBySpkId: speaker.spkId,
      scope,
      accountability: getAccountability(scope),
      status: 'suggested',
      segmentIndex: i,
    });
  }

  return commitments;
}
