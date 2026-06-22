/**
 * useSubtitleEditor Hook
 *
 * Provides editing operations for subtitle cues:
 * - Inline text editing
 * - Time adjustment (start/end)
 * - Split cue at cursor position
 * - Merge adjacent cues
 * - Delete and restore
 * - Undo/redo
 */

import { useCallback } from 'react';
import { useSubtitleStudioStore } from '../store';
import type { CueId, SubtitleCue } from '../types';

/**
 * Hook for subtitle editing operations
 */
export function useSubtitleEditor() {
  const cues = useSubtitleStudioStore((s) => s.cues);
  const editingCueId = useSubtitleStudioStore((s) => s.editingCueId);
  const updateCue = useSubtitleStudioStore((s) => s.updateCue);
  const deleteCue = useSubtitleStudioStore((s) => s.deleteCue);
  const restoreCue = useSubtitleStudioStore((s) => s.restoreCue);
  const splitCue = useSubtitleStudioStore((s) => s.splitCue);
  const mergeCues = useSubtitleStudioStore((s) => s.mergeCues);
  const setEditingCueId = useSubtitleStudioStore((s) => s.setEditingCueId);
  const pushHistory = useSubtitleStudioStore((s) => s.pushHistory);
  const undo = useSubtitleStudioStore((s) => s.undo);
  const redo = useSubtitleStudioStore((s) => s.redo);

  /**
   * Start editing a cue
   */
  const startEditing = useCallback(
    (cueId: CueId) => {
      setEditingCueId(cueId);
    },
    [setEditingCueId]
  );

  /**
   * Stop editing
   */
  const stopEditing = useCallback(() => {
    setEditingCueId(null);
  }, [setEditingCueId]);

  /**
   * Update cue text
   */
  const updateText = useCallback(
    (cueId: CueId, text: string) => {
      pushHistory('Edit text');
      updateCue(cueId, { text });
    },
    [updateCue, pushHistory]
  );

  /**
   * Update cue start time
   */
  const updateStartTime = useCallback(
    (cueId: CueId, start: number) => {
      pushHistory('Edit start time');
      updateCue(cueId, { start: Math.max(0, start) });
    },
    [updateCue, pushHistory]
  );

  /**
   * Update cue end time
   */
  const updateEndTime = useCallback(
    (cueId: CueId, end: number) => {
      pushHistory('Edit end time');
      updateCue(cueId, { end: Math.max(0, end) });
    },
    [updateCue, pushHistory]
  );

  /**
   * Split a cue at the given cursor position
   */
  const handleSplit = useCallback(
    (cueId: CueId, cursorPosition: number) => {
      splitCue(cueId, cursorPosition);
    },
    [splitCue]
  );

  /**
   * Merge a cue with the next adjacent cue
   */
  const mergeWithNext = useCallback(
    (cueId: CueId) => {
      const activeCues = cues.filter((c) => !c.isDeleted);
      const idx = activeCues.findIndex((c) => c.id === cueId);
      if (idx < 0 || idx >= activeCues.length - 1) return;
      const nextCue = activeCues[idx + 1];
      if (nextCue) {
        mergeCues(cueId, nextCue.id);
      }
    },
    [cues, mergeCues]
  );

  /**
   * Delete a cue (soft delete)
   */
  const handleDelete = useCallback(
    (cueId: CueId) => {
      deleteCue(cueId);
    },
    [deleteCue]
  );

  /**
   * Restore a deleted cue
   */
  const handleRestore = useCallback(
    (cueId: CueId) => {
      restoreCue(cueId);
    },
    [restoreCue]
  );

  /**
   * Get the active (non-deleted) cues
   */
  const activeCues = cues.filter((c) => !c.isDeleted);

  /**
   * Get the currently editing cue
   */
  const editingCue: SubtitleCue | undefined = cues.find((c) => c.id === editingCueId);

  return {
    cues: activeCues,
    allCues: cues,
    editingCueId,
    editingCue,
    startEditing,
    stopEditing,
    updateText,
    updateStartTime,
    updateEndTime,
    handleSplit,
    mergeWithNext,
    handleDelete,
    handleRestore,
    undo,
    redo,
  };
}
