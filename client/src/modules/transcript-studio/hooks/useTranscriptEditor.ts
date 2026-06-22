/**
 * useTranscriptEditor Hook
 *
 * Provides editing operations for transcript segments.
 * Wraps the EditService and store actions into a convenient API.
 */

import { useCallback } from 'react';
import type { SegmentId, SpeakerId } from '@/modules/speech-engine/types';
import { useTranscriptStudioStore } from '../store';
import {
  createTextEdit,
  createSplitOperation,
  createMergeOperation,
  createDeleteOperation,
  createRestoreOperation,
  createSpeakerChangeOperation,
} from '../services/EditService';

/**
 * Hook providing transcript editing capabilities
 */
export function useTranscriptEditor() {
  const transcript = useTranscriptStudioStore((s) => s.transcript);
  const editLayer = useTranscriptStudioStore((s) => s.editLayer);
  const applyEdit = useTranscriptStudioStore((s) => s.applyEdit);
  const undo = useTranscriptStudioStore((s) => s.undo);
  const redo = useTranscriptStudioStore((s) => s.redo);
  const undoStack = useTranscriptStudioStore((s) => s.undoStack);
  const redoStack = useTranscriptStudioStore((s) => s.redoStack);
  const editingSegmentId = useTranscriptStudioStore((s) => s.editingSegmentId);
  const setEditingSegment = useTranscriptStudioStore((s) => s.setEditingSegment);

  /** Edit segment text */
  const editText = useCallback(
    (segmentId: SegmentId, newText: string) => {
      if (!transcript) return;

      const segment = transcript.segments.find((s) => s.id === segmentId);
      const previousText = editLayer.textEdits[segmentId] ?? segment?.text_display ?? '';
      if (previousText === newText) return;

      const operation = createTextEdit(segmentId, previousText, newText);
      applyEdit(operation);
    },
    [transcript, editLayer.textEdits, applyEdit]
  );

  /** Split segment at position */
  const splitSegment = useCallback(
    (segmentId: SegmentId, position: number) => {
      if (!transcript) return;

      const segment = transcript.segments.find((s) => s.id === segmentId);
      if (!segment) return;

      const operation = createSplitOperation(segmentId, segment, position);
      applyEdit(operation);
      setEditingSegment(null);
    },
    [transcript, applyEdit, setEditingSegment]
  );

  /** Merge multiple segments */
  const mergeSegments = useCallback(
    (segmentIds: SegmentId[]) => {
      if (!transcript || segmentIds.length < 2) return;

      const segments = segmentIds
        .map((id) => transcript.segments.find((s) => s.id === id))
        .filter((s): s is NonNullable<typeof s> => s !== undefined);

      if (segments.length < 2) return;

      const operation = createMergeOperation(segmentIds, segments);
      applyEdit(operation);
    },
    [transcript, applyEdit]
  );

  /** Delete segment */
  const deleteSegment = useCallback(
    (segmentId: SegmentId) => {
      if (!transcript) return;

      const segment = transcript.segments.find((s) => s.id === segmentId);
      const text = editLayer.textEdits[segmentId] ?? segment?.text_display ?? '';

      const operation = createDeleteOperation(segmentId, text);
      applyEdit(operation);
      setEditingSegment(null);
    },
    [transcript, editLayer.textEdits, applyEdit, setEditingSegment]
  );

  /** Restore deleted segment */
  const restoreSegment = useCallback(
    (segmentId: SegmentId) => {
      const operation = createRestoreOperation(segmentId);
      applyEdit(operation);
    },
    [applyEdit]
  );

  /** Change speaker assignment for a segment */
  const changeSpeaker = useCallback(
    (segmentId: SegmentId, newSpeakerId: SpeakerId) => {
      if (!transcript) return;

      const segment = transcript.segments.find((s) => s.id === segmentId);
      const previousSpeakerId = editLayer.speakerChanges[segmentId] ?? segment?.speaker_id;

      const operation = createSpeakerChangeOperation(
        segmentId,
        previousSpeakerId,
        newSpeakerId
      );
      applyEdit(operation);
    },
    [transcript, editLayer.speakerChanges, applyEdit]
  );

  return {
    editText,
    splitSegment,
    mergeSegments,
    deleteSegment,
    restoreSegment,
    changeSpeaker,
    undo,
    redo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    editingSegmentId,
    setEditingSegment,
  };
}
