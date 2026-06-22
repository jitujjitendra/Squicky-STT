/**
 * MergeService
 *
 * Computes the display layer by merging the source transcript
 * with the edit layer overlays and search state.
 *
 * Architecture: This service produces DisplaySegment[] which
 * the TranscriptViewer consumes directly for rendering.
 */

import type { StandardTranscript, SegmentId } from '@/modules/speech-engine/types';
import type { EditLayer, DisplaySegment, SearchMatch } from '../types';

/**
 * Compute display segments by merging source transcript with edit layer
 */
export function computeDisplaySegments(
  transcript: StandardTranscript,
  editLayer: EditLayer,
  activeSegmentId: SegmentId | null,
  searchMatches: SearchMatch[]
): DisplaySegment[] {
  const segments: DisplaySegment[] = [];

  for (const segment of transcript.segments) {
    // Check if segment was split
    if (editLayer.splits[segment.id]) {
      const splitParts = editLayer.splits[segment.id];
      if (splitParts) {
        for (const part of splitParts) {
          const partId = part.id as SegmentId;
          const isDeleted = editLayer.deletedSegments.includes(part.id);
          const editedText = editLayer.textEdits[part.id];
          const partMatches = searchMatches.filter((m) => m.segmentId === partId);

          segments.push({
            id: partId,
            text: editedText ?? part.text,
            originalText: part.text,
            start: part.start,
            end: part.end,
            speakerId: editLayer.speakerChanges[part.id] ?? segment.speaker_id,
            confidence: segment.confidence,
            isEdited: editedText !== undefined,
            isDeleted,
            isActive: partId === activeSegmentId,
            searchMatches: partMatches,
            sequenceIndex: segment.sequence_index,
          });
        }
        continue;
      }
    }

    // Skip if this segment was merged into another
    const isMerged = Object.values(editLayer.merges).some(
      (mergedIds) => mergedIds.includes(segment.id)
    );
    if (isMerged) continue;

    const isDeleted = editLayer.deletedSegments.includes(segment.id);
    const editedText = editLayer.textEdits[segment.id];
    const segmentMatches = searchMatches.filter((m) => m.segmentId === segment.id);

    segments.push({
      id: segment.id,
      text: editedText ?? segment.text_display,
      originalText: segment.text_display,
      start: segment.start,
      end: segment.end,
      speakerId: editLayer.speakerChanges[segment.id] ?? segment.speaker_id,
      confidence: segment.confidence,
      isEdited: editedText !== undefined || editLayer.merges[segment.id] !== undefined,
      isDeleted,
      isActive: segment.id === activeSegmentId,
      searchMatches: segmentMatches,
      sequenceIndex: segment.sequence_index,
    });
  }

  return segments.sort((a, b) => a.sequenceIndex - b.sequenceIndex);
}

/**
 * Compute transcript statistics from display segments
 */
export function computeStats(
  transcript: StandardTranscript,
  displaySegments: DisplaySegment[]
): {
  wordCount: number;
  segmentCount: number;
  speakerCount: number;
  duration: number;
  qualityLabel: string;
  qualityScore: number;
} {
  const visibleSegments = displaySegments.filter((s) => !s.isDeleted);
  const wordCount = visibleSegments.reduce(
    (total, seg) => total + seg.text.split(/\s+/).filter(Boolean).length,
    0
  );

  const speakers = new Set(visibleSegments.map((s) => s.speakerId).filter(Boolean));

  return {
    wordCount,
    segmentCount: visibleSegments.length,
    speakerCount: speakers.size,
    duration: transcript.source.duration_seconds,
    qualityLabel: transcript.transcription_meta.quality.quality_label,
    qualityScore: transcript.transcription_meta.quality.quality_score,
  };
}
