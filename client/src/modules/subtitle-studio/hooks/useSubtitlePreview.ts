/**
 * useSubtitlePreview Hook
 *
 * Provides subtitle preview functionality: shows the current cue text
 * at the playhead position in an overlay style, supports play/pause/seek.
 */

import { useCallback } from 'react';
import { useSubtitleStudioStore } from '../store';
import { TimelineService } from '../services/TimelineService';

/**
 * Hook for subtitle preview playback
 */
export function useSubtitlePreview() {
  const cues = useSubtitleStudioStore((s) => s.cues);
  const timeline = useSubtitleStudioStore((s) => s.timeline);
  const setPlayheadPosition = useSubtitleStudioStore((s) => s.setPlayheadPosition);

  /** Active (non-deleted) cues */
  const activeCues = cues.filter((c) => !c.isDeleted);

  /** Current cue at playhead position */
  const currentCue = TimelineService.getCueAtPosition(activeCues, timeline.playheadPosition);

  /** Current cue text for display */
  const currentText = currentCue?.text ?? '';

  /** Current speaker info */
  const currentSpeaker = currentCue?.speakerName ?? null;

  /**
   * Seek to a specific time
   */
  const seekTo = useCallback(
    (time: number) => {
      setPlayheadPosition(Math.max(0, Math.min(time, timeline.totalDuration)));
    },
    [setPlayheadPosition, timeline.totalDuration]
  );

  /**
   * Go to next cue
   */
  const nextCue = useCallback(() => {
    const sorted = [...activeCues].sort((a, b) => a.start - b.start);
    const next = sorted.find((c) => c.start > timeline.playheadPosition);
    if (next) {
      setPlayheadPosition(next.start);
    }
  }, [activeCues, timeline.playheadPosition, setPlayheadPosition]);

  /**
   * Go to previous cue
   */
  const prevCue = useCallback(() => {
    const sorted = [...activeCues].sort((a, b) => b.start - a.start);
    const prev = sorted.find((c) => c.start < timeline.playheadPosition - 0.1);
    if (prev) {
      setPlayheadPosition(prev.start);
    }
  }, [activeCues, timeline.playheadPosition, setPlayheadPosition]);

  /** Format playhead position for display */
  const formattedPosition = TimelineService.formatTime(timeline.playheadPosition);
  const formattedDuration = TimelineService.formatTime(timeline.totalDuration);

  return {
    currentCue,
    currentText,
    currentSpeaker,
    playheadPosition: timeline.playheadPosition,
    totalDuration: timeline.totalDuration,
    isPlaying: timeline.isPlaying,
    formattedPosition,
    formattedDuration,
    seekTo,
    nextCue,
    prevCue,
  };
}
