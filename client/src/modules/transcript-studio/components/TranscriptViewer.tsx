/**
 * TranscriptViewer Component
 *
 * Renders the list of transcript segments with:
 * - Auto-scroll to active segment during playback
 * - Speaker visibility filtering
 * - Responsive layout for mobile
 */

import { useRef, useEffect } from 'react';
import { useTranscriptStudioStore } from '../store';
import { useSpeakerManager, useTranscriptEditor, useAudioSync } from '../hooks';
import { SegmentBlock } from './SegmentBlock';

export function TranscriptViewer() {
  const displaySegments = useTranscriptStudioStore((s) => s.displaySegments);
  const config = useTranscriptStudioStore((s) => s.config);
  const audio = useTranscriptStudioStore((s) => s.audio);

  const { getSpeakerName, getSpeakerColor, isSpeakerVisible, speakers } = useSpeakerManager();
  const { editText, splitSegment, deleteSegment, restoreSegment, changeSpeaker } =
    useTranscriptEditor();
  const { seek } = useAudioSync();

  const containerRef = useRef<HTMLDivElement>(null);
  const activeSegmentRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to active segment
  useEffect(() => {
    if (!config.autoScroll || !audio.activeSegmentId) return;

    const activeEl = containerRef.current?.querySelector(
      `[data-segment-id="${audio.activeSegmentId}"]`
    );
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [audio.activeSegmentId, config.autoScroll]);

  // Filter segments by speaker visibility
  const visibleSegments = displaySegments.filter((seg) =>
    isSpeakerVisible(seg.speakerId)
  );

  if (visibleSegments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral-400">
        <p className="text-sm">No segments to display</p>
      </div>
    );
  }

  const speakerOptions = speakers.map((s) => ({
    id: s.id,
    displayName: s.displayName,
  }));

  return (
    <div
      ref={containerRef}
      className="space-y-1 overflow-y-auto max-h-[calc(100vh-300px)] px-2 md:px-0"
      style={{ fontSize: `${config.fontSize}rem` }}
    >
      {visibleSegments.map((segment) => (
        <div key={segment.id} ref={segment.isActive ? activeSegmentRef : undefined}>
          <SegmentBlock
            segment={segment}
            speakerName={getSpeakerName(segment.speakerId)}
            speakerColor={getSpeakerColor(segment.speakerId)}
            showTimestamps={config.showTimestamps}
            showConfidence={config.showConfidence}
            showSpeakers={config.showSpeakers}
            onSeek={seek}
            onEditText={editText}
            onSplit={splitSegment}
            onDelete={deleteSegment}
            onRestore={restoreSegment}
            onChangeSpeaker={changeSpeaker}
            speakers={speakerOptions}
          />
        </div>
      ))}
    </div>
  );
}
