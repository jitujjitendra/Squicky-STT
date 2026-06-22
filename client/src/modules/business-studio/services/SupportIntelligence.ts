/**
 * Support Intelligence Extractor
 *
 * Detects support signals from transcript segments:
 * - Issues ("not working", "kaam nahi")
 * - Resolution ("fixed it", "theek ho gaya")
 * - Escalation ("need manager", "upar bhejte")
 *
 * Architecture decision: Pattern-based detection with bilingual support.
 * Each signal is tagged with type and speaker for attribution.
 */

import type { TranscriptSegment, SpeakerEntry, SpeakerId } from '@/modules/speech-engine/types';
import type { SupportSignal, SupportSignalType } from '../types';

/** Issue patterns (EN + HI) */
const ISSUE_PATTERNS: RegExp[] = [
  /\bnot\s+working\b/i,
  /\bdoes(?:n't|nt)\s+work\b/i,
  /\bbroken\b/i,
  /\berror\b/i,
  /\bcrash(?:es|ed|ing)?\b/i,
  /\bfail(?:ed|ing|s)?\b/i,
  /\bdown\b/i,
  /\bunable\s+to\b/i,
  /\bcan(?:'t|not)\s+(?:access|login|open|connect)\b/i,
  /\bkaam\s+nahi\b/i,
  /\bchal\s+nahi\s+raha\b/i,
  /\bband\s+ho\s+gaya\b/i,
  /\bproblem\s+aa\s+rahi\b/i,
  /\berror\s+aa\s+raha\b/i,
  /\bnahi\s+ho\s+raha\b/i,
];

/** Resolution patterns (EN + HI) */
const RESOLUTION_PATTERNS: RegExp[] = [
  /\bfixed\s+it\b/i,
  /\bresolved\b/i,
  /\bsorted\b/i,
  /\bworking\s+now\b/i,
  /\bback\s+(?:up|online|to\s+normal)\b/i,
  /\bissue\s+(?:is\s+)?(?:fixed|resolved|closed)\b/i,
  /\bpatch(?:ed)?\b/i,
  /\bupdated?\s+(?:and|it)\b.*\bwork/i,
  /\btheek\s+ho\s+gaya\b/i,
  /\bfix\s+ho\s+gaya\b/i,
  /\bchal\s+raha\s+hai\s+ab\b/i,
  /\bsahi\s+ho\s+gaya\b/i,
  /\bsolve\s+ho\s+gaya\b/i,
];

/** Escalation patterns (EN + HI) */
const ESCALATION_PATTERNS: RegExp[] = [
  /\bneed\s+(?:a\s+)?manager\b/i,
  /\bescalat(?:e|ing|ed)\b/i,
  /\bsupervisor\b/i,
  /\bhigher\s+(?:authority|level)\b/i,
  /\bnot\s+(?:acceptable|satisfied)\b/i,
  /\bspeak\s+to\s+(?:someone|your\s+(?:manager|boss))\b/i,
  /\bescalation\b/i,
  /\bcomplaint\b/i,
  /\bupar\s+bhejte\b/i,
  /\bmanager\s+se\s+baat\b/i,
  /\bsenior\s+(?:ko|se)\b/i,
  /\bcomplaint\s+kar(?:na|enge)\b/i,
  /\byeh\s+nahi\s+chalega\b/i,
];

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `sup_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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
 * Match text against support signal patterns
 */
function matchSupportSignalType(text: string): SupportSignalType | null {
  for (const pattern of ISSUE_PATTERNS) {
    if (pattern.test(text)) return 'issue';
  }
  for (const pattern of RESOLUTION_PATTERNS) {
    if (pattern.test(text)) return 'resolution';
  }
  for (const pattern of ESCALATION_PATTERNS) {
    if (pattern.test(text)) return 'escalation';
  }
  return null;
}

/**
 * Extract support signals from transcript segments.
 *
 * @param segments - Transcript segments
 * @param speakers - Speaker registry entries
 * @returns Array of detected support signals
 */
export function extractSupportSignals(
  segments: TranscriptSegment[],
  speakers: SpeakerEntry[]
): SupportSignal[] {
  const signals: SupportSignal[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]!;
    const text = segment.text_display || segment.text;
    const signalType = matchSupportSignalType(text);

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
