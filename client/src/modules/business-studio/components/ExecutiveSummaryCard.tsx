/**
 * Executive Summary Card
 *
 * Displays the top-level summary of the business conversation
 * including mode, analytics, and key summary sentences.
 */

import React from 'react';
import { Badge } from '@/shared/components';
import { useBusinessStudioStore } from '../store';
import type { BusinessMode } from '../types';

/** Mode display labels */
const MODE_LABELS: Record<BusinessMode, string> = {
  'sales-call': 'Sales Call',
  'customer-support': 'Customer Support',
  'discovery-call': 'Discovery Call',
  'client-meeting': 'Client Meeting',
  'internal-discussion': 'Internal Discussion',
  'project-review': 'Project Review',
  'vendor-discussion': 'Vendor Discussion',
  'recruitment-interview': 'Recruitment Interview',
  'general-business': 'General Business',
};

export function ExecutiveSummaryCard() {
  const businessMode = useBusinessStudioStore((s) => s.businessMode);
  const analytics = useBusinessStudioStore((s) => s.analytics);
  const executiveSummary = useBusinessStudioStore((s) => s.executiveSummary);

  if (!businessMode || !analytics) return null;

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
          Executive Summary
        </h2>
        <Badge variant="default">{MODE_LABELS[businessMode]}</Badge>
      </div>

      {/* Analytics row */}
      <div className="flex flex-wrap gap-4 text-xs text-neutral-500 dark:text-neutral-400">
        <span>Duration: {formatDuration(analytics.durationSeconds)}</span>
        <span>Speakers: {analytics.speakerCount}</span>
        <span>Risks: {analytics.riskCount}</span>
        <span>Opportunities: {analytics.opportunityCount}</span>
        <span>Commitments: {analytics.commitmentCount}</span>
        <span>Follow-ups: {analytics.followUpCount}</span>
      </div>

      {/* Summary sentences */}
      {executiveSummary.length > 0 && (
        <div className="space-y-1">
          {executiveSummary.map((sentence, idx) => (
            <p key={idx} className="text-sm text-neutral-700 dark:text-neutral-300">
              {sentence}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
