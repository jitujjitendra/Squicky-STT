/**
 * CueList Component
 *
 * Renders the list of subtitle cues with editing capabilities.
 * Supports compact mode for mobile and full mode for desktop.
 * Highlights the current cue at playhead position.
 */

import { useMemo } from 'react';
import { useSubtitleEditor } from '../hooks/useSubtitleEditor';
import { useTimeline } from '../hooks/useTimeline';
import { CueBlock } from './CueBlock';
import type { SpeakerId } from '@/modules/speech-engine/types';

/**
 * CueList displays all subtitle cues in a scrollable list
 */
export function CueList() {
  const {
    cues,
    allCues,
    editingCueId,
    startEditing,
    updateText,
    updateStartTime,
    updateEndTime,
    handleSplit,
    mergeWithNext,
    handleDelete,
    handleRestore,
  } = useSubtitleEditor();

  const { currentCue } = useTimeline();

  /** Build speaker index map for consistent color assignment */
  const speakerIndexMap = useMemo(() => {
    const map = new Map<SpeakerId, number>();
    let idx = 0;
    for (const cue of cues) {
      if (cue.speakerId && !map.has(cue.speakerId)) {
        map.set(cue.speakerId, idx++);
      }
    }
    return map;
  }, [cues]);

  if (cues.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-center">
        <div>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            No subtitle cues generated yet.
          </p>
          <p className="text-neutral-400 dark:text-neutral-500 text-xs mt-1">
            Load a transcript to generate subtitles.
          </p>
        </div>
      </div>
    );
  }

  // Show deleted cues at the bottom
  const deletedCues = allCues.filter((c) => c.isDeleted);

  return (
    <div className="space-y-2 p-2 md:p-4">
      {/* Active cues */}
      {cues.map((cue) => (
        <CueBlock
          key={cue.id}
          cue={cue}
          isEditing={editingCueId === cue.id}
          isCurrent={currentCue?.id === cue.id}
          speakerIndex={cue.speakerId ? (speakerIndexMap.get(cue.speakerId) ?? 0) : 0}
          onStartEdit={startEditing}
          onTextChange={updateText}
          onStartTimeChange={updateStartTime}
          onEndTimeChange={updateEndTime}
          onSplit={handleSplit}
          onMergeNext={mergeWithNext}
          onDelete={handleDelete}
          onRestore={handleRestore}
        />
      ))}

      {/* Deleted cues section */}
      {deletedCues.length > 0 && (
        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <p className="text-xs text-neutral-400 mb-2">
            Deleted ({deletedCues.length})
          </p>
          {deletedCues.map((cue) => (
            <CueBlock
              key={cue.id}
              cue={cue}
              isEditing={false}
              isCurrent={false}
              speakerIndex={0}
              onStartEdit={startEditing}
              onTextChange={updateText}
              onStartTimeChange={updateStartTime}
              onEndTimeChange={updateEndTime}
              onSplit={handleSplit}
              onMergeNext={mergeWithNext}
              onDelete={handleDelete}
              onRestore={handleRestore}
            />
          ))}
        </div>
      )}
    </div>
  );
}
