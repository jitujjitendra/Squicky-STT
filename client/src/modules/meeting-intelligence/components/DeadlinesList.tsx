/**
 * Deadlines List Component
 *
 * Displays detected deadline references with raw text and context.
 * Includes review controls (Confirm/Dismiss).
 */
import { Button, Badge } from '@/shared/components';
import { useMeetingIntelligenceStore } from '../store';
import type { Deadline, ReviewStatus } from '../types';

/** Status styling */
const STATUS_CLASSES: Record<ReviewStatus, string> = {
  suggested: 'border-l-4 border-l-purple-400',
  confirmed: 'border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-900/10',
  dismissed: 'border-l-4 border-l-neutral-300 opacity-50',
};

export function DeadlinesList() {
  const deadlines = useMeetingIntelligenceStore((s) => s.deadlines);
  const updateStatus = useMeetingIntelligenceStore((s) => s.updateItemStatus);

  if (deadlines.length === 0) return null;

  const handleConfirm = (id: string) => updateStatus('deadlines', id, 'confirmed');
  const handleDismiss = (id: string) => updateStatus('deadlines', id, 'dismissed');

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
          Deadlines
        </h2>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {deadlines.filter((d) => d.status === 'confirmed').length}/{deadlines.length} confirmed
        </span>
      </div>

      <div className="space-y-2">
        {deadlines.map((deadline) => (
          <DeadlineCard
            key={deadline.id}
            deadline={deadline}
            onConfirm={handleConfirm}
            onDismiss={handleDismiss}
          />
        ))}
      </div>
    </div>
  );
}

function DeadlineCard({
  deadline,
  onConfirm,
  onDismiss,
}: {
  deadline: Deadline;
  onConfirm: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      className={`rounded-md p-3 bg-neutral-50 dark:bg-neutral-800/50 ${STATUS_CLASSES[deadline.status]}`}
    >
      <div className="flex items-center gap-2">
        <Badge variant="info">{deadline.rawText}</Badge>
      </div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
        {deadline.context}
      </p>

      {/* Review actions */}
      {deadline.status === 'suggested' && (
        <div className="flex gap-2 mt-2">
          <Button size="sm" variant="primary" onClick={() => onConfirm(deadline.id)}>
            Confirm
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDismiss(deadline.id)}>
            Dismiss
          </Button>
        </div>
      )}
    </div>
  );
}
