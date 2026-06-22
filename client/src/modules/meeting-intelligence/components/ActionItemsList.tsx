/**
 * Action Items List Component
 *
 * Displays extracted action items with review controls (Confirm/Dismiss).
 * Items are colored by priority and show assignee/deadline metadata.
 * Human-in-the-loop: items start as "suggested" until confirmed.
 */
import { Button, Badge } from '@/shared/components';
import { useMeetingIntelligenceStore } from '../store';
import type { ActionItem, Priority, ReviewStatus } from '../types';

/** Priority badge variants */
const PRIORITY_VARIANT: Record<Priority, 'error' | 'warning' | 'default'> = {
  urgent: 'error',
  normal: 'warning',
  low: 'default',
};

/** Status styling */
const STATUS_CLASSES: Record<ReviewStatus, string> = {
  suggested: 'border-l-4 border-l-yellow-400',
  confirmed: 'border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-900/10',
  dismissed: 'border-l-4 border-l-neutral-300 opacity-50',
};

export function ActionItemsList() {
  const actionItems = useMeetingIntelligenceStore((s) => s.actionItems);
  const updateStatus = useMeetingIntelligenceStore((s) => s.updateItemStatus);

  if (actionItems.length === 0) return null;

  const handleConfirm = (id: string) => updateStatus('actionItems', id, 'confirmed');
  const handleDismiss = (id: string) => updateStatus('actionItems', id, 'dismissed');

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
          Action Items
        </h2>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {actionItems.filter((i) => i.status === 'confirmed').length}/{actionItems.length} confirmed
        </span>
      </div>

      <div className="space-y-2">
        {actionItems.map((item) => (
          <ActionItemCard
            key={item.id}
            item={item}
            onConfirm={handleConfirm}
            onDismiss={handleDismiss}
          />
        ))}
      </div>
    </div>
  );
}

function ActionItemCard({
  item,
  onConfirm,
  onDismiss,
}: {
  item: ActionItem;
  onConfirm: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      className={`rounded-md p-3 bg-neutral-50 dark:bg-neutral-800/50 ${STATUS_CLASSES[item.status]}`}
    >
      <div className="flex items-start gap-2">
        {/* Checkbox indicator */}
        <div className="mt-0.5">
          <div
            className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
              item.status === 'confirmed'
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-neutral-400 dark:border-neutral-500'
            }`}
          >
            {item.status === 'confirmed' && (
              <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-neutral-800 dark:text-neutral-200">{item.task}</p>
          <div className="flex flex-wrap gap-2 mt-1">
            <Badge variant={PRIORITY_VARIANT[item.priority]}>{item.priority}</Badge>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {item.assignee}
            </span>
            {item.deadlineRaw && (
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                &bull; {item.deadlineRaw}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Review actions */}
      {item.status === 'suggested' && (
        <div className="flex gap-2 mt-2 ml-6">
          <Button size="sm" variant="primary" onClick={() => onConfirm(item.id)}>
            Confirm
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDismiss(item.id)}>
            Dismiss
          </Button>
        </div>
      )}
    </div>
  );
}
