/**
 * Timeline Service
 *
 * Provides timeline computation utilities for the subtitle editor:
 * - Time-to-pixel and pixel-to-time conversions
 * - Zoom level calculations
 * - Visible range computation
 * - Playhead position tracking
 * - Cue positioning within the timeline viewport
 */

import type { TimelineZoom, SubtitleCue } from '../types';

/** Pixels per second at each zoom level */
const ZOOM_PPS: Record<TimelineZoom, number | null> = {
  fit: null, // Calculated dynamically based on container width and duration
  '30s': 30, // 30 pixels per second (30s visible in ~900px)
  '10s': 90, // 90 pixels per second (10s visible in ~900px)
  '3s': 300, // 300 pixels per second (3s visible in ~900px)
};

/**
 * Timeline computation service
 */
export const TimelineService = {
  /**
   * Get pixels per second for a given zoom level
   * @param zoom - Current zoom level
   * @param containerWidth - Container width in pixels
   * @param totalDuration - Total timeline duration in seconds
   * @returns Pixels per second
   */
  getPixelsPerSecond(zoom: TimelineZoom, containerWidth: number, totalDuration: number): number {
    if (zoom === 'fit') {
      return containerWidth / Math.max(totalDuration, 1);
    }
    return ZOOM_PPS[zoom] ?? 30;
  },

  /**
   * Convert time (seconds) to pixel position
   * @param time - Time in seconds
   * @param pps - Pixels per second
   * @param scrollOffset - Scroll offset in seconds
   * @returns Pixel position
   */
  timeToPixel(time: number, pps: number, scrollOffset: number): number {
    return (time - scrollOffset) * pps;
  },

  /**
   * Convert pixel position to time (seconds)
   * @param pixel - Pixel position
   * @param pps - Pixels per second
   * @param scrollOffset - Scroll offset in seconds
   * @returns Time in seconds
   */
  pixelToTime(pixel: number, pps: number, scrollOffset: number): number {
    return pixel / pps + scrollOffset;
  },

  /**
   * Get the visible time range for the current viewport
   * @param scrollOffset - Scroll offset in seconds
   * @param containerWidth - Container width in pixels
   * @param pps - Pixels per second
   * @returns Start and end time of visible range
   */
  getVisibleRange(
    scrollOffset: number,
    containerWidth: number,
    pps: number
  ): { start: number; end: number } {
    const visibleDuration = containerWidth / pps;
    return {
      start: scrollOffset,
      end: scrollOffset + visibleDuration,
    };
  },

  /**
   * Get cues visible in the current viewport
   * @param cues - All cues
   * @param visibleStart - Visible range start time
   * @param visibleEnd - Visible range end time
   * @returns Filtered cues that overlap the visible range
   */
  getVisibleCues(
    cues: SubtitleCue[],
    visibleStart: number,
    visibleEnd: number
  ): SubtitleCue[] {
    return cues.filter(
      (cue) => !cue.isDeleted && cue.end > visibleStart && cue.start < visibleEnd
    );
  },

  /**
   * Calculate the total timeline width in pixels
   * @param totalDuration - Total duration in seconds
   * @param pps - Pixels per second
   * @returns Total width in pixels
   */
  getTotalWidth(totalDuration: number, pps: number): number {
    return totalDuration * pps;
  },

  /**
   * Clamp a time value to valid bounds
   * @param time - Time value to clamp
   * @param min - Minimum time (usually 0)
   * @param max - Maximum time (total duration)
   * @returns Clamped time value
   */
  clampTime(time: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, time));
  },

  /**
   * Find the cue at a given playhead position
   * @param cues - All cues
   * @param position - Playhead position in seconds
   * @returns The cue at that position, or undefined
   */
  getCueAtPosition(cues: SubtitleCue[], position: number): SubtitleCue | undefined {
    return cues.find(
      (cue) => !cue.isDeleted && position >= cue.start && position <= cue.end
    );
  },

  /**
   * Format time in seconds to MM:SS.ms display
   * @param seconds - Time in seconds
   * @returns Formatted time string
   */
  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toFixed(1).padStart(4, '0')}`;
  },

  /**
   * Format time in seconds to HH:MM:SS.mmm for SRT/VTT
   * @param seconds - Time in seconds
   * @returns Formatted time string
   */
  formatTimecode(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.round((seconds % 1) * 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  },
};
