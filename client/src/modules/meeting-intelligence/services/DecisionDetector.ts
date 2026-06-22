/**
 * Decision Detector
 *
 * Detects decisions from transcript segments using pattern matching
 * for English and Hindi/Hinglish. Assigns confidence levels based on
 * explicitness of the decision language.
 *
 * Confidence levels:
 * - high: Explicit decision language ("we decided", "let's go with")
 * - medium: Implicit agreement ("agreed", "sounds good")
 * - low: Inferred consensus ("I think we should", "makes sense")
 *
 * Architecture decision: Pattern-based detection, no AI. Each detected
 * decision is tagged with who made it (speaker attribution).
 */

import type { TranscriptSegment, SpeakerEntry, SpeakerId } from '@/modules/speech-engine/types';
import type { Decision, Confidence } from '../types';

/** High confidence - explicit decision patterns */
const HIGH_CONFIDENCE_PATTERNS: RegExp[] = [
  /\b(?:we|i)\s+decided\b/i,
  /\bdecision\s+is\b/i,
  /\blet(?:'s|s)\s+go\s+with\b/i,
  /\bfinal\s+(?:decision|call|answer)\b/i,
  /\bwe(?:'re|'ll)\s+going\s+(?:to|with)\b/i,
  /\bapproved\b/i,
  /\bconfirmed\b/i,
  /\bpakka\b/i,
  /\bfaisla\b/i,
  /\btay\s+hai\b/i,
];

/** Medium confidence - implicit agreement */
const MEDIUM_CONFIDENCE_PATTERNS: RegExp[] = [
  /\bagreed\b/i,
  /\ball\s+(?:agreed|in\s+favor)\b/i,
  /\bsounds\s+good\b/i,
  /\btheek\s+hai\b/i,
  /\bchal(?:o|ega)\b/i,
  /\bdone\s+deal\b/i,
  /\blet(?:'s|s)\s+do\s+(?:it|that|this)\b/i,
  /\bwe(?:'ll| will)\s+(?:proceed|move\s+forward)\b/i,
  /\bgo\s+ahead\b/i,
];

/** Low confidence - inferred */
const LOW_CONFIDENCE_PATTERNS: RegExp[] = [
  /\bi\s+think\s+we\s+should\b/i,
  /\bmakes\s+sense\b/i,
  /\bfair\s+enough\b/i,
  /\bworks\s+for\s+me\b/i,
  /\bno\s+objection\b/i,
  /\bI\s+(?:guess|suppose)\s+(?:we|that)\b/i,
  /\bshayad\s+ye\s+theek\b/i,
];

/**
 * Resolve who made/announced the decision
 */
function resolveDecisionMaker(
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
 * Generate a unique ID
 */
function generateId(): string {
  return `dec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Detect decisions from transcript segments.
 *
 * @param segments - Transcript segments
 * @param speakers - Speaker registry entries
 * @returns Array of detected decisions
 */
export function detectDecisions(
  segments: TranscriptSegment[],
  speakers: SpeakerEntry[]
): Decision[] {
  const decisions: Decision[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]!;
    const text = segment.text_display || segment.text;

    let confidence: Confidence | null = null;

    // Check high confidence patterns first
    for (const pattern of HIGH_CONFIDENCE_PATTERNS) {
      if (pattern.test(text)) {
        confidence = 'high';
        break;
      }
    }

    // Check medium confidence
    if (!confidence) {
      for (const pattern of MEDIUM_CONFIDENCE_PATTERNS) {
        if (pattern.test(text)) {
          confidence = 'medium';
          break;
        }
      }
    }

    // Check low confidence
    if (!confidence) {
      for (const pattern of LOW_CONFIDENCE_PATTERNS) {
        if (pattern.test(text)) {
          confidence = 'low';
          break;
        }
      }
    }

    if (confidence) {
      const maker = resolveDecisionMaker(segment.speaker_id, speakers);
      decisions.push({
        id: generateId(),
        text: text.trim(),
        madeBy: maker.name,
        madeBySpkId: maker.spkId,
        confidence,
        status: 'suggested',
        segmentIndex: i,
      });
    }
  }

  return decisions;
}
