/**
 * Risk Detector
 *
 * Detects risks, blockers, and concerns from transcript segments using
 * pattern matching for English and Hindi/Hinglish. Assigns severity levels
 * based on the strength of risk language.
 *
 * Severity:
 * - high: Blockers, failures, critical issues
 * - medium: Concerns, potential issues
 * - low: Minor worries, uncertainties
 *
 * Architecture decision: Pattern-based detection. Risk language is
 * categorized into severity tiers based on urgency/impact indicators.
 */

import type { TranscriptSegment, SpeakerEntry, SpeakerId } from '@/modules/speech-engine/types';
import type { Risk, Severity } from '../types';

/** High severity - blockers and failures */
const HIGH_SEVERITY_PATTERNS: RegExp[] = [
  /\bblocker\b/i,
  /\bblocked\b/i,
  /\bfail(?:ed|ing|ure)?\b/i,
  /\bcritical\s+(?:issue|problem|bug)\b/i,
  /\bshow\s*stopper\b/i,
  /\bcan(?:'t|not)\s+(?:proceed|continue|ship)\b/i,
  /\bnahi\s+ho\s+payega\b/i,
  /\bband\s+ho\s+jayega\b/i,
  /\bimpossible\b/i,
  /\bdead(?:line)?\s+miss\b/i,
];

/** Medium severity - concerns */
const MEDIUM_SEVERITY_PATTERNS: RegExp[] = [
  /\brisk\b/i,
  /\bconcern\b/i,
  /\bworried\b/i,
  /\bmight\s+(?:fail|break|miss)\b/i,
  /\bpotential\s+(?:issue|problem)\b/i,
  /\buncertain\b/i,
  /\bdikkat\b/i,
  /\bmushkil\b/i,
  /\bproblem\s+(?:ho|aa)\b/i,
  /\bchalleng(?:e|ing)\b/i,
  /\bdelay\b/i,
];

/** Low severity - minor worries */
const LOW_SEVERITY_PATTERNS: RegExp[] = [
  /\bnot\s+sure\b/i,
  /\bslightly\s+(?:worried|concerned)\b/i,
  /\bminor\s+(?:issue|risk|concern)\b/i,
  /\bmight\s+be\s+(?:a\s+)?(?:problem|issue)\b/i,
  /\bkeep\s+an?\s+eye\s+on\b/i,
  /\bthoda\s+(?:dikkat|issue)\b/i,
  /\bshayad\b/i,
  /\bmaybe\s+(?:a\s+)?(?:problem|issue)\b/i,
];

/**
 * Resolve who raised the risk
 */
function resolveRaiser(
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
  return `risk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Detect risks from transcript segments.
 *
 * @param segments - Transcript segments
 * @param speakers - Speaker registry entries
 * @returns Array of detected risks
 */
export function detectRisks(
  segments: TranscriptSegment[],
  speakers: SpeakerEntry[]
): Risk[] {
  const risks: Risk[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]!;
    const text = segment.text_display || segment.text;

    let severity: Severity | null = null;

    // Check high severity first
    for (const pattern of HIGH_SEVERITY_PATTERNS) {
      if (pattern.test(text)) {
        severity = 'high';
        break;
      }
    }

    // Check medium
    if (!severity) {
      for (const pattern of MEDIUM_SEVERITY_PATTERNS) {
        if (pattern.test(text)) {
          severity = 'medium';
          break;
        }
      }
    }

    // Check low
    if (!severity) {
      for (const pattern of LOW_SEVERITY_PATTERNS) {
        if (pattern.test(text)) {
          severity = 'low';
          break;
        }
      }
    }

    if (severity) {
      const raiser = resolveRaiser(segment.speaker_id, speakers);
      risks.push({
        id: generateId(),
        text: text.trim(),
        raisedBy: raiser.name,
        raisedBySpkId: raiser.spkId,
        severity,
        status: 'suggested',
        segmentIndex: i,
      });
    }
  }

  return risks;
}
