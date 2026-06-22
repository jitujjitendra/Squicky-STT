/**
 * SegmentBlock Component
 *
 * Renders a single transcript segment with:
 * - Timestamp display with click-to-seek
 * - Speaker label with color
 * - Confidence indicator
 * - Inline editing support
 * - Search match highlighting
 * - Active segment indication (audio sync)
 * - Edit/delete/split actions
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import type { SegmentId, SpeakerId } from '@/modules/speech-engine/types';
import type { DisplaySegment } from '../types';
import { useTranscriptStudioStore } from '../store';
import { EditIndicator } from './EditIndicator';

interface SegmentBlockProps {
  /** Display segment data */
  segment: DisplaySegment;
  /** Speaker display name */
  speakerName: string;
  /** Speaker color */
  speakerColor: { color: string; bgColor: string };
  /** Whether to show timestamps */
  showTimestamps: boolean;
  /** Whether to show confidence indicators */
  showConfidence: boolean;
  /** Whether to show speaker labels */
  showSpeakers: boolean;
  /** Callback for seeking audio */
  onSeek: (time: number) => void;
  /** Callback for editing text */
  onEditText: (segmentId: SegmentId, text: string) => void;
  /** Callback for splitting segment */
  onSplit: (segmentId: SegmentId, position: number) => void;
  /** Callback for deleting segment */
  onDelete: (segmentId: SegmentId) => void;
  /** Callback for restoring segment */
  onRestore: (segmentId: SegmentId) => void;
  /** Callback for changing speaker */
  onChangeSpeaker: (segmentId: SegmentId, speakerId: SpeakerId) => void;
  /** Available speakers for reassignment */
  speakers: Array<{ id: SpeakerId; displayName: string }>;
}

/** Format seconds to MM:SS.ms */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/** Confidence badge color */
function getConfidenceVariant(confidence: number): string {
  if (confidence >= 0.9) return 'text-green-500';
  if (confidence >= 0.7) return 'text-yellow-500';
  return 'text-red-500';
}

export function SegmentBlock({
  segment,
  speakerName,
  speakerColor,
  showTimestamps,
  showConfidence,
  showSpeakers,
  onSeek,
  onEditText,
  onSplit,
  onDelete,
  onRestore,
  onChangeSpeaker,
  speakers,
}: SegmentBlockProps) {
  const editingSegmentId = useTranscriptStudioStore((s) => s.editingSegmentId);
  const setEditingSegment = useTranscriptStudioStore((s) => s.setEditingSegment);

  const isEditing = editingSegmentId === segment.id;
  const [editText, setEditText] = useState(segment.text);
  const [showSpeakerMenu, setShowSpeakerMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync edit text when segment changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditText(segment.text);
    }
  }, [segment.text, isEditing]);

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
    }
  }, [isEditing]);

  /** Commit text edit */
  const commitEdit = useCallback(() => {
    if (editText.trim() !== segment.text) {
      onEditText(segment.id, editText.trim());
    }
    setEditingSegment(null);
  }, [editText, segment.text, segment.id, onEditText, setEditingSegment]);

  /** Handle key events in edit mode */
  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      commitEdit();
    }
    if (e.key === 'Escape') {
      setEditText(segment.text);
      setEditingSegment(null);
    }
  };

  /** Render text with search match highlighting */
  const renderHighlightedText = () => {
    if (segment.searchMatches.length === 0) {
      return <span>{segment.text}</span>;
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    const sortedMatches = [...segment.searchMatches].sort(
      (a, b) => a.startOffset - b.startOffset
    );

    for (const match of sortedMatches) {
      // Text before match
      if (match.startOffset > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {segment.text.slice(lastIndex, match.startOffset)}
          </span>
        );
      }

      // Highlighted match
      const searchState = useTranscriptStudioStore.getState().search;
      const isActive = match.index === searchState.activeMatchIndex;

      parts.push(
        <mark
          key={`match-${match.index}`}
          className={`rounded px-0.5 ${
            isActive
              ? 'bg-accent/40 ring-2 ring-accent'
              : 'bg-yellow-200 dark:bg-yellow-800'
          }`}
        >
          {segment.text.slice(match.startOffset, match.startOffset + match.length)}
        </mark>
      );

      lastIndex = match.startOffset + match.length;
    }

    // Remaining text
    if (lastIndex < segment.text.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>{segment.text.slice(lastIndex)}</span>
      );
    }

    return <>{parts}</>;
  };

  // Deleted segment rendering
  if (segment.isDeleted) {
    return (
      <div className="group px-4 py-2 opacity-50 border-l-2 border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10 rounded-r-lg">
        <div className="flex items-center gap-2">
          <EditIndicator isEdited={false} isDeleted={true} />
          <span className="text-sm text-neutral-500 line-through">{segment.text}</span>
          <button
            onClick={() => onRestore(segment.id)}
            className="ml-auto text-xs text-blue-500 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Restore
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        group relative px-4 py-3 rounded-lg transition-all
        ${segment.isActive ? 'bg-accent/5 ring-1 ring-accent/30' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'}
        ${isEditing ? 'ring-2 ring-accent bg-accent/5' : ''}
      `}
      data-segment-id={segment.id}
    >
      {/* Header: timestamp + speaker + confidence + edit indicator */}
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        {showTimestamps && (
          <button
            onClick={() => onSeek(segment.start)}
            className="text-xs font-mono text-neutral-400 hover:text-accent transition-colors"
            title={`Seek to ${formatTime(segment.start)}`}
          >
            {formatTime(segment.start)} - {formatTime(segment.end)}
          </button>
        )}

        {showSpeakers && segment.speakerId && (
          <div className="relative">
            <button
              onClick={() => setShowSpeakerMenu(!showSpeakerMenu)}
              className="text-xs font-medium px-1.5 py-0.5 rounded"
              style={{ color: speakerColor.color, backgroundColor: speakerColor.bgColor }}
            >
              {speakerName}
            </button>

            {showSpeakerMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                {speakers.map((speaker) => (
                  <button
                    key={speaker.id}
                    onClick={() => {
                      onChangeSpeaker(segment.id, speaker.id);
                      setShowSpeakerMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  >
                    {speaker.displayName}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {showConfidence && (
          <span
            className={`text-xs ${getConfidenceVariant(segment.confidence)}`}
            title={`Confidence: ${Math.round(segment.confidence * 100)}%`}
          >
            {Math.round(segment.confidence * 100)}%
          </span>
        )}

        <EditIndicator isEdited={segment.isEdited} isDeleted={false} />

        {/* Actions (visible on hover) */}
        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isEditing && (
            <button
              onClick={() => setEditingSegment(segment.id)}
              className="text-xs px-2 py-0.5 rounded text-neutral-500 hover:text-accent hover:bg-accent/10"
              title="Edit segment"
            >
              Edit
            </button>
          )}
          <button
            onClick={() => onDelete(segment.id)}
            className="text-xs px-2 py-0.5 rounded text-neutral-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            title="Delete segment"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Text content */}
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            ref={textareaRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleEditKeyDown}
            onBlur={commitEdit}
            className="w-full bg-transparent text-sm text-neutral-900 dark:text-neutral-100 resize-none outline-none border border-neutral-200 dark:border-neutral-600 rounded p-2 min-h-[60px]"
            aria-label="Edit segment text"
          />
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={commitEdit}
              className="px-2 py-1 rounded bg-accent text-white hover:bg-accent-hover"
            >
              Save
            </button>
            <button
              onClick={() => {
                setEditText(segment.text);
                setEditingSegment(null);
              }}
              className="px-2 py-1 rounded text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                const cursorPos = textareaRef.current?.selectionStart ?? Math.floor(editText.length / 2);
                onSplit(segment.id, cursorPos);
              }}
              className="px-2 py-1 rounded text-neutral-500 hover:text-blue-500"
              title="Split at cursor position"
            >
              Split
            </button>
          </div>
        </div>
      ) : (
        <p
          className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed cursor-text"
          onDoubleClick={() => setEditingSegment(segment.id)}
        >
          {renderHighlightedText()}
        </p>
      )}
    </div>
  );
}
