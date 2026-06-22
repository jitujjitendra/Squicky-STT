/**
 * Customer Insights Panel
 *
 * Displays detected customer intelligence: pain points, requirements,
 * expectations, and concerns with review controls.
 */

import React from 'react';
import { Button, Badge } from '@/shared/components';
import { useBusinessStudioStore } from '../store';
import type { CustomerInsight, CustomerInsightType, ReviewStatus } from '../types';

/** Type labels */
const TYPE_LABELS: Record<CustomerInsightType, string> = {
  'pain-point': 'Pain Point',
  'requirement': 'Requirement',
  'expectation': 'Expectation',
  'concern': 'Concern',
};

/** Type badge variants */
const TYPE_VARIANT: Record<CustomerInsightType, 'error' | 'warning' | 'default' | 'privacy'> = {
  'pain-point': 'error',
  'requirement': 'default',
  'expectation': 'warning',
  'concern': 'warning',
};

/** Status styling */
const STATUS_CLASSES: Record<ReviewStatus, string> = {
  suggested: 'border-l-4 border-l-orange-400',
  confirmed: 'border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-900/10',
  dismissed: 'border-l-4 border-l-neutral-300 opacity-50',
};

export function CustomerInsightsPanel() {
  const customerProfile = useBusinessStudioStore((s) => s.customerProfile);
  const updateStatus = useBusinessStudioStore((s) => s.updateItemStatus);

  const allInsights = [
    ...customerProfile.painPoints,
    ...customerProfile.requirements,
    ...customerProfile.expectations,
    ...customerProfile.concerns,
  ];

  if (allInsights.length === 0) return null;

  const confirmed = allInsights.filter((i) => i.status === 'confirmed').length;

  const handleConfirm = (id: string) => updateStatus('customerInsights', id, 'confirmed');
  const handleDismiss = (id: string) => updateStatus('customerInsights', id, 'dismissed');

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
          Customer Insights
        </h2>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {confirmed}/{allInsights.length} confirmed
        </span>
      </div>

      <div className="space-y-2">
        {allInsights.map((insight) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            onConfirm={handleConfirm}
            onDismiss={handleDismiss}
          />
        ))}
      </div>
    </div>
  );
}

function InsightCard({
  insight,
  onConfirm,
  onDismiss,
}: {
  insight: CustomerInsight;
  onConfirm: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      className={`rounded-md p-3 bg-neutral-50 dark:bg-neutral-800/50 ${STATUS_CLASSES[insight.status]}`}
    >
      <p className="text-sm text-neutral-800 dark:text-neutral-200">{insight.text}</p>
      <div className="flex flex-wrap items-center gap-2 mt-2">
        <Badge variant={TYPE_VARIANT[insight.type]}>
          {TYPE_LABELS[insight.type]}
        </Badge>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {insight.speaker}
        </span>
      </div>

      {insight.status === 'suggested' && (
        <div className="flex gap-2 mt-2">
          <Button size="sm" variant="primary" onClick={() => onConfirm(insight.id)}>
            Confirm
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDismiss(insight.id)}>
            Dismiss
          </Button>
        </div>
      )}
    </div>
  );
}
