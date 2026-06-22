/**
 * useBusinessExport Hook
 *
 * Exports confirmed business intelligence items for use by the Export Center.
 * Only items with status "confirmed" are included in the export payload.
 *
 * Export format:
 * - source_module: 'business-studio'
 * - Only confirmed items across all categories
 */

import { useCallback } from 'react';
import { useBusinessStudioStore } from '../store';
import { generateCrmOutput } from '../services/CrmOutputGenerator';

/**
 * Export data structure for business intelligence
 */
export interface BusinessExportPayload {
  source_module: 'business-studio';
  businessMode: string | null;
  customerInsights: {
    painPoints: Array<{ text: string; speaker: string }>;
    requirements: Array<{ text: string; speaker: string }>;
    expectations: Array<{ text: string; speaker: string }>;
    concerns: Array<{ text: string; speaker: string }>;
  };
  salesSignals: Array<{ type: string; text: string; speaker: string }>;
  supportSignals: Array<{ type: string; text: string; speaker: string }>;
  risks: Array<{ text: string; raisedBy: string; severity: string }>;
  opportunities: Array<{ text: string; mentionedBy: string }>;
  commitments: Array<{ text: string; madeBy: string; scope: string; accountability: string }>;
  followUps: Array<{ who: string; what: string; when?: string }>;
  crmNote: string;
}

/**
 * Hook to export confirmed business intelligence items
 */
export function useBusinessExport() {
  const businessMode = useBusinessStudioStore((s) => s.businessMode);
  const customerProfile = useBusinessStudioStore((s) => s.customerProfile);
  const salesInsights = useBusinessStudioStore((s) => s.salesInsights);
  const supportInsights = useBusinessStudioStore((s) => s.supportInsights);
  const risks = useBusinessStudioStore((s) => s.risks);
  const opportunities = useBusinessStudioStore((s) => s.opportunities);
  const commitments = useBusinessStudioStore((s) => s.commitments);
  const followUps = useBusinessStudioStore((s) => s.followUps);
  const executiveSummary = useBusinessStudioStore((s) => s.executiveSummary);
  const analytics = useBusinessStudioStore((s) => s.analytics);

  const getExportPayload = useCallback((): BusinessExportPayload => {
    // Generate CRM output from confirmed items
    const crmOutput = businessMode
      ? generateCrmOutput({
          mode: businessMode,
          summaryLines: executiveSummary,
          speakerCount: analytics?.speakerCount ?? 0,
          customerProfile,
          salesInsights,
          supportInsights,
          commitments,
          followUps,
        })
      : null;

    return {
      source_module: 'business-studio',
      businessMode,
      customerInsights: {
        painPoints: customerProfile.painPoints
          .filter((p) => p.status === 'confirmed')
          .map((p) => ({ text: p.text, speaker: p.speaker })),
        requirements: customerProfile.requirements
          .filter((r) => r.status === 'confirmed')
          .map((r) => ({ text: r.text, speaker: r.speaker })),
        expectations: customerProfile.expectations
          .filter((e) => e.status === 'confirmed')
          .map((e) => ({ text: e.text, speaker: e.speaker })),
        concerns: customerProfile.concerns
          .filter((c) => c.status === 'confirmed')
          .map((c) => ({ text: c.text, speaker: c.speaker })),
      },
      salesSignals: salesInsights
        .filter((s) => s.status === 'confirmed')
        .map((s) => ({ type: s.type, text: s.text, speaker: s.speaker })),
      supportSignals: supportInsights
        .filter((s) => s.status === 'confirmed')
        .map((s) => ({ type: s.type, text: s.text, speaker: s.speaker })),
      risks: risks
        .filter((r) => r.status === 'confirmed')
        .map((r) => ({ text: r.text, raisedBy: r.raisedBy, severity: r.severity })),
      opportunities: opportunities
        .filter((o) => o.status === 'confirmed')
        .map((o) => ({ text: o.text, mentionedBy: o.mentionedBy })),
      commitments: commitments
        .filter((c) => c.status === 'confirmed')
        .map((c) => ({
          text: c.text,
          madeBy: c.madeBy,
          scope: c.scope,
          accountability: c.accountability,
        })),
      followUps: followUps
        .filter((f) => f.status === 'confirmed' && !f.isOpenQuestion)
        .map((f) => ({ who: f.who, what: f.what, when: f.when })),
      crmNote: crmOutput?.fullNote ?? '',
    };
  }, [
    businessMode, customerProfile, salesInsights, supportInsights,
    risks, opportunities, commitments, followUps, executiveSummary, analytics,
  ]);

  const hasConfirmedItems =
    customerProfile.painPoints.some((p) => p.status === 'confirmed')
    || customerProfile.requirements.some((r) => r.status === 'confirmed')
    || customerProfile.expectations.some((e) => e.status === 'confirmed')
    || customerProfile.concerns.some((c) => c.status === 'confirmed')
    || salesInsights.some((s) => s.status === 'confirmed')
    || supportInsights.some((s) => s.status === 'confirmed')
    || risks.some((r) => r.status === 'confirmed')
    || opportunities.some((o) => o.status === 'confirmed')
    || commitments.some((c) => c.status === 'confirmed')
    || followUps.some((f) => f.status === 'confirmed');

  return {
    getExportPayload,
    hasConfirmedItems,
  };
}
