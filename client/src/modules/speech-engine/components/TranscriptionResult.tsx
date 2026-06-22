/**
 * Transcription Result Component - Premium Edition
 *
 * Displays the completed transcript with segments, timestamps,
 * speaker labels, and confidence indicators. Glassmorphism card
 * with gradient accents.
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
  if (confidence >= 0.9) return 'text-emerald-400';
  if (confidence >= 0.7) return 'text-amber-400';
  return 'text-red-400';
}

function SegmentRow({ segment, speakerName }: { segment: TranscriptSegment; speakerName?: string }) {
  return (
    <div className="flex gap-3 py-3 border-b border-[var(--border-primary)] last:border-0 hover:bg-[var(--bg-hover)] transition-colors rounded px-2 -mx-2">
      {/* Timestamp */}
      <div className="shrink-0 w-16 text-xs text-accent/70 font-mono pt-0.5">
        {formatTime(segment.start)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {speakerName && (
          <span className="text-xs font-semibold text-accent-secondary-light mr-2">
            {speakerName}
          </span>
        )}
        <span className="text-sm text-[var(--text-primary)]">
          {segment.text_display}
        </span>
      </div>

      {/* Confidence */}
      <div className={`shrink-0 text-[10px] font-mono ${getConfidenceColor(segment.confidence)}`}>
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-button hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-accent transition-colors"
              aria-label="Back"
            >
              <Icon name="chevron-left" size={20} />
            </button>
          )}
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            Transcription <span className="text-gradient">Result</span>
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
      <div className="flex flex-wrap items-center gap-2 mb-5">
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

      {/* Content card */}
      <div className="rounded-card-lg border border-[var(--border-primary)] bg-[var(--surface-card)] backdrop-blur-sm overflow-hidden hover:border-[var(--border-accent)] transition-all duration-200">
        {showFullText ? (
          <div className="p-5">
            <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
              {transcript.full_text}
            </p>
          </div>
        ) : (
          <div className="px-4 py-2 max-h-[60vh] overflow-y-auto">
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
      <div className="mt-5 flex items-center justify-center gap-2 text-xs text-[var(--text-tertiary)]">
        <Icon name="shield" size={12} className="text-privacy" />
        <span>This transcript is stored in memory only and will be cleared when you close the tab</span>
      </div>
    </div>
  );
}
