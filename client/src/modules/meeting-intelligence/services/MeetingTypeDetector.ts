/**
 * Meeting Type Detector
 *
 * Auto-detects meeting type by scanning keywords in the first 20% of
 * transcript segments. Uses weighted keyword matching across 7 meeting types.
 *
 * Architecture decision: Pattern-based detection without AI. Scans early
 * segments because meeting type context (introductions, agenda setting)
 * typically occurs at the start.
 */

import type { TranscriptSegment } from '@/modules/speech-engine/types';
import type { MeetingType } from '../types';

/**
 * Keyword sets for each meeting type (English + Hindi/Hinglish)
 */
const MEETING_TYPE_KEYWORDS: Record<MeetingType, string[]> = {
  team: [
    'standup', 'stand-up', 'sprint', 'retro', 'retrospective', 'sync',
    'team', 'update', 'blocker', 'velocity', 'backlog', 'scrum',
    'kanban', 'daily', 'weekly', 'status',
    'team meeting', 'sabki update', 'kya progress',
  ],
  client: [
    'client', 'customer', 'deliverable', 'milestone', 'requirement',
    'scope', 'feedback', 'stakeholder', 'demo', 'presentation',
    'walkthrough', 'sign-off', 'acceptance',
    'client call', 'client ko', 'unko dikhana',
  ],
  sales: [
    'deal', 'pipeline', 'prospect', 'lead', 'revenue', 'quota',
    'close', 'proposal', 'pricing', 'discount', 'contract',
    'commission', 'forecast', 'funnel', 'conversion',
    'sale', 'bechna', 'deal close',
  ],
  project: [
    'project', 'timeline', 'gantt', 'milestone', 'deadline',
    'deliverable', 'phase', 'kickoff', 'planning', 'resource',
    'dependency', 'risk', 'scope', 'budget',
    'project plan', 'timeline kya hai',
  ],
  interview: [
    'interview', 'candidate', 'resume', 'experience', 'qualification',
    'hiring', 'role', 'position', 'background', 'skill',
    'strength', 'weakness', 'salary', 'offer',
    'interview round', 'candidate kaisa laga',
  ],
  training: [
    'training', 'workshop', 'learn', 'module', 'exercise',
    'practice', 'onboarding', 'orientation', 'course', 'certification',
    'tutorial', 'hands-on', 'demo', 'session',
    'seekhna', 'training session', 'sikhao',
  ],
  board: [
    'board', 'director', 'shareholder', 'governance', 'fiduciary',
    'resolution', 'motion', 'vote', 'quorum', 'minutes',
    'quarterly', 'annual', 'audit', 'compliance', 'chairman',
    'board meeting', 'resolution pass',
  ],
};

/**
 * Detect the meeting type from transcript segments.
 * Analyzes the first 20% of segments for keyword matches.
 *
 * @param segments - Transcript segments
 * @returns Detected meeting type (defaults to 'team' if no strong match)
 */
export function detectMeetingType(segments: TranscriptSegment[]): MeetingType {
  if (segments.length === 0) return 'team';

  // Scan first 20% of segments
  const scanCount = Math.max(1, Math.ceil(segments.length * 0.2));
  const earlySegments = segments.slice(0, scanCount);

  // Combine text from early segments
  const combinedText = earlySegments
    .map((s) => (s.text_display || s.text).toLowerCase())
    .join(' ');

  // Score each meeting type
  const scores: Record<MeetingType, number> = {
    team: 0,
    client: 0,
    sales: 0,
    project: 0,
    interview: 0,
    training: 0,
    board: 0,
  };

  for (const [type, keywords] of Object.entries(MEETING_TYPE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (combinedText.includes(keyword)) {
        scores[type as MeetingType]++;
      }
    }
  }

  // Find the type with highest score
  let bestType: MeetingType = 'team';
  let bestScore = 0;

  for (const [type, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestType = type as MeetingType;
    }
  }

  return bestType;
}
