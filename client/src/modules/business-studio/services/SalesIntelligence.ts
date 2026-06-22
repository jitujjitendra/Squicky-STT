/**
 * Sales Intelligence Extractor
 *
 * Detects sales signals from transcript segments:
 * - Objections ("too expensive", "mehnga hai", "budget nahi")
 * - Buying signals ("when can we start", "proposal bhejo")
 * - Interest ("tell me more", "accha hai")
 * - Deal risk ("not sure", "dekhte hain")
 *
 * Architecture decision: Pattern-based detection with bilingual support.
 * Each signal is tagged with type and speaker for attribution.
 */

import type { TranscriptSegment, SpeakerEntry, SpeakerId } from '@/modules/speech-engine/types';
import type { SalesSignal, SalesSignalType } from '../types';

/** Objection patterns (EN + HI) */
const OBJECTION_PATTERNS: RegExp[] = [
  /\btoo\s+expensive\b/i,
  /\btoo\s+costly\b/i,
  /\bout\s+of\s+(?:our\s+)?budget\b/i,
  /\bcan(?:'t|not)\s+afford\b/i,
  /\bnot\s+(?:in\s+(?:the|our)\s+)?budget\b/i,
  /\bprice\s+is\s+(?:too\s+)?high\b/i,
  /\bneed\s+(?:to\s+)?think\s+about\s+it\b/i,
  /\bnot\s+(?:the\s+)?right\s+time\b/i,
  /\balready\s+(?:have|using)\b/i,
  /\bmehnga\s+hai\b/i,
  /\bbudget\s+nahi\b/i,
  /\bzyada\s+hai\b/i,
  /\bpaisa\s+nahi\b/i,
  /\bafford\s+nahi\b/i,
];

/** Buying signal patterns (EN + HI) */
const BUYING_SIGNAL_PATTERNS: RegExp[] = [
  /\bwhen\s+can\s+we\s+start\b/i,
  /\bhow\s+(?:do|can)\s+we\s+(?:proceed|get\s+started|begin)\b/i,
  /\bsend\s+(?:me|us)\s+(?:the\s+)?(?:proposal|contract|quote)\b/i,
  /\blet(?:'s|s)\s+(?:do\s+it|go\s+ahead|move\s+forward)\b/i,
  /\bwhat(?:'s|s)\s+(?:the\s+)?next\s+step\b/i,
  /\bready\s+to\s+(?:sign|commit|proceed)\b/i,
  /\bwhere\s+do\s+(?:I|we)\s+sign\b/i,
  /\bproposal\s+bhejo\b/i,
  /\bshuru\s+karte\s+hain\b/i,
  /\baage\s+badhte\s+hain\b/i,
  /\bkab\s+se\s+start\b/i,
  /\bhaan\s+chalega\b/i,
];

/** Interest patterns (EN + HI) */
const INTEREST_PATTERNS: RegExp[] = [
  /\btell\s+me\s+more\b/i,
  /\binterest(?:ed|ing)\b/i,
  /\bsounds?\s+good\b/i,
  /\bthat(?:'s|s)\s+(?:great|interesting|impressive)\b/i,
  /\bhow\s+does\s+(?:it|that)\s+work\b/i,
  /\bcan\s+you\s+(?:show|demo|explain)\b/i,
  /\bwhat\s+(?:else|other)\b/i,
  /\baccha\s+hai\b/i,
  /\bbadhiya\b/i,
  /\baur\s+batao\b/i,
  /\bkaise\s+kaam\s+karta\b/i,
  /\bdikhao\b/i,
];

/** Deal risk patterns (EN + HI) */
const DEAL_RISK_PATTERNS: RegExp[] = [
  /\bnot\s+sure\b/i,
  /\bneed\s+to\s+(?:discuss|check|talk)\b/i,
  /\blet\s+me\s+(?:think|check|get\s+back)\b/i,
  /\bmaybe\s+(?:later|next\s+quarter)\b/i,
  /\bnot\s+(?:a\s+)?priority\b/i,
  /\bno\s+(?:immediate\s+)?urgency\b/i,
  /\bwill\s+get\s+back\b/i,
  /\bdekhte\s+hain\b/i,
  /\bsochte\s+hain\b/i,
  /\bbad\s+mein\b/i,
  /\babhi\s+nahi\b/i,
  /\bpata\s+nahi\b/i,
];

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `ss_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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
 * Match text against sales signal patterns
 */
function matchSalesSignalType(text: string): SalesSignalType | null {
  for (const pattern of OBJECTION_PATTERNS) {
    if (pattern.test(text)) return 'objection';
  }
  for (const pattern of BUYING_SIGNAL_PATTERNS) {
    if (pattern.test(text)) return 'buying-signal';
  }
  for (const pattern of INTEREST_PATTERNS) {
    if (pattern.test(text)) return 'interest';
  }
  for (const pattern of DEAL_RISK_PATTERNS) {
    if (pattern.test(text)) return 'deal-risk';
  }
  return null;
}

/**
 * Extract sales signals from transcript segments.
 *
 * @param segments - Transcript segments
 * @param speakers - Speaker registry entries
 * @returns Array of detected sales signals
 */
export function extractSalesSignals(
  segments: TranscriptSegment[],
  speakers: SpeakerEntry[]
): SalesSignal[] {
  const signals: SalesSignal[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]!;
    const text = segment.text_display || segment.text;
    const signalType = matchSalesSignalType(text);

    if (!signalType) continue;

    const speaker = resolveSpeaker(segment.speaker_id, speakers);
    signals.push({
      id: generateId(),
      type: signalType,
      text: text.trim(),
      speaker: speaker.name,
      speakerId: speaker.spkId,
      status: 'suggested',
      segmentIndex: i,
    });
  }

  return signals;
}
