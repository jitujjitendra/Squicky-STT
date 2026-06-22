/**
 * Job Progress Component - Premium Edition
 *
 * Displays individual job progress with stage indicator,
 * gradient progress bar, and action buttons.
 */

import { Icon } from '@/shared/components/Icon';
import { Badge } from '@/shared/components/Badge';
import { useTranscriptionJob } from '../hooks/useTranscriptionJob';
import { useProcessingPipeline } from '../hooks/useProcessingPipeline';
import type { TranscriptionJob } from '../types';

interface JobProgressProps {
  /** The job to display */
  job: TranscriptionJob;
  /** Called when the job result should be viewed */
  onViewResult?: (jobId: string) => void;
}

function getStageIcon(stage: string): string {
  switch (stage) {
    case 'queued': return 'document';
    case 'preprocessing': return 'mic';
    case 'transcription': return 'mic';
    case 'normalization': return 'document';
    case 'completed': return 'download';
    case 'failed': return 'x';
    default: return 'document';
  }
}

function getStatusVariant(status: string): 'info' | 'warning' | 'success' | 'error' | 'default' {
  switch (status) {
    case 'pending': return 'info';
    case 'processing': return 'warning';
    case 'completed': return 'success';
    case 'failed': return 'error';
    case 'retrying': return 'warning';
    case 'cancelled': return 'default';
    default: return 'default';
  }
}

export function JobProgress({ job, onViewResult }: JobProgressProps) {
  const { progressLabel, durationLabel } = useTranscriptionJob(job.id);
  const { cancelJob } = useProcessingPipeline();

  const isActive = job.status === 'processing' || job.status === 'pending' || job.status === 'retrying';

  return (
    <div className="p-4 rounded-card border border-[var(--border-primary)] bg-[var(--surface-card)] backdrop-blur-sm hover:border-[var(--border-accent)] transition-all duration-200">
      <div className="flex items-center justify-between mb-2">
        {/* File info */}
        <div className="flex items-center gap-2 min-w-0">
          <Icon name={getStageIcon(job.stage)} size={16} className="text-accent shrink-0" />
          <span className="text-sm font-medium text-[var(--text-primary)] truncate">
            {job.metadata.filename}
          </span>
          <span className="text-xs text-[var(--text-tertiary)] shrink-0">
            {durationLabel}
          </span>
        </div>

        {/* Status badge and actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={getStatusVariant(job.status)}>
            {job.status}
          </Badge>
          {isActive && (
            <button
              onClick={() => cancelJob(job.id)}
              className="p-1 rounded hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-400 transition-colors"
              aria-label="Cancel job"
            >
              <Icon name="x" size={14} />
            </button>
          )}
          {job.status === 'completed' && onViewResult && (
            <button
              onClick={() => onViewResult(job.id)}
              className="p-1 rounded hover:bg-accent/10 text-[var(--text-tertiary)] hover:text-accent transition-colors"
              aria-label="View result"
            >
              <Icon name="document" size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar with gradient */}
      {isActive && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[var(--text-secondary)]">{progressLabel}</span>
            <span className="text-xs text-accent font-mono">
              {Math.round(job.progress)}%
            </span>
          </div>
          <div className="h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-accent to-accent-secondary-light"
              style={{ width: `${job.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error message */}
      {job.status === 'failed' && job.error && (
        <div className="mt-2 p-2 rounded bg-red-500/5 border border-red-500/15 text-xs text-red-400">
          {job.error.message}
          {job.retry_count > 0 && (
            <span className="ml-1 text-[var(--text-tertiary)]">
              (Retry {job.retry_count}/{job.max_retries})
            </span>
          )}
        </div>
      )}
    </div>
  );
}
