/**
 * Summary Card Component
 *
 * Displays the meeting summary with key metadata (duration, participants,
 * meeting type). Uses extractive sentences from TextRank.
 */
import { Badge, Icon } from '@/shared/components';
import { useMeetingIntelligenceStore } from '../store';

/** Meeting type display labels */
const TYPE_LABELS: Record<string, string> = {
  team: 'Team Meeting',
  client: 'Client Meeting',
  sales: 'Sales Call',
  project: 'Project Meeting',
  interview: 'Interview',
  training: 'Training Session',
  board: 'Board Meeting',
};

/**
 * Format seconds into human-readable duration
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hrs}h ${remainMins}m`;
}

export function SummaryCard() {
  const summary = useMeetingIntelligenceStore((s) => s.summary);
  const meetingType = useMeetingIntelligenceStore((s) => s.meetingType);

  if (!summary) return null;

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
          Meeting Summary
        </h2>
        <Badge variant="info">
          {meetingType ? TYPE_LABELS[meetingType] || meetingType : 'Unknown'}
        </Badge>
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap gap-4 text-xs text-neutral-500 dark:text-neutral-400">
        <span className="flex items-center gap-1">
          <Icon name="mic" size={14} />
          {formatDuration(summary.durationSeconds)}
        </span>
        <span className="flex items-center gap-1">
          <Icon name="user" size={14} />
          {summary.participantCount} participant{summary.participantCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Summary sentences */}
      <div className="space-y-2">
        {summary.sentences.map((sentence, i) => (
          <p
            key={i}
            className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed"
          >
            {sentence}
          </p>
        ))}
      </div>
    </div>
  );
}
