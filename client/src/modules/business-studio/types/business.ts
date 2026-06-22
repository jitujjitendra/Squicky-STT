/**
 * Business Studio Types
 *
 * Core type definitions for the business intelligence pipeline including
 * business modes, customer/sales/support intelligence, commitments,
 * follow-ups, CRM output, and the review workflow.
 *
 * Architecture decision: All intelligence is extracted client-side
 * using pattern matching. Items start as "suggested" and require
 * human confirmation before export (human-in-the-loop).
 */

import type { SpeakerId } from '@/modules/speech-engine/types';

// ─── Business Mode Detection ─────────────────────────────────────────────────

/** Supported business conversation modes with auto-detection */
export type BusinessMode =
  | 'sales-call'
  | 'customer-support'
  | 'discovery-call'
  | 'client-meeting'
  | 'internal-discussion'
  | 'project-review'
  | 'vendor-discussion'
  | 'recruitment-interview'
  | 'general-business';

// ─── Review Status ───────────────────────────────────────────────────────────

/** Human-in-the-loop review status */
export type ReviewStatus = 'suggested' | 'confirmed' | 'dismissed';

// ─── Severity & Priority ─────────────────────────────────────────────────────

/** Risk severity levels */
export type Severity = 'high' | 'medium' | 'low';

/** Priority levels */
export type Priority = 'high' | 'medium' | 'low';

/** Accountability level for commitments */
export type AccountabilityLevel = 'high' | 'medium' | 'low';

// ─── Customer Intelligence ───────────────────────────────────────────────────

/** Customer insight category */
export type CustomerInsightType = 'pain-point' | 'requirement' | 'expectation' | 'concern';

/**
 * A detected customer insight
 */
export interface CustomerInsight {
  /** Unique ID */
  id: string;
  /** Insight type */
  type: CustomerInsightType;
  /** Extracted text */
  text: string;
  /** Speaker who expressed this */
  speaker: string;
  /** Speaker ID if matched */
  speakerId?: SpeakerId;
  /** Review status */
  status: ReviewStatus;
  /** Source segment index */
  segmentIndex: number;
}

/**
 * Customer profile built from insights
 */
export interface CustomerProfile {
  /** Detected pain points */
  painPoints: CustomerInsight[];
  /** Requirements mentioned */
  requirements: CustomerInsight[];
  /** Expectations stated */
  expectations: CustomerInsight[];
  /** Concerns raised */
  concerns: CustomerInsight[];
}

// ─── Sales Intelligence ──────────────────────────────────────────────────────

/** Sales signal category */
export type SalesSignalType = 'objection' | 'buying-signal' | 'interest' | 'deal-risk';

/**
 * A detected sales signal
 */
export interface SalesSignal {
  /** Unique ID */
  id: string;
  /** Signal type */
  type: SalesSignalType;
  /** Extracted text */
  text: string;
  /** Speaker who expressed this */
  speaker: string;
  /** Speaker ID if matched */
  speakerId?: SpeakerId;
  /** Review status */
  status: ReviewStatus;
  /** Source segment index */
  segmentIndex: number;
}

// ─── Support Intelligence ────────────────────────────────────────────────────

/** Support signal category */
export type SupportSignalType = 'issue' | 'resolution' | 'escalation';

/**
 * A detected support signal
 */
export interface SupportSignal {
  /** Unique ID */
  id: string;
  /** Signal type */
  type: SupportSignalType;
  /** Extracted text */
  text: string;
  /** Speaker who expressed this */
  speaker: string;
  /** Speaker ID if matched */
  speakerId?: SpeakerId;
  /** Review status */
  status: ReviewStatus;
  /** Source segment index */
  segmentIndex: number;
}

// ─── Risks & Opportunities ──────────────────────────────────────────────────

/**
 * A detected business risk
 */
export interface BusinessRisk {
  /** Unique ID */
  id: string;
  /** Risk description text */
  text: string;
  /** Who raised the risk */
  raisedBy: string;
  /** Speaker ID if matched */
  raisedBySpkId?: SpeakerId;
  /** Severity level */
  severity: Severity;
  /** Review status */
  status: ReviewStatus;
  /** Source segment index */
  segmentIndex: number;
}

/**
 * A detected business opportunity
 */
export interface BusinessOpportunity {
  /** Unique ID */
  id: string;
  /** Opportunity description text */
  text: string;
  /** Who mentioned it */
  mentionedBy: string;
  /** Speaker ID if matched */
  mentionedBySpkId?: SpeakerId;
  /** Review status */
  status: ReviewStatus;
  /** Source segment index */
  segmentIndex: number;
}

// ─── Commitments ─────────────────────────────────────────────────────────────

/** Commitment scope */
export type CommitmentScope = 'external' | 'internal';

/**
 * A detected commitment
 */
export interface Commitment {
  /** Unique ID */
  id: string;
  /** Commitment text */
  text: string;
  /** Who made the commitment */
  madeBy: string;
  /** Speaker ID if matched */
  madeBySpkId?: SpeakerId;
  /** Scope: external (to client) or internal */
  scope: CommitmentScope;
  /** Accountability level (external = high) */
  accountability: AccountabilityLevel;
  /** Review status */
  status: ReviewStatus;
  /** Source segment index */
  segmentIndex: number;
}

// ─── Follow-Ups ─────────────────────────────────────────────────────────────

/**
 * A detected follow-up item
 */
export interface FollowUp {
  /** Unique ID */
  id: string;
  /** Who is responsible */
  who: string;
  /** What they need to do */
  what: string;
  /** By when (raw text) */
  when?: string;
  /** Full text of the follow-up */
  text: string;
  /** Whether this is an open question */
  isOpenQuestion: boolean;
  /** Speaker ID if matched */
  speakerId?: SpeakerId;
  /** Review status */
  status: ReviewStatus;
  /** Source segment index */
  segmentIndex: number;
}

// ─── CRM Output ─────────────────────────────────────────────────────────────

/**
 * CRM-ready output (Salesforce/HubSpot style)
 */
export interface CrmOutput {
  /** Call summary paragraph */
  callSummary: string;
  /** Customer profile summary */
  customerProfile: string;
  /** Deal status assessment */
  dealStatus: string;
  /** Key action items as CRM notes */
  nextSteps: string[];
  /** Full CRM note (copy-paste ready) */
  fullNote: string;
}

// ─── Interview Intelligence ──────────────────────────────────────────────────

/**
 * Interview intelligence for recruitment mode
 */
export interface InterviewIntelligence {
  /** Candidate strengths detected */
  strengths: string[];
  /** Candidate concerns */
  concerns: string[];
  /** Skills mentioned (pattern matched) */
  skillsDetected: string[];
}

// ─── Analytics ───────────────────────────────────────────────────────────────

/**
 * Business conversation analytics
 */
export interface BusinessAnalytics {
  /** Duration in seconds */
  durationSeconds: number;
  /** Number of speakers */
  speakerCount: number;
  /** Risk count */
  riskCount: number;
  /** Opportunity count */
  opportunityCount: number;
  /** Commitment count */
  commitmentCount: number;
  /** Follow-up count */
  followUpCount: number;
}

// ─── Store State ─────────────────────────────────────────────────────────────

/**
 * Business Studio store state
 */
export interface BusinessStudioState {
  /** Detected business mode */
  businessMode: BusinessMode | null;
  /** Customer profile (pain points, requirements, expectations, concerns) */
  customerProfile: CustomerProfile;
  /** Sales signals */
  salesInsights: SalesSignal[];
  /** Support signals */
  supportInsights: SupportSignal[];
  /** Business risks */
  risks: BusinessRisk[];
  /** Business opportunities */
  opportunities: BusinessOpportunity[];
  /** Commitments */
  commitments: Commitment[];
  /** Follow-ups */
  followUps: FollowUp[];
  /** Interview intelligence (only populated for recruitment mode) */
  interviewIntelligence: InterviewIntelligence | null;
  /** CRM output */
  crmOutput: CrmOutput | null;
  /** Business analytics */
  analytics: BusinessAnalytics | null;
  /** Executive summary sentences */
  executiveSummary: string[];
  /** Whether analysis is in progress */
  isAnalyzing: boolean;
  /** Error message */
  error: string | null;

  // Actions
  setBusinessMode: (mode: BusinessMode | null) => void;
  setCustomerProfile: (profile: CustomerProfile) => void;
  setSalesInsights: (insights: SalesSignal[]) => void;
  setSupportInsights: (insights: SupportSignal[]) => void;
  setRisks: (risks: BusinessRisk[]) => void;
  setOpportunities: (opportunities: BusinessOpportunity[]) => void;
  setCommitments: (commitments: Commitment[]) => void;
  setFollowUps: (followUps: FollowUp[]) => void;
  setInterviewIntelligence: (intel: InterviewIntelligence | null) => void;
  setCrmOutput: (output: CrmOutput | null) => void;
  setAnalytics: (analytics: BusinessAnalytics | null) => void;
  setExecutiveSummary: (sentences: string[]) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setError: (error: string | null) => void;
  updateItemStatus: (
    category: 'customerInsights' | 'salesInsights' | 'supportInsights' | 'risks' | 'opportunities' | 'commitments' | 'followUps',
    id: string,
    status: ReviewStatus
  ) => void;
  reset: () => void;
}
