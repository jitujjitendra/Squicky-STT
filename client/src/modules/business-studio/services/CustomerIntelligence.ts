/**
 * Customer Intelligence Extractor
 *
 * Detects customer insights from transcript segments:
 * - Pain points (EN: "struggling with", "problem is" + HI: "dikkat hai", "pareshan")
 * - Requirements ("we need", "chahiye")
 * - Expectations ("expecting", "umeed hai")
 * - Concerns ("worried", "chinta")
 *
 * Architecture decision: Pattern-based detection with bilingual support.
 * Each insight is tagged with type and speaker for attribution.
 */

import type { TranscriptSegment, SpeakerEntry, SpeakerId } from '@/modules/speech-engine/types';
import type { CustomerInsight, CustomerInsightType, CustomerProfile } from '../types';

/** Pain point patterns (EN + HI) */
const PAIN_POINT_PATTERNS: RegExp[] = [
  /\bstruggling\s+with\b/i,
  /\bproblem\s+is\b/i,
  /\bfrustrat(?:ed|ing)\b/i,
  /\bdifficult\s+to\b/i,
  /\bhaving\s+trouble\b/i,
  /\bcan(?:'t|not)\s+(?:do|get|make)\b/i,
  /\btoo\s+(?:slow|complex|complicated)\b/i,
  /\bnot\s+(?:happy|satisfied)\b/i,
  /\bdikkat\s+hai\b/i,
  /\bpareshan\b/i,
  /\btaklif\b/i,
  /\bproblem\s+ho\s+rahi\b/i,
  /\bmushkil\s+hai\b/i,
  /\bkaam\s+nahi\s+kar\s+raha\b/i,
];

/** Requirement patterns (EN + HI) */
const REQUIREMENT_PATTERNS: RegExp[] = [
  /\bwe\s+need\b/i,
  /\bwe\s+require\b/i,
  /\bmust\s+have\b/i,
  /\bessential\b/i,
  /\bnecessary\b/i,
  /\brequirement\s+is\b/i,
  /\blooking\s+for\b/i,
  /\bwant(?:s|ed)?\s+(?:a|to)\b/i,
  /\bchahiye\b/i,
  /\bzarurat\b/i,
  /\bhona\s+chahiye\b/i,
  /\bhamein\s+(?:chahiye|lagega)\b/i,
];

/** Expectation patterns (EN + HI) */
const EXPECTATION_PATTERNS: RegExp[] = [
  /\bexpect(?:ing|ation)?\b/i,
  /\bhope\s+(?:to|that)\b/i,
  /\bshould\s+be\s+able\b/i,
  /\banticipat(?:e|ing)\b/i,
  /\bby\s+(?:when|then)\b/i,
  /\bumeed\s+hai\b/i,
  /\basha\s+hai\b/i,
  /\bhona\s+chahiye\s+(?:kal|jaldi)\b/i,
  /\bexpect\s+kar\s+rahe\b/i,
];

/** Concern patterns (EN + HI) */
const CONCERN_PATTERNS: RegExp[] = [
  /\bworried\b/i,
  /\bconcerned?\b/i,
  /\bafraid\b/i,
  /\bnervous\b/i,
  /\bunsure\b/i,
  /\bwhat\s+if\b/i,
  /\brisks?\b/i,
  /\bsecurity\b.*\bconcern/i,
  /\bchinta\b/i,
  /\bdar\s+hai\b/i,
  /\bfikar\b/i,
  /\btension\b/i,
];

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `ci_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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
 * Check segment text against patterns and return matching type
 */
function matchInsightType(text: string): CustomerInsightType | null {
  for (const pattern of PAIN_POINT_PATTERNS) {
    if (pattern.test(text)) return 'pain-point';
  }
  for (const pattern of REQUIREMENT_PATTERNS) {
    if (pattern.test(text)) return 'requirement';
  }
  for (const pattern of EXPECTATION_PATTERNS) {
    if (pattern.test(text)) return 'expectation';
  }
  for (const pattern of CONCERN_PATTERNS) {
    if (pattern.test(text)) return 'concern';
  }
  return null;
}

/**
 * Extract customer insights from transcript segments.
 *
 * @param segments - Transcript segments
 * @param speakers - Speaker registry entries
 * @returns Customer profile with categorized insights
 */
export function extractCustomerInsights(
  segments: TranscriptSegment[],
  speakers: SpeakerEntry[]
): CustomerProfile {
  const profile: CustomerProfile = {
    painPoints: [],
    requirements: [],
    expectations: [],
    concerns: [],
  };

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]!;
    const text = segment.text_display || segment.text;
    const insightType = matchInsightType(text);

    if (!insightType) continue;

    const speaker = resolveSpeaker(segment.speaker_id, speakers);
    const insight: CustomerInsight = {
      id: generateId(),
      type: insightType,
      text: text.trim(),
      speaker: speaker.name,
      speakerId: speaker.spkId,
      status: 'suggested',
      segmentIndex: i,
    };

    switch (insightType) {
      case 'pain-point':
        profile.painPoints.push(insight);
        break;
      case 'requirement':
        profile.requirements.push(insight);
        break;
      case 'expectation':
        profile.expectations.push(insight);
        break;
      case 'concern':
        profile.concerns.push(insight);
        break;
    }
  }

  return profile;
}
