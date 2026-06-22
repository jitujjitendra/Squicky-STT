/**
 * Risk & Opportunity Detector
 *
 * Detects business risks and opportunities from transcript segments.
 * Risks reuse shared patterns from meeting-intelligence plus business-specific patterns.
 * Opportunities: "upsell", "expand", "aur chahiye".
 *
 * Architecture decision: Pattern-based detection. Risks are severity-tiered,
 * opportunities are scored by strength of signal.
 */

import type { TranscriptSegment, SpeakerEntry, SpeakerId } from '@/modules/speech-engine/types';
import type { BusinessRisk, BusinessOpportunity, Severity } from '../types';

// ─── Risk Patterns ───────────────────────────────────────────────────────────

/** High severity risk patterns */
const HIGH_RISK_PATTERNS: RegExp[] = [
  /\bblocker\b/i,
  /\bblocked\b/i,
  /\bfail(?:ed|ing|ure)?\b/i,
  /\bcritical\s+(?:issue|problem|bug)\b/i,
  /\bshow\s*stopper\b/i,
  /\bcan(?:'t|not)\s+(?:proceed|continue|ship|deliver)\b/i,
  /\bnahi\s+ho\s+payega\b/i,
  /\bimpossible\b/i,
  /\bdead(?:line)?\s+miss\b/i,
  /\blost?\s+(?:the\s+)?(?:client|deal|customer)\b/i,
  /\bbreach\b/i,
  /\blegal\s+(?:issue|action|risk)\b/i,
];

/** Medium severity risk patterns */
const MEDIUM_RISK_PATTERNS: RegExp[] = [
  /\brisk\b/i,
  /\bconcern\b/i,
  /\bworried\b/i,
  /\bmight\s+(?:fail|break|miss|lose)\b/i,
  /\bpotential\s+(?:issue|problem)\b/i,
  /\buncertain\b/i,
  /\bdikkat\b/i,
  /\bmushkil\b/i,
  /\bproblem\s+(?:ho|aa)\b/i,
  /\bdelay(?:ed)?\b/i,
  /\bchurn\b/i,
  /\bescalat(?:e|ion)\b/i,
  /\bdissatisf(?:ied|action)\b/i,
];

/** Low severity risk patterns */
const LOW_RISK_PATTERNS: RegExp[] = [
  /\bnot\s+sure\b/i,
  /\bslightly\s+(?:worried|concerned)\b/i,
  /\bminor\s+(?:issue|risk|concern)\b/i,
  /\bkeep\s+an?\s+eye\s+on\b/i,
  /\bthoda\s+(?:dikkat|issue)\b/i,
  /\bshayad\b/i,
  /\bmaybe\s+(?:a\s+)?(?:problem|issue)\b/i,
];

// ─── Opportunity Patterns ────────────────────────────────────────────────────

/** Opportunity detection patterns */
const OPPORTUNITY_PATTERNS: RegExp[] = [
  /\bupsell\b/i,
  /\bcross.sell\b/i,
  /\bexpand\b/i,
  /\bgrow(?:th)?\b/i,
  /\badditional\s+(?:services?|products?|modules?)\b/i,
  /\bupgrade\b/i,
  /\bnew\s+(?:opportunity|market|segment|client)\b/i,
  /\bpartnership\b/i,
  /\breferral\b/i,
  /\brecommend(?:ation)?\b/i,
  /\baur\s+chahiye\b/i,
  /\baur\s+kya\s+(?:hai|mil\s+sakta)\b/i,
  /\bbada\s+(?:plan|package)\b/i,
  /\binterested\s+in\s+more\b/i,
  /\bcan\s+you\s+(?:also|additionally)\b/i,
  /\bwhat\s+(?:else|other\s+(?:services?|solutions?))\b/i,
];

/**
 * Generate a unique ID
 */
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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
 * Detect risk severity from text
 */
function detectRiskSeverity(text: string): Severity | null {
  for (const pattern of HIGH_RISK_PATTERNS) {
    if (pattern.test(text)) return 'high';
  }
  for (const pattern of MEDIUM_RISK_PATTERNS) {
    if (pattern.test(text)) return 'medium';
  }
  for (const pattern of LOW_RISK_PATTERNS) {
    if (pattern.test(text)) return 'low';
  }
  return null;
}

/**
 * Check if text matches any opportunity pattern
 */
function isOpportunity(text: string): boolean {
  return OPPORTUNITY_PATTERNS.some((p) => p.test(text));
}

/**
 * Detect business risks from transcript segments.
 *
 * @param segments - Transcript segments
 * @param speakers - Speaker registry entries
 * @returns Array of detected business risks
 */
export function detectBusinessRisks(
  segments: TranscriptSegment[],
  speakers: SpeakerEntry[]
): BusinessRisk[] {
  const risks: BusinessRisk[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]!;
    const text = segment.text_display || segment.text;
    const severity = detectRiskSeverity(text);

    if (!severity) continue;

    const raiser = resolveSpeaker(segment.speaker_id, speakers);
    risks.push({
      id: generateId('br'),
      text: text.trim(),
      raisedBy: raiser.name,
      raisedBySpkId: raiser.spkId,
      severity,
      status: 'suggested',
      segmentIndex: i,
    });
  }

  return risks;
}

/**
 * Detect business opportunities from transcript segments.
 *
 * @param segments - Transcript segments
 * @param speakers - Speaker registry entries
 * @returns Array of detected business opportunities
 */
export function detectBusinessOpportunities(
  segments: TranscriptSegment[],
  speakers: SpeakerEntry[]
): BusinessOpportunity[] {
  const opportunities: BusinessOpportunity[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]!;
    const text = segment.text_display || segment.text;

    if (!isOpportunity(text)) continue;

    const speaker = resolveSpeaker(segment.speaker_id, speakers);
    opportunities.push({
      id: generateId('bo'),
      text: text.trim(),
      mentionedBy: speaker.name,
      mentionedBySpkId: speaker.spkId,
      status: 'suggested',
      segmentIndex: i,
    });
  }

  return opportunities;
}
