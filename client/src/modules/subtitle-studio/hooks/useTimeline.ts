/**
 * useTimeline Hook
 *
 * Manages timeline interaction state: zoom controls, scroll position,
 * playhead movement, drag-to-resize cue edges, and viewport calculations.
 */

import { useCallback, useRef, useEffect } from 'react';
import { useSubtitleStudioStore } from '../store';
import { TimelineService } from '../services/TimelineService';
import type { TimelineZoom, CueId } from '../types';

/**
 * Hook for timeline interactions
 */
export function useTimeline() {
  const timeline = useSubtitleStudioStore((s) => s.timeline);
  const cues = useSubtitleStudioStore((s) => s.cues);
  const setZoom = useSubtitleStudioStore((s) => s.setZoom);
  const setScrollOffset = useSubtitleStudioStore((s) => s.setScrollOffset);
  const setPlayheadPosition = useSubtitleStudioStore((s) => s.setPlayheadPosition);
  const setIsPlaying = useSubtitleStudioStore((s) => s.setIsPlaying);
  const updateCue = useSubtitleStudioStore((s) => s.updateCue);
  const pushHistory = useSubtitleStudioStore((s) => s.pushHistory);

  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerWidthRef = useRef(900);

  /**
   * Update container width reference
   */
  const setContainerWidth = useCallback((width: number) => {
    containerWidthRef.current = width;
  }, []);

  /**
   * Get pixels per second for current zoom
   */
  const getPixelsPerSecond = useCallback(() => {
    return TimelineService.getPixelsPerSecond(
      timeline.zoom,
      containerWidthRef.current,
      timeline.totalDuration
    );
  }, [timeline.zoom, timeline.totalDuration]);

  /**
   * Change zoom level
   */
  const changeZoom = useCallback(
    (zoom: TimelineZoom) => {
      setZoom(zoom);
    },
    [setZoom]
  );

  /**
   * Seek playhead to a specific time
   */
  const seek = useCallback(
    (time: number) => {
      const clamped = TimelineService.clampTime(time, 0, timeline.totalDuration);
      setPlayheadPosition(clamped);
    },
    [setPlayheadPosition, timeline.totalDuration]
  );

  /**
   * Toggle play/pause
   */
  const togglePlayPause = useCallback(() => {
    if (timeline.isPlaying) {
      // Pause
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
      setIsPlaying(false);
    } else {
      // Play
      setIsPlaying(true);
      playIntervalRef.current = setInterval(() => {
        const state = useSubtitleStudioStore.getState();
        const newPos = state.timeline.playheadPosition + 0.1;
        if (newPos >= state.timeline.totalDuration) {
          setPlayheadPosition(0);
          setIsPlaying(false);
          if (playIntervalRef.current) {
            clearInterval(playIntervalRef.current);
            playIntervalRef.current = null;
          }
        } else {
          setPlayheadPosition(newPos);
        }
      }, 100);
    }
  }, [timeline.isPlaying, setIsPlaying, setPlayheadPosition]);

  /**
   * Drag left edge of a cue to adjust start time
   */
  const dragCueStart = useCallback(
    (cueId: CueId, deltaSeconds: number) => {
      const cue = cues.find((c) => c.id === cueId);
      if (!cue) return;
      const newStart = Math.max(0, cue.start + deltaSeconds);
      if (newStart < cue.end - 0.2) {
        updateCue(cueId, { start: newStart });
      }
    },
    [cues, updateCue]
  );

  /**
   * Drag right edge of a cue to adjust end time
   */
  const dragCueEnd = useCallback(
    (cueId: CueId, deltaSeconds: number) => {
      const cue = cues.find((c) => c.id === cueId);
      if (!cue) return;
      const newEnd = Math.min(timeline.totalDuration, cue.end + deltaSeconds);
      if (newEnd > cue.start + 0.2) {
        updateCue(cueId, { end: newEnd });
      }
    },
    [cues, timeline.totalDuration, updateCue]
  );

  /**
   * Mobile: tap left/right edges to adjust by 0.1s
   */
  const tapAdjustStart = useCallback(
    (cueId: CueId, direction: 'earlier' | 'later') => {
      pushHistory('Tap adjust start');
      const delta = direction === 'earlier' ? -0.1 : 0.1;
      dragCueStart(cueId, delta);
    },
    [pushHistory, dragCueStart]
  );

  const tapAdjustEnd = useCallback(
    (cueId: CueId, direction: 'earlier' | 'later') => {
      pushHistory('Tap adjust end');
      const delta = direction === 'earlier' ? -0.1 : 0.1;
      dragCueEnd(cueId, delta);
    },
    [pushHistory, dragCueEnd]
  );

  /**
   * Get the current cue at playhead
   */
  const currentCue = TimelineService.getCueAtPosition(
    cues.filter((c) => !c.isDeleted),
    timeline.playheadPosition
  );

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, []);

  return {
    timeline,
    currentCue,
    getPixelsPerSecond,
    setContainerWidth,
    changeZoom,
    seek,
    togglePlayPause,
    dragCueStart,
    dragCueEnd,
    tapAdjustStart,
    tapAdjustEnd,
    setScrollOffset,
  };
}
