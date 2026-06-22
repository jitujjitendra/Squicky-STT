/**
 * Business Analysis Pipeline
 *
 * Orchestrates the full business intelligence extraction pipeline:
 * 1. Mode Detection (auto-detect from first 20% of segments)
 * 2. Conversation Analysis (reuse ContentIntelligenceCache)
 * 3. Business Insight Extraction (customer/sales/support - parallel)
 * 4. Risk & Opportunity Detection
 * 5. Commitment Detection
 * 6. Follow-Up Extraction
 * 7. Interview Intelligence (if recruitment mode)
 * 8. Attribution & Output
 *
 * Architecture decision: A single entry point that runs all extraction
 * steps and returns the complete analysis result. Uses ContentIntelligenceCache
 * for topic/keyword/summary data. 100% client-side processing.
 */

import type { StandardTranscript } from '@/modules/speech-engine/types';
import { ContentIntelligenceCache } from '@/modules/content-studio/services/ContentIntelligenceCache';
import type {
  BusinessMode,
  CustomerProfile,
  SalesSignal,
  SupportSignal,
  BusinessRisk,
  BusinessOpportunity,
  Commitment,
  FollowUp,
  InterviewIntelligence,
  BusinessAnalytics,
} from '../types';
import { detectBusinessMode } from './BusinessModeDetector';
import { extractCustomerInsights } from './CustomerIntelligence';
import { extractSalesSignals } from './SalesIntelligence';
import { extractSupportSignals } from './SupportIntelligence';
import { detectBusinessRisks, detectBusinessOpportunities } from './RiskOpportunityDetector';
import { detectCommitments } from './CommitmentDetector';
import { extractFollowUps } from './FollowUpExtractor';
import { extractInterviewIntelligence } from './InterviewIntelligenceService';

/**
 * Complete business analysis result
 */
export interface BusinessAnalysisResult {
  businessMode: BusinessMode;
  customerProfile: CustomerProfile;
  salesInsights: SalesSignal[];
  supportInsights: SupportSignal[];
  risks: BusinessRisk[];
  opportunities: BusinessOpportunity[];
  commitments: Commitment[];
  followUps: FollowUp[];
  interviewIntelligence: InterviewIntelligence | null;
  analytics: BusinessAnalytics;
  executiveSummary: string[];
}

/**
 * Deduplicate extracted items by segment index.
 * If multiple items are extracted from the same segment, keep only the first.
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
 * Run the full business analysis pipeline.
 *
 * Pipeline flow:
 * Transcript -> Mode Detection -> Conversation Analysis -> Business Insight Extraction
 * -> Attribution -> Output
 *
 * @param transcript - The standard transcript to analyze
 * @returns Complete business analysis result
 */
export function runBusinessAnalysis(transcript: StandardTranscript): BusinessAnalysisResult {
  const segments = transcript.segments;
  const speakers = transcript.speakers.entries;

  // Step 1: Ensure ContentIntelligenceCache is populated
  if (!ContentIntelligenceCache.isPopulated(transcript.id) || ContentIntelligenceCache.isStale()) {
    ContentIntelligenceCache.populate(transcript);
  }

  // Step 2: Mode Detection
  const businessMode = detectBusinessMode(segments);

  // Step 3: Business Insight Extraction (conceptually parallel)
  const customerProfile = extractCustomerInsights(segments, speakers);
  const salesInsights = deduplicateBySegment(extractSalesSignals(segments, speakers));
  const supportInsights = deduplicateBySegment(extractSupportSignals(segments, speakers));

  // Step 4: Risk & Opportunity Detection
  const risks = deduplicateBySegment(detectBusinessRisks(segments, speakers));
  const opportunities = deduplicateBySegment(detectBusinessOpportunities(segments, speakers));

  // Step 5: Commitment Detection
  const commitments = deduplicateBySegment(detectCommitments(segments, speakers));

  // Step 6: Follow-Up Extraction
  const followUps = deduplicateBySegment(extractFollowUps(segments, speakers));

  // Step 7: Interview Intelligence (only for recruitment mode)
  let interviewIntelligence: InterviewIntelligence | null = null;
  if (businessMode === 'recruitment-interview') {
    interviewIntelligence = extractInterviewIntelligence(segments);
  }

  // Step 8: Analytics & Executive Summary
  const durationSeconds = computeDuration(transcript);
  const analytics: BusinessAnalytics = {
    durationSeconds,
    speakerCount: speakers.length,
    riskCount: risks.length,
    opportunityCount: opportunities.length,
    commitmentCount: commitments.length,
    followUpCount: followUps.length,
  };

  // Generate executive summary from ContentIntelligenceCache
  const cachedSummary = ContentIntelligenceCache.getSummary(5);
  const executiveSummary = cachedSummary
    ? cachedSummary.map((s) => s.text)
    : [];

  return {
    businessMode,
    customerProfile,
    salesInsights,
    supportInsights,
    risks,
    opportunities,
    commitments,
    followUps,
    interviewIntelligence,
    analytics,
    executiveSummary,
  };
}

/**
 * Compute total duration from transcript segments
 */
function computeDuration(transcript: StandardTranscript): number {
  const segments = transcript.segments;
  if (segments.length === 0) return 0;

  const lastSegment = segments[segments.length - 1]!;
  const firstSegment = segments[0]!;

  const end = lastSegment.end_time ?? lastSegment.start_time;
  const start = firstSegment.start_time;

  return Math.max(0, end - start);
}
