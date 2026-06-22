/**
 * Follow-Ups Panel
 *
 * Displays detected follow-up items and open questions
 * with review controls.
 */

import React from 'react';
import { Button, Badge } from '@/shared/components';
import { useBusinessStudioStore } from '../store';
import type { FollowUp, ReviewStatus } from '../types';

/** Status styling */
const STATUS_CLASSES: Record<ReviewStatus, string> = {
  suggested: 'border-l-4 border-l-orange-400',
  confirmed: 'border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-900/10',
  dismissed: 'border-l-4 border-l-neutral-300 opacity-50',
};

export function FollowUpsPanel() {
  const followUps = useBusinessStudioStore((s) => s.followUps);
  const updateStatus = useBusinessStudioStore((s) => s.updateItemStatus);

  if (followUps.length === 0) return null;

  const confirmed = followUps.filter((f) => f.status === 'confirmed').length;

  const handleConfirm = (id: string) => updateStatus('followUps', id, 'confirmed');
  const handleDismiss = (id: string) => updateStatus('followUps', id, 'dismissed');

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
          Follow-Ups
        </h2>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {confirmed}/{followUps.length} confirmed
        </span>
      </div>

      <div className="space-y-2">
        {followUps.map((item) => (
          <FollowUpCard
            key={item.id}
            followUp={item}
            onConfirm={handleConfirm}
            onDismiss={handleDismiss}
          />
        ))}
      </div>
    </div>
  );
}

function FollowUpCard({
  followUp,
  onConfirm,
  onDismiss,
}: {
  followUp: FollowUp;
  onConfirm: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      className={`rounded-md p-3 bg-neutral-50 dark:bg-neutral-800/50 ${STATUS_CLASSES[followUp.status]}`}
    >
      <p className="text-sm text-neutral-800 dark:text-neutral-200">{followUp.text}</p>
      <div className="flex flex-wrap items-center gap-2 mt-2">
        <Badge variant={followUp.isOpenQuestion ? 'warning' : 'default'}>
          {followUp.isOpenQuestion ? 'Open Question' : 'Action'}
        </Badge>
        {followUp.who && (
          <span className="text-xs text-neutral-600 dark:text-neutral-300 font-medium">
            {followUp.who}
          </span>
        )}
        {followUp.when && (
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            by {followUp.when}
          </span>
        )}
      </div>

      {followUp.status === 'suggested' && (
        <div className="flex gap-2 mt-2">
          <Button size="sm" variant="primary" onClick={() => onConfirm(followUp.id)}>
            Confirm
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDismiss(followUp.id)}>
            Dismiss
          </Button>
        </div>
      )}
    </div>
  );
}
