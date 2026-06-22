/**
 * PreviewPanel Component
 *
 * Shows the current subtitle cue text at the playhead position in a
 * subtitle overlay style. Includes play/pause, seek, and navigation controls.
 *
 * Displays text centered at the bottom of a dark preview area, simulating
 * how subtitles appear on video content.
 */

import { useCallback } from 'react';
import { Button } from '@/shared/components';
import { useSubtitlePreview } from '../hooks/useSubtitlePreview';
import { useTimeline } from '../hooks/useTimeline';

/**
 * Preview panel showing subtitle overlay simulation
 */
export function PreviewPanel() {
  const {
    currentText,
    currentSpeaker,
    formattedPosition,
    formattedDuration,
    isPlaying,
    playheadPosition,
    totalDuration,
    nextCue,
    prevCue,
  } = useSubtitlePreview();

  const { togglePlayPause, seek } = useTimeline();

  /** Handle seek bar change */
  const handleSeekChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      seek(parseFloat(e.target.value));
    },
    [seek]
  );

  return (
    <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
      {/* Preview viewport */}
      <div className="relative bg-neutral-900 h-32 md:h-44 flex items-end justify-center p-4">
        {/* Subtitle text overlay */}
        {currentText ? (
          <div className="text-center max-w-[90%]">
            {currentSpeaker && (
              <span className="text-[10px] text-neutral-400 block mb-1">
                {currentSpeaker}
              </span>
            )}
            <p className="text-white text-sm md:text-base font-medium bg-black/70 px-3 py-1.5 rounded whitespace-pre-wrap leading-relaxed">
              {currentText}
            </p>
          </div>
        ) : (
          <p className="text-neutral-500 text-xs italic">
            No subtitle at current position
          </p>
        )}
      </div>

      {/* Transport controls */}
      <div className="bg-neutral-100 dark:bg-neutral-800 px-3 py-2 space-y-2">
        {/* Seek bar */}
        <input
          type="range"
          min={0}
          max={totalDuration}
          step={0.1}
          value={playheadPosition}
          onChange={handleSeekChange}
          className="w-full h-1 accent-accent cursor-pointer"
          aria-label="Seek position"
        />

        {/* Controls row */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-neutral-500">
            {formattedPosition}
          </span>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={prevCue}>
              Prev
            </Button>
            <Button variant="primary" size="sm" onClick={togglePlayPause}>
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button variant="ghost" size="sm" onClick={nextCue}>
              Next
            </Button>
          </div>

          <span className="text-xs font-mono text-neutral-500">
            {formattedDuration}
          </span>
        </div>
      </div>
    </div>
  );
}
