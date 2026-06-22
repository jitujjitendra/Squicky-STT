/**
 * QualityPanel Component
 *
 * Displays quality information about the active transcript and
 * generation statistics. Shows privacy badge, word count, segment count,
 * and speaker information.
 */

import { Badge } from '@/shared/components';
import { useCreatorStudioStore } from '../store';

export function QualityPanel() {
  const transcript = useCreatorStudioStore((s) => s.transcript);
  const mode = useCreatorStudioStore((s) => s.mode);
  const youtubeOutputs = useCreatorStudioStore((s) => s.youtubeOutputs);
  const podcastOutputs = useCreatorStudioStore((s) => s.podcastOutputs);
  const shortsOutputs = useCreatorStudioStore((s) => s.shortsOutputs);

  if (!transcript) return null;

  const segmentCount = transcript.segments.length;
  const wordCount = transcript.full_text.split(/\s+/).length;
  const speakerCount = transcript.speakers.count;
  const quality = transcript.transcription_meta.quality;

  /** Check if outputs have been generated for current mode */
  const hasOutputs = mode === 'youtube'
    ? youtubeOutputs !== null
    : mode === 'podcast'
      ? podcastOutputs !== null
      : shortsOutputs !== null;

  /** Quality badge variant */
  const qualityVariant = quality.quality_label === 'excellent' || quality.quality_label === 'good'
    ? 'success'
    : quality.quality_label === 'fair'
      ? 'warning'
      : 'error';

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4">
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
        Source Quality
      </h3>

      <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
        {/* Privacy indicator */}
        <div className="flex items-center justify-between">
          <span>Processing</span>
          <Badge variant="privacy">100% Client-Side</Badge>
        </div>

        {/* Transcript quality */}
        <div className="flex items-center justify-between">
          <span>Transcript Quality</span>
          <Badge variant={qualityVariant}>
            {quality.quality_label}
          </Badge>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between">
          <span>Segments</span>
          <span className="text-neutral-800 dark:text-neutral-200 font-medium">
            {segmentCount}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span>Words</span>
          <span className="text-neutral-800 dark:text-neutral-200 font-medium">
            {wordCount.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span>Speakers</span>
          <span className="text-neutral-800 dark:text-neutral-200 font-medium">
            {speakerCount}
          </span>
        </div>

        {/* Generation status */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-700">
          <span>Generated</span>
          <Badge variant={hasOutputs ? 'success' : 'default'}>
            {hasOutputs ? 'Yes' : 'Not yet'}
          </Badge>
        </div>
      </div>
    </div>
  );
}
