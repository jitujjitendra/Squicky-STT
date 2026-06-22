/**
 * Sales Signals Panel
 *
 * Displays detected sales signals: objections, buying signals,
 * interest indicators, and deal risks with review controls.
 */

import React from 'react';
import { Button, Badge } from '@/shared/components';
import { useBusinessStudioStore } from '../store';
import type { SalesSignal, SalesSignalType, ReviewStatus } from '../types';

/** Type labels */
const TYPE_LABELS: Record<SalesSignalType, string> = {
  'objection': 'Objection',
  'buying-signal': 'Buying Signal',
  'interest': 'Interest',
  'deal-risk': 'Deal Risk',
};

/** Type badge variants */
const TYPE_VARIANT: Record<SalesSignalType, 'error' | 'warning' | 'default' | 'privacy'> = {
  'objection': 'error',
  'buying-signal': 'privacy',
  'interest': 'default',
  'deal-risk': 'warning',
};

/** Status styling */
const STATUS_CLASSES: Record<ReviewStatus, string> = {
  suggested: 'border-l-4 border-l-orange-400',
  confirmed: 'border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-900/10',
  dismissed: 'border-l-4 border-l-neutral-300 opacity-50',
};

export function SalesSignalsPanel() {
  const salesInsights = useBusinessStudioStore((s) => s.salesInsights);
  const updateStatus = useBusinessStudioStore((s) => s.updateItemStatus);

  if (salesInsights.length === 0) return null;

  const confirmed = salesInsights.filter((s) => s.status === 'confirmed').length;

  const handleConfirm = (id: string) => updateStatus('salesInsights', id, 'confirmed');
  const handleDismiss = (id: string) => updateStatus('salesInsights', id, 'dismissed');

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
          Sales Signals
        </h2>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {confirmed}/{salesInsights.length} confirmed
        </span>
      </div>

      <div className="space-y-2">
        {salesInsights.map((signal) => (
          <SignalCard
            key={signal.id}
            signal={signal}
            onConfirm={handleConfirm}
            onDismiss={handleDismiss}
          />
        ))}
      </div>
    </div>
  );
}

function SignalCard({
  signal,
  onConfirm,
  onDismiss,
}: {
  signal: SalesSignal;
  onConfirm: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      className={`rounded-md p-3 bg-neutral-50 dark:bg-neutral-800/50 ${STATUS_CLASSES[signal.status]}`}
    >
      <p className="text-sm text-neutral-800 dark:text-neutral-200">{signal.text}</p>
      <div className="flex flex-wrap items-center gap-2 mt-2">
        <Badge variant={TYPE_VARIANT[signal.type]}>
          {TYPE_LABELS[signal.type]}
        </Badge>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {signal.speaker}
        </span>
      </div>

      {signal.status === 'suggested' && (
        <div className="flex gap-2 mt-2">
          <Button size="sm" variant="primary" onClick={() => onConfirm(signal.id)}>
            Confirm
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDismiss(signal.id)}>
            Dismiss
          </Button>
        </div>
      )}
    </div>
  );
}
