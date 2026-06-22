/**
 * Transcription Result Component
 *
 * Displays the completed transcript with segments, timestamps,
 * speaker labels, and confidence indicators. Provides copy
 * and basic navigation functionality.
 */

import { useState } from 'react';
import { Icon } from '@/shared/components/Icon';
import { Button } from '@/shared/components/Button';
import { Badge } from '@/shared/components/Badge';
import type { StandardTranscript, TranscriptSegment } from '../types';

interface TranscriptionResultProps {
  /** The completed transcript */
  transcript: StandardTranscript;
  /** Called to go back to the upload view */
  onBack?: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.9) return 'text-green-600 dark:text-green-400';
  if (confidence >= 0.7) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

function SegmentRow({ segment, speakerName }: { segment: TranscriptSegment; speakerName?: string }) {
  return (
    <div className="flex gap-3 py-3 border-b border-[var(--border-primary)] last:border-0">
      {/* Timestamp */}
      <div className="shrink-0 w-16 text-xs text-[var(--text-tertiary)] font-mono pt-0.5">
        {formatTime(segment.start)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {speakerName && (
          <span className="text-xs font-medium text-accent mr-2">
            {speakerName}
          </span>
        )}
        <span className="text-sm text-[var(--text-primary)]">
          {segment.text_display}
        </span>
      </div>

      {/* Confidence */}
      <div className={`shrink-0 text-xs font-mono ${getConfidenceColor(segment.confidence)}`}>
        {Math.round(segment.confidence * 100)}%
      </div>
    </div>
  );
}

export function TranscriptionResult({ transcript, onBack }: TranscriptionResultProps) {
  const [showFullText, setShowFullText] = useState(false);
  const [copied, setCopied] = useState(false);

  const speakerMap = new Map(
    transcript.speakers.entries.map((s) => [s.id, s.display_name ?? s.label])
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(transcript.full_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: create a textarea and copy
      const textarea = document.createElement('textarea');
      textarea.value = transcript.full_text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] transition-colors"
              aria-label="Back"
            >
              <Icon name="chevron-left" size={20} />
            </button>
          )}
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Transcription Result
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowFullText(!showFullText)}>
            {showFullText ? 'Segments' : 'Full Text'}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => void handleCopy()}>
            <Icon name="document" size={14} />
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Badge variant="success">
          {transcript.transcription_meta.quality.quality_label}
        </Badge>
        <Badge variant="info">
          {transcript.transcription_meta.engine}
        </Badge>
        <Badge variant="default">
          {formatTime(transcript.transcription_meta.duration_seconds)}
        </Badge>
        {transcript.speakers.count > 0 && (
          <Badge variant="default">
            {transcript.speakers.count} speaker{transcript.speakers.count > 1 ? 's' : ''}
          </Badge>
        )}
        <Badge variant="default">
          {transcript.segments.length} segments
        </Badge>
      </div>

      {/* Content */}
      <div className="rounded-card border border-[var(--border-primary)] bg-[var(--bg-secondary)] overflow-hidden">
        {showFullText ? (
          <div className="p-4">
            <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
              {transcript.full_text}
            </p>
          </div>
        ) : (
          <div className="px-4 max-h-[60vh] overflow-y-auto">
            {transcript.segments.map((segment) => (
              <SegmentRow
                key={segment.id}
                segment={segment}
                speakerName={segment.speaker_id ? speakerMap.get(segment.speaker_id) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* Privacy notice */}
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[var(--text-tertiary)]">
        <Icon name="shield" size={12} />
        <span>This transcript is stored in memory only and will be cleared when you close the tab</span>
      </div>
    </div>
  );
}
