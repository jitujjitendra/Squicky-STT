/**
 * Decisions List Component
 *
 * Displays detected decisions with confidence level indicators
 * and review controls (Confirm/Dismiss).
 */
import { Button, Badge } from '@/shared/components';
import { useMeetingIntelligenceStore } from '../store';
import type { Decision, Confidence, ReviewStatus } from '../types';

/** Confidence badge variants */
const CONFIDENCE_VARIANT: Record<Confidence, 'success' | 'info' | 'default'> = {
  high: 'success',
  medium: 'info',
  low: 'default',
};

/** Status styling */
const STATUS_CLASSES: Record<ReviewStatus, string> = {
  suggested: 'border-l-4 border-l-blue-400',
  confirmed: 'border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-900/10',
  dismissed: 'border-l-4 border-l-neutral-300 opacity-50',
};

export function DecisionsList() {
  const decisions = useMeetingIntelligenceStore((s) => s.decisions);
  const updateStatus = useMeetingIntelligenceStore((s) => s.updateItemStatus);

  if (decisions.length === 0) return null;

  const handleConfirm = (id: string) => updateStatus('decisions', id, 'confirmed');
  const handleDismiss = (id: string) => updateStatus('decisions', id, 'dismissed');

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
          Decisions
        </h2>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {decisions.filter((d) => d.status === 'confirmed').length}/{decisions.length} confirmed
        </span>
      </div>

      <div className="space-y-2">
        {decisions.map((decision) => (
          <DecisionCard
            key={decision.id}
            decision={decision}
            onConfirm={handleConfirm}
            onDismiss={handleDismiss}
          />
        ))}
      </div>
    </div>
  );
}

function DecisionCard({
  decision,
  onConfirm,
  onDismiss,
}: {
  decision: Decision;
  onConfirm: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      className={`rounded-md p-3 bg-neutral-50 dark:bg-neutral-800/50 ${STATUS_CLASSES[decision.status]}`}
    >
      <p className="text-sm text-neutral-800 dark:text-neutral-200">{decision.text}</p>
      <div className="flex flex-wrap items-center gap-2 mt-2">
        <Badge variant={CONFIDENCE_VARIANT[decision.confidence]}>
          {decision.confidence} confidence
        </Badge>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {decision.madeBy}
        </span>
      </div>

      {/* Review actions */}
      {decision.status === 'suggested' && (
        <div className="flex gap-2 mt-2">
          <Button size="sm" variant="primary" onClick={() => onConfirm(decision.id)}>
            Confirm
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDismiss(decision.id)}>
            Dismiss
          </Button>
        </div>
      )}
    </div>
  );
}
