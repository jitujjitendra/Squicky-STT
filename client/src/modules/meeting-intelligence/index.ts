/**
 * Meeting Intelligence Module - Barrel exports
 *
 * Provides meeting analysis including action item extraction, decision
 * detection, risk assessment, deadline detection, and speaker analytics.
 */

export { MeetingIntelligencePage } from './MeetingIntelligencePage';
export { useMeetingIntelligenceStore } from './store';
export type {
  MeetingType,
  ReviewStatus,
  Priority,
  Severity,
  Confidence,
  ActionItem,
  Decision,
  Risk,
  Deadline,
  SpeakerStats,
  MeetingSummary,
  MeetingIntelligenceState,
} from './types';
export { runMeetingAnalysis } from './services';
export type { MeetingAnalysisResult } from './services';
