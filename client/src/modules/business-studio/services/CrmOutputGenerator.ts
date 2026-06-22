/**
 * CRM Output Generator
 *
 * Generates CRM-ready output (Salesforce/HubSpot style) from
 * business analysis results. Produces copy-paste-ready notes
 * including call summary, customer profile, deal status, and next steps.
 *
 * Architecture decision: Only includes confirmed items in CRM output.
 * Generates a structured full note that can be pasted directly into CRM.
 */

import type {
  BusinessMode,
  CustomerProfile,
  SalesSignal,
  SupportSignal,
  Commitment,
  FollowUp,
  CrmOutput,
} from '../types';

/** Mode labels for CRM output */
const MODE_LABELS: Record<BusinessMode, string> = {
  'sales-call': 'Sales Call',
  'customer-support': 'Customer Support',
  'discovery-call': 'Discovery Call',
  'client-meeting': 'Client Meeting',
  'internal-discussion': 'Internal Discussion',
  'project-review': 'Project Review',
  'vendor-discussion': 'Vendor Discussion',
  'recruitment-interview': 'Recruitment Interview',
  'general-business': 'Business Call',
};

/**
 * Generate a call summary paragraph from analysis data
 */
function generateCallSummary(
  mode: BusinessMode,
  summaryLines: string[],
  speakerCount: number
): string {
  const modeLabel = MODE_LABELS[mode];
  const participantText = speakerCount > 0
    ? `${speakerCount} participant${speakerCount > 1 ? 's' : ''}`
    : 'participants';

  if (summaryLines.length === 0) {
    return `${modeLabel} with ${participantText}. No key points extracted.`;
  }

  const keyPoints = summaryLines.slice(0, 3).join(' ');
  return `${modeLabel} with ${participantText}. ${keyPoints}`;
}

/**
 * Generate customer profile summary
 */
function generateCustomerProfile(profile: CustomerProfile): string {
  const parts: string[] = [];

  const confirmedPainPoints = profile.painPoints.filter((p) => p.status === 'confirmed');
  const confirmedRequirements = profile.requirements.filter((r) => r.status === 'confirmed');
  const confirmedExpectations = profile.expectations.filter((e) => e.status === 'confirmed');

  if (confirmedPainPoints.length > 0) {
    parts.push(`Pain Points: ${confirmedPainPoints.map((p) => p.text).join('; ')}`);
  }
  if (confirmedRequirements.length > 0) {
    parts.push(`Requirements: ${confirmedRequirements.map((r) => r.text).join('; ')}`);
  }
  if (confirmedExpectations.length > 0) {
    parts.push(`Expectations: ${confirmedExpectations.map((e) => e.text).join('; ')}`);
  }

  return parts.length > 0 ? parts.join('\n') : 'No confirmed customer insights.';
}

/**
 * Generate deal status assessment from sales signals
 */
function generateDealStatus(salesInsights: SalesSignal[]): string {
  const confirmed = salesInsights.filter((s) => s.status === 'confirmed');
  const buyingSignals = confirmed.filter((s) => s.type === 'buying-signal');
  const objections = confirmed.filter((s) => s.type === 'objection');
  const dealRisks = confirmed.filter((s) => s.type === 'deal-risk');
  const interest = confirmed.filter((s) => s.type === 'interest');

  if (buyingSignals.length > 0 && objections.length === 0) {
    return 'Strong buying intent detected. Ready to close.';
  }
  if (buyingSignals.length > 0 && objections.length > 0) {
    return 'Mixed signals - buying intent present but objections raised. Address concerns.';
  }
  if (objections.length > 0 && dealRisks.length > 0) {
    return 'At risk - multiple objections and deal risk signals detected.';
  }
  if (interest.length > 0) {
    return 'Engaged - interest shown but no buying signals yet. Continue nurturing.';
  }
  if (objections.length > 0) {
    return 'Objections raised. Follow up to address concerns.';
  }
  return 'Status unclear - insufficient signals for assessment.';
}

/**
 * Generate next steps from confirmed commitments and follow-ups
 */
function generateNextSteps(
  commitments: Commitment[],
  followUps: FollowUp[]
): string[] {
  const steps: string[] = [];

  const confirmedCommitments = commitments.filter((c) => c.status === 'confirmed');
  const confirmedFollowUps = followUps.filter((f) => f.status === 'confirmed' && !f.isOpenQuestion);

  for (const commitment of confirmedCommitments) {
    steps.push(`[${commitment.madeBy}] ${commitment.text}`);
  }
  for (const followUp of confirmedFollowUps) {
    const whenPart = followUp.when ? ` (by ${followUp.when})` : '';
    steps.push(`[${followUp.who}] ${followUp.what}${whenPart}`);
  }

  return steps.length > 0 ? steps : ['No confirmed action items.'];
}

/**
 * Generate full CRM note (copy-paste ready)
 */
function generateFullNote(
  callSummary: string,
  customerProfile: string,
  dealStatus: string,
  nextSteps: string[],
  mode: BusinessMode
): string {
  const lines: string[] = [];
  const modeLabel = MODE_LABELS[mode];
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  lines.push(`--- ${modeLabel} Notes (${date}) ---`);
  lines.push('');
  lines.push('SUMMARY:');
  lines.push(callSummary);
  lines.push('');

  if (customerProfile !== 'No confirmed customer insights.') {
    lines.push('CUSTOMER PROFILE:');
    lines.push(customerProfile);
    lines.push('');
  }

  if (mode === 'sales-call' || mode === 'discovery-call') {
    lines.push('DEAL STATUS:');
    lines.push(dealStatus);
    lines.push('');
  }

  lines.push('NEXT STEPS:');
  for (const step of nextSteps) {
    lines.push(`- ${step}`);
  }

  return lines.join('\n');
}

/**
 * Parameters for CRM output generation
 */
export interface CrmGeneratorParams {
  mode: BusinessMode;
  summaryLines: string[];
  speakerCount: number;
  customerProfile: CustomerProfile;
  salesInsights: SalesSignal[];
  supportInsights: SupportSignal[];
  commitments: Commitment[];
  followUps: FollowUp[];
}

/**
 * Generate CRM output from business analysis results.
 * Only includes confirmed items.
 *
 * @param params - Analysis parameters
 * @returns CRM-ready output structure
 */
export function generateCrmOutput(params: CrmGeneratorParams): CrmOutput {
  const {
    mode,
    summaryLines,
    speakerCount,
    customerProfile,
    salesInsights,
    commitments,
    followUps,
  } = params;

  const callSummary = generateCallSummary(mode, summaryLines, speakerCount);
  const customerProfileText = generateCustomerProfile(customerProfile);
  const dealStatus = generateDealStatus(salesInsights);
  const nextSteps = generateNextSteps(commitments, followUps);
  const fullNote = generateFullNote(callSummary, customerProfileText, dealStatus, nextSteps, mode);

  return {
    callSummary,
    customerProfile: customerProfileText,
    dealStatus,
    nextSteps,
    fullNote,
  };
}
