/**
 * Processing Status Component
 *
 * Displays the overall processing status: number of jobs queued,
 * processing, completed, and failed. Provides controls for
 * batch processing and clearing completed jobs.
 */

import { Icon } from '@/shared/components/Icon';
import { Button } from '@/shared/components/Button';
import { Badge } from '@/shared/components/Badge';
import { useSpeechEngineStore } from '../store';
import { useProcessingPipeline } from '../hooks';

export function ProcessingStatus() {
  const jobs = useSpeechEngineStore((s) => s.jobs);
  const { processAll, clearCompleted } = useProcessingPipeline();

  const pending = jobs.filter((j) => j.status === 'pending' || j.status === 'retrying');
  const processing = jobs.filter((j) => j.status === 'processing');
  const completed = jobs.filter((j) => j.status === 'completed');
  const failed = jobs.filter((j) => j.status === 'failed');

  if (jobs.length === 0) return null;

  return (
    <div className="w-full max-w-2xl mx-auto mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-[var(--text-primary)]">
          Processing Queue
        </h3>
        <div className="flex items-center gap-2">
          {pending.length > 0 && (
            <Button variant="primary" size="sm" onClick={() => void processAll()}>
              <Icon name="mic" size={14} />
              Process All ({pending.length})
            </Button>
          )}
          {(completed.length > 0 || failed.length > 0) && (
            <Button variant="ghost" size="sm" onClick={clearCompleted}>
              Clear Done
            </Button>
          )}
        </div>
      </div>

      {/* Status summary */}
      <div className="flex items-center gap-3 mb-4">
        {pending.length > 0 && (
          <Badge variant="info">{pending.length} queued</Badge>
        )}
        {processing.length > 0 && (
          <Badge variant="warning">{processing.length} processing</Badge>
        )}
        {completed.length > 0 && (
          <Badge variant="success">{completed.length} completed</Badge>
        )}
        {failed.length > 0 && (
          <Badge variant="error">{failed.length} failed</Badge>
        )}
      </div>
    </div>
  );
}
