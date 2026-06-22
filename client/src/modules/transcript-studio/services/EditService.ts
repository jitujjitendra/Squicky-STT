/**
 * EditService
 *
 * Handles all transcript editing operations: text edits, segment splits,
 * segment merges, deletions, restorations, and speaker changes.
 * Each operation returns an EditOperation for undo/redo tracking.
 */

import type { SegmentId, SpeakerId, TranscriptSegment } from '@/modules/speech-engine/types';
import type { EditOperation, EditLayer } from '../types';

/** Generate a unique operation ID */
function generateOpId(): string {
  return `op_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Generate a unique segment ID */
function generateSegmentId(): SegmentId {
  return `seg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}` as SegmentId;
}

/**
 * Creates an edit text operation
 */
export function createTextEdit(
  segmentId: SegmentId,
  previousText: string,
  newText: string
): EditOperation {
  return {
    id: generateOpId(),
    type: 'edit_text',
    timestamp: Date.now(),
    segmentIds: [segmentId],
    previousValue: previousText,
    newValue: newText,
  };
}

/**
 * Creates a split segment operation
 */
export function createSplitOperation(
  segmentId: SegmentId,
  segment: TranscriptSegment,
  splitPosition: number
): EditOperation {
  const text = segment.text_display;
  const firstText = text.slice(0, splitPosition).trim();
  const secondText = text.slice(splitPosition).trim();

  const totalDuration = segment.end - segment.start;
  const ratio = splitPosition / text.length;
  const splitTime = segment.start + totalDuration * ratio;

  const newSegments = [
    {
      id: generateSegmentId(),
      text: firstText,
      start: segment.start,
      end: splitTime,
    },
    {
      id: generateSegmentId(),
      text: secondText,
      start: splitTime,
      end: segment.end,
    },
  ];

  return {
    id: generateOpId(),
    type: 'split_segment',
    timestamp: Date.now(),
    segmentIds: [segmentId],
    previousValue: { text: segment.text_display, start: segment.start, end: segment.end },
    newValue: newSegments,
  };
}

/**
 * Creates a merge segments operation
 */
export function createMergeOperation(
  segmentIds: SegmentId[],
  segments: TranscriptSegment[]
): EditOperation {
  return {
    id: generateOpId(),
    type: 'merge_segments',
    timestamp: Date.now(),
    segmentIds,
    previousValue: segments.map((s) => ({
      id: s.id,
      text: s.text_display,
      start: s.start,
      end: s.end,
    })),
    newValue: {
      targetId: segmentIds[0],
      mergedIds: segmentIds.slice(1),
      text: segments.map((s) => s.text_display).join(' '),
      start: segments[0]?.start ?? 0,
      end: segments[segments.length - 1]?.end ?? 0,
    },
  };
}

/**
 * Creates a delete segment operation
 */
export function createDeleteOperation(
  segmentId: SegmentId,
  segmentText: string
): EditOperation {
  return {
    id: generateOpId(),
    type: 'delete_segment',
    timestamp: Date.now(),
    segmentIds: [segmentId],
    previousValue: segmentText,
    newValue: null,
  };
}

/**
 * Creates a restore segment operation
 */
export function createRestoreOperation(
  segmentId: SegmentId
): EditOperation {
  return {
    id: generateOpId(),
    type: 'restore_segment',
    timestamp: Date.now(),
    segmentIds: [segmentId],
    previousValue: null,
    newValue: segmentId,
  };
}

/**
 * Creates a change speaker operation
 */
export function createSpeakerChangeOperation(
  segmentId: SegmentId,
  previousSpeakerId: SpeakerId | undefined,
  newSpeakerId: SpeakerId
): EditOperation {
  return {
    id: generateOpId(),
    type: 'change_speaker',
    timestamp: Date.now(),
    segmentIds: [segmentId],
    previousValue: previousSpeakerId ?? null,
    newValue: newSpeakerId,
  };
}

/**
 * Creates a rename speaker operation
 */
export function createSpeakerRenameOperation(
  speakerId: SpeakerId,
  previousName: string,
  newName: string
): EditOperation {
  return {
    id: generateOpId(),
    type: 'rename_speaker',
    timestamp: Date.now(),
    segmentIds: [speakerId as unknown as SegmentId],
    previousValue: previousName,
    newValue: newName,
  };
}

/**
 * Applies an edit operation to the edit layer
 */
export function applyOperation(layer: EditLayer, operation: EditOperation): EditLayer {
  const newLayer = { ...layer };

  switch (operation.type) {
    case 'edit_text': {
      const segId = operation.segmentIds[0] as string;
      newLayer.textEdits = { ...layer.textEdits, [segId]: operation.newValue as string };
      break;
    }
    case 'split_segment': {
      const segId = operation.segmentIds[0] as string;
      const newSegments = operation.newValue as Array<{ id: string; text: string; start: number; end: number }>;
      newLayer.splits = { ...layer.splits, [segId]: newSegments };
      break;
    }
    case 'merge_segments': {
      const mergeData = operation.newValue as { targetId: string; mergedIds: string[]; text: string };
      newLayer.merges = { ...layer.merges, [mergeData.targetId]: mergeData.mergedIds };
      newLayer.textEdits = { ...layer.textEdits, [mergeData.targetId]: mergeData.text };
      newLayer.deletedSegments = [...layer.deletedSegments, ...mergeData.mergedIds];
      break;
    }
    case 'delete_segment': {
      const segId = operation.segmentIds[0] as string;
      newLayer.deletedSegments = [...layer.deletedSegments, segId];
      break;
    }
    case 'restore_segment': {
      const segId = operation.segmentIds[0] as string;
      newLayer.deletedSegments = layer.deletedSegments.filter((id) => id !== segId);
      break;
    }
    case 'change_speaker': {
      const segId = operation.segmentIds[0] as string;
      newLayer.speakerChanges = { ...layer.speakerChanges, [segId]: operation.newValue as SpeakerId };
      break;
    }
    case 'rename_speaker': {
      const speakerId = operation.segmentIds[0] as string;
      newLayer.speakerRenames = { ...layer.speakerRenames, [speakerId]: operation.newValue as string };
      break;
    }
  }

  return newLayer;
}

/**
 * Reverts an edit operation from the edit layer
 */
export function revertOperation(layer: EditLayer, operation: EditOperation): EditLayer {
  const newLayer = { ...layer };

  switch (operation.type) {
    case 'edit_text': {
      const segId = operation.segmentIds[0] as string;
      const prev = operation.previousValue as string;
      if (prev === '') {
        const { [segId]: _, ...rest } = layer.textEdits;
        void _;
        newLayer.textEdits = rest;
      } else {
        newLayer.textEdits = { ...layer.textEdits, [segId]: prev };
      }
      break;
    }
    case 'split_segment': {
      const segId = operation.segmentIds[0] as string;
      const { [segId]: _, ...rest } = layer.splits;
      void _;
      newLayer.splits = rest;
      break;
    }
    case 'merge_segments': {
      const mergeData = operation.newValue as { targetId: string; mergedIds: string[]; text: string };
      const { [mergeData.targetId]: _m, ...restMerges } = layer.merges;
      void _m;
      newLayer.merges = restMerges;
      const { [mergeData.targetId]: _t, ...restEdits } = layer.textEdits;
      void _t;
      newLayer.textEdits = restEdits;
      newLayer.deletedSegments = layer.deletedSegments.filter(
        (id) => !mergeData.mergedIds.includes(id)
      );
      break;
    }
    case 'delete_segment': {
      const segId = operation.segmentIds[0] as string;
      newLayer.deletedSegments = layer.deletedSegments.filter((id) => id !== segId);
      break;
    }
    case 'restore_segment': {
      const segId = operation.segmentIds[0] as string;
      newLayer.deletedSegments = [...layer.deletedSegments, segId];
      break;
    }
    case 'change_speaker': {
      const segId = operation.segmentIds[0] as string;
      const prev = operation.previousValue as SpeakerId | null;
      if (prev === null) {
        const { [segId]: _, ...rest } = layer.speakerChanges;
        void _;
        newLayer.speakerChanges = rest;
      } else {
        newLayer.speakerChanges = { ...layer.speakerChanges, [segId]: prev };
      }
      break;
    }
    case 'rename_speaker': {
      const speakerId = operation.segmentIds[0] as string;
      const prev = operation.previousValue as string;
      if (prev === '') {
        const { [speakerId]: _, ...rest } = layer.speakerRenames;
        void _;
        newLayer.speakerRenames = rest;
      } else {
        newLayer.speakerRenames = { ...layer.speakerRenames, [speakerId]: prev };
      }
      break;
    }
  }

  return newLayer;
}
