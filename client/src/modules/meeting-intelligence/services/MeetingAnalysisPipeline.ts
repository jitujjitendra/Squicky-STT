/**
 * Meeting Analysis Pipeline
 *
 * Orchestrates the full meeting intelligence extraction pipeline:
 * 1. Context Detection (meeting type)
 * 2. Topic Segmentation (reuse cache if available)
 * 3. Intelligence Extraction (action items, decisions, risks, deadlines - parallel)
 * 4. Speaker Analytics
 * 5. Summary Generation
 *
 * Architecture decision: A single entry point that runs all extraction
 * steps and returns the complete analysis result. Steps that do not depend
 * on each other run in parallel for performance.
 */

import type { StandardTranscript } from '@/modules/speech-engine/types';
import type { ActionItem, Decision, Risk, Deadline, SpeakerStats, MeetingSummary, MeetingType } from '../types';
import { detectMeetingType } from './MeetingTypeDetector';
import { extractActionItems } from './ActionItemExtractor';
import { detectDecisions } from './DecisionDetector';
import { detectRisks } from './RiskDetector';
import { detectDeadlines } from './DeadlineDetector';
import { computeSpeakerStats } from './SpeakerAnalytics';
import { generateMeetingSummary } from './MeetingSummaryService';

/**
 * Complete meeting analysis result
 */
export interface MeetingAnalysisResult {
  meetingType: MeetingType;
  actionItems: ActionItem[];
  decisions: Decision[];
  risks: Risk[];
  deadlines: Deadline[];
  speakerStats: SpeakerStats[];
  summary: MeetingSummary;
}

/**
 * Deduplicate extracted items by segment index.
 * If multiple items are extracted from the same segment (e.g., both EN and HI
 * patterns match), only the first match is kept. This prevents duplicate items
 * in the UI when Hinglish code-mixed sentences trigger both pattern sets.
 */
function deduplicateBySegment<T extends { segmentIndex: number }>(items: T[]): T[] {
  const seen = new Set<number>();
  return items.filter((item) => {
    if (seen.has(item.segmentIndex)) return false;
    seen.add(item.segmentIndex);
    return true;
  });
}

/**
 * Run the full meeting analysis pipeline.
 *
 * Pipeline flow:
 * Transcript -> Context Detection -> Intelligence Extraction (parallel) -> Attribution -> Output
 *
 * @param transcript - The standard transcript to analyze
 * @returns Complete meeting analysis result
 */
export function runMeetingAnalysis(transcript: StandardTranscript): MeetingAnalysisResult {
  const segments = transcript.segments;
  const speakers = transcript.speakers.entries;

  // Step 1: Context Detection (meeting type)
  const meetingType = detectMeetingType(segments);

  // Step 2-3: Intelligence Extraction (all run on same data, conceptually parallel)
  const actionItems = deduplicateBySegment(extractActionItems(segments, speakers));
  const decisions = deduplicateBySegment(detectDecisions(segments, speakers));
  const risks = deduplicateBySegment(detectRisks(segments, speakers));
  const deadlines = detectDeadlines(segments);

  // Step 4: Speaker Analytics
  const speakerStats = computeSpeakerStats(transcript);

  // Step 5: Summary Generation (uses ContentIntelligenceCache)
  const summary = generateMeetingSummary(transcript, meetingType);

  // Link deadlines to action items where context matches
  linkDeadlinesToActionItems(deadlines, actionItems);

  return {
    meetingType,
    actionItems,
    decisions,
    risks,
    deadlines,
    speakerStats,
    summary,
  };
}

/**
 * Link detected deadlines to action items when they share the same segment
 */
function linkDeadlinesToActionItems(deadlines: Deadline[], actionItems: ActionItem[]): void {
  for (const deadline of deadlines) {
    const matchingAction = actionItems.find((ai) => ai.segmentIndex === deadline.segmentIndex);
    if (matchingAction) {
      deadline.actionItemId = matchingAction.id;
      // Also set the deadline text on the action item
      if (!matchingAction.deadlineRaw) {
        matchingAction.deadlineRaw = deadline.rawText;
      }
    }
  }
}
