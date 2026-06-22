/**
 * Opportunities Panel
 *
 * Displays detected business opportunities with review controls.
 */

import React from 'react';
import { Button, Badge } from '@/shared/components';
import { useBusinessStudioStore } from '../store';
import type { BusinessOpportunity, ReviewStatus } from '../types';

/** Status styling */
const STATUS_CLASSES: Record<ReviewStatus, string> = {
  suggested: 'border-l-4 border-l-orange-400',
  confirmed: 'border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-900/10',
  dismissed: 'border-l-4 border-l-neutral-300 opacity-50',
};

export function OpportunitiesPanel() {
  const opportunities = useBusinessStudioStore((s) => s.opportunities);
  const updateStatus = useBusinessStudioStore((s) => s.updateItemStatus);

  if (opportunities.length === 0) return null;

  const confirmed = opportunities.filter((o) => o.status === 'confirmed').length;

  const handleConfirm = (id: string) => updateStatus('opportunities', id, 'confirmed');
  const handleDismiss = (id: string) => updateStatus('opportunities', id, 'dismissed');

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
          Opportunities
        </h2>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {confirmed}/{opportunities.length} confirmed
        </span>
      </div>

      <div className="space-y-2">
        {opportunities.map((opp) => (
          <OpportunityCard
            key={opp.id}
            opportunity={opp}
            onConfirm={handleConfirm}
            onDismiss={handleDismiss}
          />
        ))}
      </div>
    </div>
  );
}

function OpportunityCard({
  opportunity,
  onConfirm,
  onDismiss,
}: {
  opportunity: BusinessOpportunity;
  onConfirm: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      className={`rounded-md p-3 bg-neutral-50 dark:bg-neutral-800/50 ${STATUS_CLASSES[opportunity.status]}`}
    >
      <p className="text-sm text-neutral-800 dark:text-neutral-200">{opportunity.text}</p>
      <div className="flex flex-wrap items-center gap-2 mt-2">
        <Badge variant="privacy">Opportunity</Badge>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {opportunity.mentionedBy}
        </span>
      </div>

      {opportunity.status === 'suggested' && (
        <div className="flex gap-2 mt-2">
          <Button size="sm" variant="primary" onClick={() => onConfirm(opportunity.id)}>
            Confirm
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDismiss(opportunity.id)}>
            Dismiss
          </Button>
        </div>
      )}
    </div>
  );
}
