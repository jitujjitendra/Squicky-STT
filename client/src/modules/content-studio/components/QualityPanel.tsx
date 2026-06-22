/**
 * QualityPanel Component
 *
 * Displays quality metrics for generated content:
 * coherence, coverage, and readability scores.
 */

import React from 'react';
import { Badge } from '@/shared/components';
import { useContentStudioStore } from '../store';

/**
 * Visual quality score bar
 */
function QualityBar({ label, value }: { label: string; value: number }) {
  const percent = Math.round(value * 100);
  const colorClass =
    percent >= 70
      ? 'bg-green-500'
      : percent >= 40
        ? 'bg-yellow-500'
        : 'bg-red-500';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-600 dark:text-neutral-400">{label}</span>
        <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
          {percent}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Quality metrics panel
 */
export function QualityPanel() {
  const quality = useContentStudioStore((s) => s.quality);
  const generatedContent = useContentStudioStore((s) => s.generatedContent);

  if (!quality || !generatedContent) return null;

  const overallPercent = Math.round(quality.overall * 100);
  const variant =
    overallPercent >= 70 ? 'success' : overallPercent >= 40 ? 'warning' : 'error';

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Quality Score
        </h3>
        <Badge variant={variant}>{overallPercent}%</Badge>
      </div>

      <div className="space-y-2">
        <QualityBar label="Coherence" value={quality.coherence} />
        <QualityBar label="Coverage" value={quality.coverage} />
        <QualityBar label="Readability" value={quality.readability} />
      </div>
    </div>
  );
}
