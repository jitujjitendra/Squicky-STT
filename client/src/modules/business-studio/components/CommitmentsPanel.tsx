/**
 * Commitments Panel
 *
 * Displays detected commitments with scope (external/internal),
 * accountability level, and review controls.
 */
import { Button, Badge } from '@/shared/components';
import { useBusinessStudioStore } from '../store';
import type { Commitment, ReviewStatus } from '../types';

/** Status styling */
const STATUS_CLASSES: Record<ReviewStatus, string> = {
  suggested: 'border-l-4 border-l-orange-400',
  confirmed: 'border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-900/10',
  dismissed: 'border-l-4 border-l-neutral-300 opacity-50',
};

export function CommitmentsPanel() {
  const commitments = useBusinessStudioStore((s) => s.commitments);
  const updateStatus = useBusinessStudioStore((s) => s.updateItemStatus);

  if (commitments.length === 0) return null;

  const confirmed = commitments.filter((c) => c.status === 'confirmed').length;

  const handleConfirm = (id: string) => updateStatus('commitments', id, 'confirmed');
  const handleDismiss = (id: string) => updateStatus('commitments', id, 'dismissed');

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
          Commitments
        </h2>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {confirmed}/{commitments.length} confirmed
        </span>
      </div>

      <div className="space-y-2">
        {commitments.map((commitment) => (
          <CommitmentCard
            key={commitment.id}
            commitment={commitment}
            onConfirm={handleConfirm}
            onDismiss={handleDismiss}
          />
        ))}
      </div>
    </div>
  );
}

function CommitmentCard({
  commitment,
  onConfirm,
  onDismiss,
}: {
  commitment: Commitment;
  onConfirm: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      className={`rounded-md p-3 bg-neutral-50 dark:bg-neutral-800/50 ${STATUS_CLASSES[commitment.status]}`}
    >
      <p className="text-sm text-neutral-800 dark:text-neutral-200">{commitment.text}</p>
      <div className="flex flex-wrap items-center gap-2 mt-2">
        <Badge variant={commitment.scope === 'external' ? 'error' : 'default'}>
          {commitment.scope}
        </Badge>
        <Badge variant={commitment.accountability === 'high' ? 'warning' : 'default'}>
          {commitment.accountability} accountability
        </Badge>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {commitment.madeBy}
        </span>
      </div>

      {commitment.status === 'suggested' && (
        <div className="flex gap-2 mt-2">
          <Button size="sm" variant="primary" onClick={() => onConfirm(commitment.id)}>
            Confirm
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDismiss(commitment.id)}>
            Dismiss
          </Button>
        </div>
      )}
    </div>
  );
}
