/**
 * useMeetingExport Hook
 *
 * Exports confirmed meeting intelligence items for use by the Export Center.
 * Only items with status "confirmed" are included in the export payload.
 *
 * Export format:
 * - source_module: 'meeting-intelligence'
 * - Only confirmed action items, decisions, risks, deadlines
 */

import { useCallback } from 'react';
import { useMeetingIntelligenceStore } from '../store';

/**
 * Export data structure for meeting intelligence
 */
export interface MeetingExportPayload {
  source_module: 'meeting-intelligence';
  meetingType: string | null;
  actionItems: Array<{ task: string; assignee: string; deadlineRaw?: string; priority: string }>;
  decisions: Array<{ text: string; madeBy: string; confidence: string }>;
  risks: Array<{ text: string; raisedBy: string; severity: string }>;
  deadlines: Array<{ rawText: string; context: string }>;
  summary: string[];
}

/**
 * Hook to export confirmed meeting intelligence items
 */
export function useMeetingExport() {
  const actionItems = useMeetingIntelligenceStore((s) => s.actionItems);
  const decisions = useMeetingIntelligenceStore((s) => s.decisions);
  const risks = useMeetingIntelligenceStore((s) => s.risks);
  const deadlines = useMeetingIntelligenceStore((s) => s.deadlines);
  const summary = useMeetingIntelligenceStore((s) => s.summary);
  const meetingType = useMeetingIntelligenceStore((s) => s.meetingType);

  const getExportPayload = useCallback((): MeetingExportPayload => {
    return {
      source_module: 'meeting-intelligence',
      meetingType,
      actionItems: actionItems
        .filter((item) => item.status === 'confirmed')
        .map((item) => ({
          task: item.task,
          assignee: item.assignee,
          deadlineRaw: item.deadlineRaw,
          priority: item.priority,
        })),
      decisions: decisions
        .filter((d) => d.status === 'confirmed')
        .map((d) => ({
          text: d.text,
          madeBy: d.madeBy,
          confidence: d.confidence,
        })),
      risks: risks
        .filter((r) => r.status === 'confirmed')
        .map((r) => ({
          text: r.text,
          raisedBy: r.raisedBy,
          severity: r.severity,
        })),
      deadlines: deadlines
        .filter((dl) => dl.status === 'confirmed')
        .map((dl) => ({
          rawText: dl.rawText,
          context: dl.context,
        })),
      summary: summary?.sentences || [],
    };
  }, [actionItems, decisions, risks, deadlines, summary, meetingType]);

  const hasConfirmedItems = actionItems.some((i) => i.status === 'confirmed')
    || decisions.some((d) => d.status === 'confirmed')
    || risks.some((r) => r.status === 'confirmed')
    || deadlines.some((dl) => dl.status === 'confirmed');

  return {
    getExportPayload,
    hasConfirmedItems,
  };
}
