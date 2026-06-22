/**
 * Risks Panel
 *
 * Displays detected business risks with severity indicators
 * and review controls (Confirm/Dismiss).
 */
import { Button, Badge } from '@/shared/components';
import { useBusinessStudioStore } from '../store';
import type { BusinessRisk, Severity, ReviewStatus } from '../types';

/** Severity badge variants */
const SEVERITY_VARIANT: Record<Severity, 'error' | 'warning' | 'default'> = {
  high: 'error',
  medium: 'warning',
  low: 'default',
};

/** Status styling */
const STATUS_CLASSES: Record<ReviewStatus, string> = {
  suggested: 'border-l-4 border-l-orange-400',
  confirmed: 'border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-900/10',
  dismissed: 'border-l-4 border-l-neutral-300 opacity-50',
};

export function RisksPanel() {
  const risks = useBusinessStudioStore((s) => s.risks);
  const updateStatus = useBusinessStudioStore((s) => s.updateItemStatus);

  if (risks.length === 0) return null;

  const confirmed = risks.filter((r) => r.status === 'confirmed').length;

  const handleConfirm = (id: string) => updateStatus('risks', id, 'confirmed');
  const handleDismiss = (id: string) => updateStatus('risks', id, 'dismissed');

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
          Risks
        </h2>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {confirmed}/{risks.length} confirmed
        </span>
      </div>

      <div className="space-y-2">
        {risks.map((risk) => (
          <RiskCard
            key={risk.id}
            risk={risk}
            onConfirm={handleConfirm}
            onDismiss={handleDismiss}
          />
        ))}
      </div>
    </div>
  );
}

function RiskCard({
  risk,
  onConfirm,
  onDismiss,
}: {
  risk: BusinessRisk;
  onConfirm: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      className={`rounded-md p-3 bg-neutral-50 dark:bg-neutral-800/50 ${STATUS_CLASSES[risk.status]}`}
    >
      <p className="text-sm text-neutral-800 dark:text-neutral-200">{risk.text}</p>
      <div className="flex flex-wrap items-center gap-2 mt-2">
        <Badge variant={SEVERITY_VARIANT[risk.severity]}>
          {risk.severity} severity
        </Badge>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {risk.raisedBy}
        </span>
      </div>

      {risk.status === 'suggested' && (
        <div className="flex gap-2 mt-2">
          <Button size="sm" variant="primary" onClick={() => onConfirm(risk.id)}>
            Confirm
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDismiss(risk.id)}>
            Dismiss
          </Button>
        </div>
      )}
    </div>
  );
}
