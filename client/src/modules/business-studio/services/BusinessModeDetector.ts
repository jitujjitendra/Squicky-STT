/**
 * Business Mode Detector
 *
 * Auto-detects the business conversation mode by analyzing keywords
 * in the first 20% of transcript segments. Supports 9 business modes.
 *
 * Detection strategy: Score each mode based on keyword frequency in
 * the opening portion of the conversation. The highest-scoring mode
 * wins, with "general-business" as the fallback.
 */

import type { TranscriptSegment } from '@/modules/speech-engine/types';
import type { BusinessMode } from '../types';

/** Keywords mapped to business modes */
const MODE_KEYWORDS: Record<BusinessMode, RegExp[]> = {
  'sales-call': [
    /\bpric(?:e|ing)\b/i,
    /\bproposal\b/i,
    /\bdeal\b/i,
    /\bdiscount\b/i,
    /\bcontract\b/i,
    /\bquote\b/i,
    /\bclosing\b/i,
    /\bROI\b/i,
    /\bbudget\b/i,
    /\bpurchase\b/i,
    /\bsolution\b/i,
    /\bpackage\b/i,
    /\bmehnga\b/i,
    /\bsauda\b/i,
  ],
  'customer-support': [
    /\bticket\b/i,
    /\bissue\b/i,
    /\bnot working\b/i,
    /\bbug\b/i,
    /\berror\b/i,
    /\bhelp\b/i,
    /\bsupport\b/i,
    /\bcomplaint\b/i,
    /\bfix\b/i,
    /\bkaam nahi\b/i,
    /\btheek\b/i,
    /\btroublesho/i,
  ],
  'discovery-call': [
    /\btell me about\b/i,
    /\bwhat do you\b/i,
    /\bcurrent(?:ly)?\b.*\busing\b/i,
    /\bchallenges?\b/i,
    /\bgoals?\b/i,
    /\bneeds?\b/i,
    /\brequirements?\b/i,
    /\bpain points?\b/i,
    /\bwhat brings you\b/i,
    /\bkya chahiye\b/i,
  ],
  'client-meeting': [
    /\bclient\b/i,
    /\bstakeholder\b/i,
    /\bdeliverable\b/i,
    /\bmilestone\b/i,
    /\btimeline\b/i,
    /\bproject\b.*\bupdate\b/i,
    /\bstatus\b/i,
    /\bprogress\b/i,
    /\bfeedback\b/i,
  ],
  'internal-discussion': [
    /\bteam\b/i,
    /\binternal(?:ly)?\b/i,
    /\bour side\b/i,
    /\bapna\b/i,
    /\bamong ourselves\b/i,
    /\bbrainstorm\b/i,
    /\bstrategy\b/i,
    /\bsync\b/i,
    /\bstandup\b/i,
  ],
  'project-review': [
    /\bsprint\b/i,
    /\bretrospective\b/i,
    /\brelease\b/i,
    /\bdeployment\b/i,
    /\bblockers?\b/i,
    /\bvelocity\b/i,
    /\bbacklog\b/i,
    /\buser stor(?:y|ies)\b/i,
    /\bJIRA\b/i,
    /\btickets?\b/i,
  ],
  'vendor-discussion': [
    /\bvendor\b/i,
    /\bsupplier\b/i,
    /\bprocurement\b/i,
    /\bSLA\b/i,
    /\bservice\s+level\b/i,
    /\bcontract\b.*\brenew/i,
    /\bthird.party\b/i,
    /\bpartner\b/i,
    /\bintegration\b/i,
  ],
  'recruitment-interview': [
    /\bcandidate\b/i,
    /\bexperience\b/i,
    /\bresume\b/i,
    /\bCV\b/i,
    /\brole\b/i,
    /\bposition\b/i,
    /\bsalary\b/i,
    /\bjoin(?:ing)?\b/i,
    /\bskill(?:s|set)\b/i,
    /\binterview\b/i,
    /\bnotice period\b/i,
  ],
  'general-business': [],
};

/**
 * Detect the business mode from transcript segments.
 * Analyzes the first 20% of segments by keyword frequency.
 *
 * @param segments - Transcript segments
 * @returns Detected business mode
 */
export function detectBusinessMode(segments: TranscriptSegment[]): BusinessMode {
  if (segments.length === 0) return 'general-business';

  // Analyze first 20% of segments
  const sampleSize = Math.max(1, Math.ceil(segments.length * 0.2));
  const sampleSegments = segments.slice(0, sampleSize);

  const combinedText = sampleSegments
    .map((s) => s.text_display || s.text)
    .join(' ');

  // Score each mode
  const scores: Record<string, number> = {};
  for (const [mode, patterns] of Object.entries(MODE_KEYWORDS)) {
    if (mode === 'general-business') continue;
    let score = 0;
    for (const pattern of patterns) {
      if (pattern.test(combinedText)) {
        score++;
      }
    }
    scores[mode] = score;
  }

  // Find highest scoring mode
  let bestMode: BusinessMode = 'general-business';
  let bestScore = 0;

  for (const [mode, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestMode = mode as BusinessMode;
    }
  }

  // Require at least 2 keyword matches to avoid false positives
  if (bestScore < 2) return 'general-business';

  return bestMode;
}
