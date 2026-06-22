/**
 * Interview Intelligence Service
 *
 * Extracts interview-specific intelligence for recruitment mode:
 * - Candidate strengths
 * - Candidate concerns
 * - Skill pattern matching
 *
 * Architecture decision: Only runs when business mode is "recruitment-interview".
 * Uses pattern matching against common skill keywords and strength/concern indicators.
 */

import type { TranscriptSegment } from '@/modules/speech-engine/types';
import type { InterviewIntelligence } from '../types';

/** Strength indicator patterns */
const STRENGTH_PATTERNS: RegExp[] = [
  /\bstrong\s+(?:in|at|with)\b/i,
  /\bexcellent\b/i,
  /\bexperienced?\s+(?:in|with)\b/i,
  /\bgood\s+(?:at|with|knowledge)\b/i,
  /\b(?:deep|solid)\s+(?:understanding|knowledge|experience)\b/i,
  /\bexpert(?:ise)?\s+(?:in|with)\b/i,
  /\bproficient\b/i,
  /\bled\s+(?:a|the)\s+team\b/i,
  /\bmanaged\s+(?:a|the)\b/i,
  /\bbuilt\s+(?:a|the|from)\b/i,
  /\bdelivered\b/i,
  /\bachiev(?:ed|ement)\b/i,
  /\bimpress(?:ed|ive)\b/i,
];

/** Concern indicator patterns */
const CONCERN_PATTERNS: RegExp[] = [
  /\bgap\s+in\b/i,
  /\black\s+of\b/i,
  /\bno\s+experience\s+(?:in|with)\b/i,
  /\bnot\s+(?:sure|familiar|experienced)\b/i,
  /\bweak\s+(?:in|at|area)\b/i,
  /\bstill\s+learning\b/i,
  /\bneed(?:s)?\s+(?:to\s+)?(?:learn|improve)\b/i,
  /\bjob\s+hopping\b/i,
  /\bfrequent\s+changes?\b/i,
  /\boverqualified\b/i,
  /\bunderqualified\b/i,
  /\bcultural?\s+fit\b/i,
];

/** Common tech/business skill patterns */
const SKILL_PATTERNS: RegExp[] = [
  /\b(?:Java(?:Script)?|Python|TypeScript|React|Angular|Vue|Node|Go|Rust|C\+\+|C#)\b/i,
  /\b(?:AWS|Azure|GCP|Docker|Kubernetes|CI\/CD)\b/i,
  /\b(?:SQL|NoSQL|MongoDB|PostgreSQL|MySQL|Redis)\b/i,
  /\b(?:machine\s+learning|AI|ML|deep\s+learning|NLP)\b/i,
  /\b(?:project\s+management|agile|scrum|kanban)\b/i,
  /\b(?:leadership|communication|teamwork|problem.solving)\b/i,
  /\b(?:sales|marketing|analytics|finance|accounting)\b/i,
  /\b(?:design|UX|UI|Figma|product)\b/i,
  /\b(?:DevOps|SRE|infrastructure|cloud)\b/i,
  /\b(?:security|networking|system\s+admin)\b/i,
];

/**
 * Extract interview intelligence from transcript segments.
 *
 * @param segments - Transcript segments
 * @returns Interview intelligence with strengths, concerns, and skills
 */
export function extractInterviewIntelligence(
  segments: TranscriptSegment[]
): InterviewIntelligence {
  const strengths: string[] = [];
  const concerns: string[] = [];
  const skillsSet = new Set<string>();

  for (const segment of segments) {
    const text = segment.text_display || segment.text;

    // Check for strengths
    for (const pattern of STRENGTH_PATTERNS) {
      if (pattern.test(text)) {
        strengths.push(text.trim());
        break;
      }
    }

    // Check for concerns
    for (const pattern of CONCERN_PATTERNS) {
      if (pattern.test(text)) {
        concerns.push(text.trim());
        break;
      }
    }

    // Extract skills
    for (const pattern of SKILL_PATTERNS) {
      const match = pattern.exec(text);
      if (match) {
        skillsSet.add(match[0]);
      }
    }
  }

  return {
    strengths: [...new Set(strengths)].slice(0, 10),
    concerns: [...new Set(concerns)].slice(0, 10),
    skillsDetected: Array.from(skillsSet).slice(0, 15),
  };
}
