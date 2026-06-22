/**
 * CueBlock Component
 *
 * Renders a single subtitle cue in the cue list with:
 * - Sequence number and speaker indicator
 * - Start/end time display with inline editing
 * - Text content with inline editing
 * - Action buttons (split, merge, delete, restore)
 * - Validation issue indicators
 * - Speaker color dot
 */

import { useState, useRef, useCallback } from 'react';
import { Button, Badge } from '@/shared/components';
import { TimelineService } from '../services/TimelineService';
import type { SubtitleCue, CueId } from '../types';

/** Speaker colors for visual differentiation */
const SPEAKER_COLORS = [
  'bg-blue-400',
  'bg-green-400',
  'bg-purple-400',
  'bg-orange-400',
  'bg-pink-400',
  'bg-cyan-400',
  'bg-yellow-400',
  'bg-red-400',
];

interface CueBlockProps {
  /** The subtitle cue data */
  cue: SubtitleCue;
  /** Whether this cue is currently being edited */
  isEditing: boolean;
  /** Whether this is the current cue at playhead */
  isCurrent: boolean;
  /** Speaker index for color assignment */
  speakerIndex: number;
  /** Callback when edit mode is started */
  onStartEdit: (cueId: CueId) => void;
  /** Callback when text is changed */
  onTextChange: (cueId: CueId, text: string) => void;
  /** Callback when start time is changed */
  onStartTimeChange: (cueId: CueId, time: number) => void;
  /** Callback when end time is changed */
  onEndTimeChange: (cueId: CueId, time: number) => void;
  /** Callback for split at cursor */
  onSplit: (cueId: CueId, cursorPos: number) => void;
  /** Callback for merge with next */
  onMergeNext: (cueId: CueId) => void;
  /** Callback for delete */
  onDelete: (cueId: CueId) => void;
  /** Callback for restore */
  onRestore: (cueId: CueId) => void;
}

export function CueBlock({
  cue,
  isEditing,
  isCurrent,
  speakerIndex,
  onStartEdit,
  onTextChange,
  onStartTimeChange,
  onEndTimeChange,
  onSplit,
  onMergeNext,
  onDelete,
  onRestore,
}: CueBlockProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [localText, setLocalText] = useState(cue.text);

  const colorClass = SPEAKER_COLORS[speakerIndex % SPEAKER_COLORS.length] ?? 'bg-neutral-400';
  const duration = cue.end - cue.start;

  /** Handle text blur (commit change) */
  const handleTextBlur = useCallback(() => {
    if (localText !== cue.text) {
      onTextChange(cue.id, localText);
    }
  }, [localText, cue.text, cue.id, onTextChange]);

  /** Handle split at cursor */
  const handleSplit = useCallback(() => {
    const pos = textareaRef.current?.selectionStart ?? Math.floor(localText.length / 2);
    onSplit(cue.id, pos);
  }, [cue.id, localText, onSplit]);

  /** Handle time input change */
  const handleTimeChange = useCallback(
    (type: 'start' | 'end', value: string) => {
      const num = parseFloat(value);
      if (!isNaN(num) && num >= 0) {
        if (type === 'start') {
          onStartTimeChange(cue.id, num);
        } else {
          onEndTimeChange(cue.id, num);
        }
      }
    },
    [cue.id, onStartTimeChange, onEndTimeChange]
  );

  // Deleted cue styling
  if (cue.isDeleted) {
    return (
      <div className="group relative border border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg p-3 opacity-50">
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-400 line-through">
            #{cue.sequenceIndex} (deleted)
          </span>
          <Button variant="ghost" size="sm" onClick={() => onRestore(cue.id)}>
            Restore
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        group relative border rounded-lg p-3 transition-all
        ${isCurrent ? 'border-accent bg-accent/5 ring-1 ring-accent/30' : 'border-neutral-200 dark:border-neutral-700'}
        ${!cue.validation.isValid ? 'border-red-300 dark:border-red-700' : ''}
        ${isEditing ? 'ring-2 ring-accent/50' : ''}
        hover:border-accent/50
      `.trim()}
      onClick={() => !isEditing && onStartEdit(cue.id)}
    >
      {/* Header row: sequence number, speaker, duration, actions */}
      <div className="flex items-center gap-2 mb-2">
        {/* Sequence number */}
        <span className="text-xs font-mono text-neutral-400 w-6">
          #{cue.sequenceIndex}
        </span>

        {/* Speaker dot + name */}
        {cue.speakerName && (
          <div className="flex items-center gap-1">
            <span className={`inline-block w-2 h-2 rounded-full ${colorClass}`} />
            <span className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-[80px]">
              {cue.speakerName}
            </span>
          </div>
        )}

        {/* Duration badge */}
        <Badge variant={duration < 1.0 ? 'warning' : 'default'} className="ml-auto">
          {duration.toFixed(1)}s
        </Badge>

        {/* CPS indicator */}
        <Badge
          variant={
            cue.validation.cps > 30
              ? 'error'
              : cue.validation.cps > 25
                ? 'warning'
                : 'default'
          }
        >
          {cue.validation.cps.toFixed(0)} CPS
        </Badge>

        {/* Edited indicator */}
        {cue.isEdited && (
          <Badge variant="info">edited</Badge>
        )}
      </div>

      {/* Time range inputs */}
      <div className="flex items-center gap-2 mb-2 text-xs font-mono">
        <input
          type="text"
          value={TimelineService.formatTime(cue.start)}
          className="w-16 px-1 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-center border border-transparent focus:border-accent focus:outline-none"
          onChange={(e) => {
            // Parse MM:SS.s format
            const parts = e.target.value.split(':');
            if (parts.length === 2) {
              const mins = parseFloat(parts[0] ?? '0');
              const secs = parseFloat(parts[1] ?? '0');
              if (!isNaN(mins) && !isNaN(secs)) {
                handleTimeChange('start', String(mins * 60 + secs));
              }
            }
          }}
          aria-label="Start time"
        />
        <span className="text-neutral-400">-</span>
        <input
          type="text"
          value={TimelineService.formatTime(cue.end)}
          className="w-16 px-1 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-center border border-transparent focus:border-accent focus:outline-none"
          onChange={(e) => {
            const parts = e.target.value.split(':');
            if (parts.length === 2) {
              const mins = parseFloat(parts[0] ?? '0');
              const secs = parseFloat(parts[1] ?? '0');
              if (!isNaN(mins) && !isNaN(secs)) {
                handleTimeChange('end', String(mins * 60 + secs));
              }
            }
          }}
          aria-label="End time"
        />
      </div>

      {/* Text content */}
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={localText}
          onChange={(e) => setLocalText(e.target.value)}
          onBlur={handleTextBlur}
          className="w-full min-h-[48px] px-2 py-1 text-sm bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded resize-none focus:outline-none focus:border-accent"
          rows={2}
          autoFocus
        />
      ) : (
        <p className="text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed">
          {cue.text}
        </p>
      )}

      {/* Validation issues */}
      {cue.validation.issues.length > 0 && (
        <div className="mt-2 space-y-1">
          {cue.validation.issues.map((issue, i) => (
            <div
              key={`${issue.type}-${i}`}
              className={`text-xs px-2 py-0.5 rounded ${
                issue.severity === 'error'
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                  : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
              }`}
            >
              {issue.message}
            </div>
          ))}
        </div>
      )}

      {/* Action buttons (visible on hover or editing) */}
      <div
        className={`
          flex items-center gap-1 mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800
          ${isEditing ? 'visible' : 'invisible group-hover:visible'}
        `}
      >
        <Button variant="ghost" size="sm" onClick={handleSplit}>
          Split
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onMergeNext(cue.id)}>
          Merge
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(cue.id)}>
          Delete
        </Button>
      </div>
    </div>
  );
}
