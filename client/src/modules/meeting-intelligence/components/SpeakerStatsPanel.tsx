/**
 * Speaker Stats Panel Component
 *
 * Displays per-speaker analytics including a simple bar chart showing
 * participation percentages, segment count, speaking time, and questions asked.
 */
import { useMeetingIntelligenceStore } from '../store';

/**
 * Format seconds to mm:ss display
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function SpeakerStatsPanel() {
  const speakerStats = useMeetingIntelligenceStore((s) => s.speakerStats);

  if (speakerStats.length === 0) return null;

  const maxPercent = Math.max(...speakerStats.map((s) => s.participationPercent), 1);

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 space-y-3">
      <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
        Speaker Analytics
      </h2>

      <div className="space-y-3">
        {speakerStats.map((stats) => (
          <div key={stats.speakerId} className="space-y-1">
            {/* Speaker name and stats */}
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-neutral-700 dark:text-neutral-300 truncate">
                {stats.displayName}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap ml-2">
                {stats.participationPercent}%
              </span>
            </div>

            {/* Bar chart */}
            <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all duration-300"
                style={{ width: `${(stats.participationPercent / maxPercent) * 100}%` }}
              />
            </div>

            {/* Detail stats */}
            <div className="flex flex-wrap gap-3 text-xs text-neutral-500 dark:text-neutral-400">
              <span>{formatTime(stats.speakingTime)} speaking</span>
              <span>{stats.segmentCount} segments</span>
              {stats.questionsAsked > 0 && (
                <span>{stats.questionsAsked} question{stats.questionsAsked !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
