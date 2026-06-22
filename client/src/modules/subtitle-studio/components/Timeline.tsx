/**
 * Timeline Component
 *
 * Horizontal timeline visualization showing:
 * - Cue blocks positioned by time (width = duration, position = start)
 * - Draggable left/right edges for timing adjustment
 * - Playhead indicator
 * - Zoom controls (fit / 30s / 10s / 3s)
 * - Time ruler with tick marks
 *
 * Mobile: simplified view with tap-to-adjust edges (+/- 0.1s)
 */

import { useRef, useCallback, useEffect, useState } from 'react';
import { Button } from '@/shared/components';
import { useTimeline } from '../hooks/useTimeline';
import { useSubtitleStudioStore } from '../store';
import { TimelineService } from '../services/TimelineService';
import type { TimelineZoom, CueId } from '../types';

const ZOOM_LEVELS: TimelineZoom[] = ['fit', '30s', '10s', '3s'];

/**
 * Timeline visualization component
 */
export function Timeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidthLocal] = useState(900);
  const [dragState, setDragState] = useState<{
    cueId: CueId;
    edge: 'start' | 'end';
    startX: number;
  } | null>(null);

  const {
    timeline,
    changeZoom,
    seek,
    togglePlayPause,
    setContainerWidth,
    getPixelsPerSecond,
    tapAdjustStart,
    tapAdjustEnd,
  } = useTimeline();

  const cues = useSubtitleStudioStore((s) => s.cues);
  const activeCues = cues.filter((c) => !c.isDeleted);
  const updateCue = useSubtitleStudioStore((s) => s.updateCue);
  const pushHistory = useSubtitleStudioStore((s) => s.pushHistory);

  const pps = getPixelsPerSecond();
  const totalWidth = TimelineService.getTotalWidth(timeline.totalDuration, pps);

  /** Update container width on resize */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        setContainerWidthLocal(width);
        setContainerWidth(width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [setContainerWidth]);

  /** Handle click on timeline to seek */
  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left + (containerRef.current?.scrollLeft ?? 0);
      const time = TimelineService.pixelToTime(x, pps, 0);
      seek(time);
    },
    [pps, seek]
  );

  /** Handle mouse down on cue edge */
  const handleEdgeMouseDown = useCallback(
    (e: React.MouseEvent, cueId: CueId, edge: 'start' | 'end') => {
      e.stopPropagation();
      pushHistory(`Drag ${edge} edge`);
      setDragState({ cueId, edge, startX: e.clientX });
    },
    [pushHistory]
  );

  /** Handle mouse move during drag */
  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragState.startX;
      const deltaTime = deltaX / pps;
      const cue = cues.find((c) => c.id === dragState.cueId);
      if (!cue) return;

      const MIN_GAP = 0.08; // 80ms minimum gap between cues
      const sortedActive = activeCues.sort((a, b) => a.start - b.start);
      const cueIdx = sortedActive.findIndex((c) => c.id === dragState.cueId);

      if (dragState.edge === 'start') {
        let newStart = Math.max(0, cue.start + deltaTime);
        // Enforce min gap with previous cue
        if (cueIdx > 0) {
          const prevCue = sortedActive[cueIdx - 1];
          if (prevCue) {
            newStart = Math.max(newStart, prevCue.end + MIN_GAP);
          }
        }
        if (newStart < cue.end - 0.2) {
          updateCue(dragState.cueId, { start: newStart });
        }
      } else {
        let newEnd = Math.min(timeline.totalDuration, cue.end + deltaTime);
        // Enforce min gap with next cue
        if (cueIdx < sortedActive.length - 1) {
          const nextCue = sortedActive[cueIdx + 1];
          if (nextCue) {
            newEnd = Math.min(newEnd, nextCue.start - MIN_GAP);
          }
        }
        if (newEnd > cue.start + 0.2) {
          updateCue(dragState.cueId, { end: newEnd });
        }
      }
      setDragState({ ...dragState, startX: e.clientX });
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, pps, cues, timeline.totalDuration, updateCue]);

  /** Generate time ruler ticks */
  const ticks = [];
  const tickInterval = timeline.zoom === 'fit' ? Math.max(10, Math.floor(timeline.totalDuration / 10)) : timeline.zoom === '30s' ? 5 : timeline.zoom === '10s' ? 2 : 1;
  for (let t = 0; t <= timeline.totalDuration; t += tickInterval) {
    ticks.push(t);
  }

  return (
    <div className="border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900">
      {/* Zoom controls */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-neutral-200 dark:border-neutral-700">
        <span className="text-xs text-neutral-500">Zoom:</span>
        {ZOOM_LEVELS.map((level) => (
          <Button
            key={level}
            variant={timeline.zoom === level ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => changeZoom(level)}
          >
            {level}
          </Button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={togglePlayPause}>
            {timeline.isPlaying ? 'Pause' : 'Play'}
          </Button>
          <span className="text-xs font-mono text-neutral-500">
            {TimelineService.formatTime(timeline.playheadPosition)} / {TimelineService.formatTime(timeline.totalDuration)}
          </span>
        </div>
      </div>

      {/* Timeline track */}
      <div
        ref={containerRef}
        className="relative overflow-x-auto h-24 md:h-32 cursor-crosshair"
        onClick={handleTimelineClick}
      >
        {/* Time ruler */}
        <div className="absolute top-0 left-0 h-5 w-full" style={{ minWidth: `${totalWidth}px` }}>
          {ticks.map((t) => (
            <div
              key={t}
              className="absolute top-0 flex flex-col items-center"
              style={{ left: `${t * pps}px` }}
            >
              <div className="w-px h-3 bg-neutral-300 dark:bg-neutral-600" />
              <span className="text-[10px] text-neutral-400 font-mono mt-0.5">
                {TimelineService.formatTime(t)}
              </span>
            </div>
          ))}
        </div>

        {/* Cue blocks */}
        <div
          className="absolute top-6 left-0 right-0 bottom-0"
          style={{ minWidth: `${totalWidth}px` }}
        >
          {activeCues.map((cue) => {
            const left = cue.start * pps;
            const width = Math.max((cue.end - cue.start) * pps, 4);

            return (
              <div
                key={cue.id}
                className={`
                  absolute top-2 h-12 md:h-16 rounded border group
                  ${!cue.validation.isValid
                    ? 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700'
                    : 'bg-accent/20 border-accent/40 hover:bg-accent/30'}
                  transition-colors
                `}
                style={{ left: `${left}px`, width: `${width}px` }}
                title={`#${cue.sequenceIndex}: ${cue.text.substring(0, 40)}`}
              >
                {/* Left edge handle */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-accent/50 rounded-l hidden md:block"
                  onMouseDown={(e) => handleEdgeMouseDown(e, cue.id, 'start')}
                />

                {/* Cue content (truncated) */}
                <div className="px-2 py-1 overflow-hidden h-full flex items-center">
                  <span className="text-[10px] md:text-xs text-neutral-700 dark:text-neutral-300 truncate">
                    {cue.text.replace(/\n/g, ' ')}
                  </span>
                </div>

                {/* Right edge handle */}
                <div
                  className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-accent/50 rounded-r hidden md:block"
                  onMouseDown={(e) => handleEdgeMouseDown(e, cue.id, 'end')}
                />

                {/* Mobile tap targets */}
                <div className="md:hidden absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center">
                  <button
                    className="w-4 h-4 rounded-full bg-accent/30 text-[8px]"
                    onClick={(e) => {
                      e.stopPropagation();
                      tapAdjustStart(cue.id, 'earlier');
                    }}
                    aria-label="Adjust start earlier"
                  >
                    -
                  </button>
                </div>
                <div className="md:hidden absolute right-0 top-0 bottom-0 w-6 flex items-center justify-center">
                  <button
                    className="w-4 h-4 rounded-full bg-accent/30 text-[8px]"
                    onClick={(e) => {
                      e.stopPropagation();
                      tapAdjustEnd(cue.id, 'later');
                    }}
                    aria-label="Adjust end later"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
          style={{ left: `${timeline.playheadPosition * pps}px` }}
        >
          <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rounded-full" />
        </div>
      </div>
    </div>
  );
}
