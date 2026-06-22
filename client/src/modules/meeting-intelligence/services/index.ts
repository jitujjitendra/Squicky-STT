/**
 * Meeting Intelligence Services - Barrel exports
 */

export { runMeetingAnalysis } from './MeetingAnalysisPipeline';
export type { MeetingAnalysisResult } from './MeetingAnalysisPipeline';
export { detectMeetingType } from './MeetingTypeDetector';
export { extractActionItems } from './ActionItemExtractor';
export { detectDecisions } from './DecisionDetector';
export { detectRisks } from './RiskDetector';
export { detectDeadlines } from './DeadlineDetector';
export { computeSpeakerStats } from './SpeakerAnalytics';
export { generateMeetingSummary } from './MeetingSummaryService';
