/**
 * Business Studio Module - Barrel exports
 *
 * Business intelligence pipeline for conversation analysis.
 * Extracts customer insights, sales signals, support intelligence,
 * risks, opportunities, commitments, and CRM-ready outputs.
 */

export { BusinessStudioPage } from './BusinessStudioPage';
export { useBusinessStudioStore } from './store';
export type {
  BusinessMode,
  CustomerProfile,
  SalesSignal,
  SupportSignal,
  BusinessRisk,
  BusinessOpportunity,
  Commitment,
  FollowUp,
  CrmOutput,
  InterviewIntelligence,
  BusinessAnalytics,
} from './types';
