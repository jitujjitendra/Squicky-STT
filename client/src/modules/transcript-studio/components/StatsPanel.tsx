/**
 * StatsPanel Component
 *
 * Displays transcript statistics:
 * - Word count
 * - Segment count
 * - Speaker count
 * - Duration
 * - Quality badge
 */

import { Badge } from '@/shared/components';
import { useTranscriptStudioStore } from '../store';

/** Format duration in seconds to human-readable string */
function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs}s`;
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

/** Map quality label to badge variant */
function getQualityVariant(label: string): 'success' | 'warning' | 'error' | 'info' {
  switch (label) {
    case 'excellent':
      return 'success';
    case 'good':
      return 'success';
    case 'fair':
      return 'warning';
    case 'poor':
      return 'error';
    default:
      return 'info';
  }
}

export function StatsPanel() {
  const stats = useTranscriptStudioStore((s) => s.stats);

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
      <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
        Statistics
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <StatItem label="Words" value={stats.wordCount.toLocaleString()} />
        <StatItem label="Segments" value={stats.segmentCount.toString()} />
        <StatItem label="Speakers" value={stats.speakerCount.toString()} />
        <StatItem label="Duration" value={formatDuration(stats.duration)} />
      </div>

      <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
        <span className="text-xs text-neutral-500">Quality</span>
        <Badge variant={getQualityVariant(stats.qualityLabel)}>
          {stats.qualityLabel} ({Math.round(stats.qualityScore * 100)}%)
        </Badge>
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        {value}
      </div>
      <div className="text-xs text-neutral-500">{label}</div>
    </div>
  );
}
