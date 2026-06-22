/**
 * Meeting Intelligence Types
 *
 * Core type definitions for the meeting analysis pipeline including
 * action items, decisions, risks, deadlines, speaker analytics,
 * and the review workflow.
 *
 * Architecture decision: All intelligence is extracted client-side
 * using pattern matching. Items start as "suggested" and require
 * human confirmation before export (human-in-the-loop).
 */

import type { SpeakerId } from '@/modules/speech-engine/types';

// ─── Meeting Type Detection ──────────────────────────────────────────────────

/** Supported meeting types with auto-detection */
export type MeetingType =
  | 'team'
  | 'client'
  | 'sales'
  | 'project'
  | 'interview'
  | 'training'
  | 'board';

// ─── Review Status ───────────────────────────────────────────────────────────

/** Human-in-the-loop review status */
export type ReviewStatus = 'suggested' | 'confirmed' | 'dismissed';

// ─── Priority & Severity ─────────────────────────────────────────────────────

/** Action item priority levels */
export type Priority = 'urgent' | 'normal' | 'low';

/** Risk severity levels */
export type Severity = 'high' | 'medium' | 'low';

/** Decision confidence levels */
export type Confidence = 'high' | 'medium' | 'low';

// ─── Action Item ─────────────────────────────────────────────────────────────

/**
 * An extracted action item from the meeting
 */
export interface ActionItem {
  /** Unique ID */
  id: string;
  /** Task description text */
  task: string;
  /** Assigned person (speaker display name or "Unassigned") */
  assignee: string;
  /** Speaker ID if matched */
  assigneeSpeakerId?: SpeakerId;
  /** Raw deadline text (no date resolution at Stage 1) */
  deadlineRaw?: string;
  /** Priority level */
  priority: Priority;
  /** Review status */
  status: ReviewStatus;
  /** Source segment index */
  segmentIndex: number;
}

// ─── Decision ────────────────────────────────────────────────────────────────

/**
 * A detected decision from the meeting
 */
export interface Decision {
  /** Unique ID */
  id: string;
  /** Decision text */
  text: string;
  /** Who made/announced the decision */
  madeBy: string;
  /** Speaker ID if matched */
  madeBySpkId?: SpeakerId;
  /** Confidence level */
  confidence: Confidence;
  /** Review status */
  status: ReviewStatus;
  /** Source segment index */
  segmentIndex: number;
}

// ─── Risk ────────────────────────────────────────────────────────────────────

/**
 * A detected risk or blocker
 */
export interface Risk {
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

// ─── Deadline ────────────────────────────────────────────────────────────────

/**
 * A detected deadline reference
 */
export interface Deadline {
  /** Unique ID */
  id: string;
  /** Raw deadline text (e.g., "by Friday", "kal tak") */
  rawText: string;
  /** Context sentence where deadline was found */
  context: string;
  /** Associated action item ID, if any */
  actionItemId?: string;
  /** Review status */
  status: ReviewStatus;
  /** Source segment index */
  segmentIndex: number;
}

// ─── Speaker Analytics ───────────────────────────────────────────────────────

/**
 * Per-speaker statistics
 */
export interface SpeakerStats {
  /** Speaker ID */
  speakerId: SpeakerId;
  /** Display name */
  displayName: string;
  /** Total speaking time in seconds */
  speakingTime: number;
  /** Number of segments spoken */
  segmentCount: number;
  /** Participation percentage (0-100) */
  participationPercent: number;
  /** Number of questions asked */
  questionsAsked: number;
}

// ─── Meeting Summary ─────────────────────────────────────────────────────────

/**
 * Meeting summary derived from TextRank
 */
export interface MeetingSummary {
  /** Top sentences forming the summary */
  sentences: string[];
  /** Overall meeting duration in seconds */
  durationSeconds: number;
  /** Number of participants */
  participantCount: number;
  /** Detected meeting type */
  meetingType: MeetingType;
}

// ─── Store State ─────────────────────────────────────────────────────────────

/**
 * Meeting Intelligence store state
 */
export interface MeetingIntelligenceState {
  /** Detected meeting type */
  meetingType: MeetingType | null;
  /** Extracted action items */
  actionItems: ActionItem[];
  /** Detected decisions */
  decisions: Decision[];
  /** Detected risks */
  risks: Risk[];
  /** Detected deadlines */
  deadlines: Deadline[];
  /** Meeting summary */
  summary: MeetingSummary | null;
  /** Per-speaker analytics */
  speakerStats: SpeakerStats[];
  /** Whether analysis is in progress */
  isAnalyzing: boolean;
  /** Error message */
  error: string | null;

  // Actions
  setMeetingType: (type: MeetingType | null) => void;
  setActionItems: (items: ActionItem[]) => void;
  setDecisions: (decisions: Decision[]) => void;
  setRisks: (risks: Risk[]) => void;
  setDeadlines: (deadlines: Deadline[]) => void;
  setSummary: (summary: MeetingSummary | null) => void;
  setSpeakerStats: (stats: SpeakerStats[]) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setError: (error: string | null) => void;
  updateItemStatus: (category: 'actionItems' | 'decisions' | 'risks' | 'deadlines', id: string, status: ReviewStatus) => void;
  reset: () => void;
}
