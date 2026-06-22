/**
 * Support Signals Panel
 *
 * Displays detected support signals: issues, resolutions,
 * and escalations with review controls.
 */
import { Button, Badge } from '@/shared/components';
import { useBusinessStudioStore } from '../store';
import type { SupportSignal, SupportSignalType, ReviewStatus } from '../types';

/** Type labels */
const TYPE_LABELS: Record<SupportSignalType, string> = {
  'issue': 'Issue',
  'resolution': 'Resolution',
  'escalation': 'Escalation',
};

/** Type badge variants */
const TYPE_VARIANT: Record<SupportSignalType, 'error' | 'warning' | 'default' | 'privacy'> = {
  'issue': 'error',
  'resolution': 'privacy',
  'escalation': 'warning',
};

/** Status styling */
const STATUS_CLASSES: Record<ReviewStatus, string> = {
  suggested: 'border-l-4 border-l-orange-400',
  confirmed: 'border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-900/10',
  dismissed: 'border-l-4 border-l-neutral-300 opacity-50',
};

export function SupportSignalsPanel() {
  const supportInsights = useBusinessStudioStore((s) => s.supportInsights);
  const updateStatus = useBusinessStudioStore((s) => s.updateItemStatus);

  if (supportInsights.length === 0) return null;

  const confirmed = supportInsights.filter((s) => s.status === 'confirmed').length;

  const handleConfirm = (id: string) => updateStatus('supportInsights', id, 'confirmed');
  const handleDismiss = (id: string) => updateStatus('supportInsights', id, 'dismissed');

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
          Support Signals
        </h2>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {confirmed}/{supportInsights.length} confirmed
        </span>
      </div>

      <div className="space-y-2">
        {supportInsights.map((signal) => (
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
  signal: SupportSignal;
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
