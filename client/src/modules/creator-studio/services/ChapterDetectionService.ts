/**
 * ChapterDetectionService
 *
 * Detects chapter boundaries from transcript segments using topic_boundary_hint
 * markers. Falls back to equal time divisions if fewer than 3 boundaries exist.
 * Always prepends "0:00 Introduction" as the first chapter.
 *
 * Algorithm:
 * 1. Find segments with topic_boundary_hint === true
 * 2. If >= 3 boundaries: use them directly
 * 3. If < 3: divide transcript duration into equal segments
 * 4. Title each chapter from top 2 keywords in that segment range
 * 5. Always ensure "0:00 Introduction" is first
 */

import type { TranscriptSegment } from '@/modules/speech-engine/types';
import type { ChapterMarker } from '../types';
import type { DetectedTopic, ScoredKeyword } from '@/modules/content-studio/types';

/**
 * Format seconds into "M:SS" or "H:MM:SS" timestamp string
 */
export function formatTimestamp(seconds: number): string {
  const totalSec = Math.floor(Math.max(0, seconds));
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

/**
 * Generate a chapter title from top keywords
 */
function chapterTitle(keywords: ScoredKeyword[]): string {
  if (keywords.length === 0) return 'Discussion';
  const top = keywords.slice(0, 2).map((k) => {
    const term = k.term;
    return term.charAt(0).toUpperCase() + term.slice(1);
  });
  return top.join(' & ');
}

/**
 * Detect chapters from transcript segments and detected topics.
 *
 * @param segments - Ordered transcript segments
 * @param topics - Detected topics from ContentIntelligenceCache
 * @returns Array of chapter markers, always starting with "0:00 Introduction"
 */
export function detectChapters(
  segments: TranscriptSegment[],
  topics: DetectedTopic[]
): ChapterMarker[] {
  if (segments.length === 0) return [];

  const totalDuration = segments[segments.length - 1]!.end;

  // Find segments with topic_boundary_hint
  const boundaryIndices = segments
    .map((seg, idx) => (seg.topic_boundary_hint ? idx : -1))
    .filter((idx) => idx >= 0);

  let chapters: ChapterMarker[];

  if (boundaryIndices.length >= 3) {
    // Use topic boundaries directly
    chapters = boundaryIndices.map((segIdx) => {
      const seg = segments[segIdx]!;
      // Find the topic that contains this segment
      const topic = topics.find(
        (t) => t.startIndex <= segIdx && t.endIndex > segIdx
      );
      const title = topic ? chapterTitle(topic.keywords) : 'Discussion';

      return {
        timestamp: seg.start,
        formattedTime: formatTimestamp(seg.start),
        title,
      };
    });
  } else {
    // Fall back to equal time divisions (minimum 3 chapters)
    const chapterCount = Math.max(3, Math.min(topics.length, 6));
    const interval = totalDuration / chapterCount;

    chapters = [];
    for (let i = 0; i < chapterCount; i++) {
      const timestamp = i * interval;
      // Find the nearest segment to this timestamp
      const nearestIdx = segments.findIndex((s) => s.start >= timestamp);
      const segIdx = nearestIdx >= 0 ? nearestIdx : segments.length - 1;

      // Find topic for this position
      const topic = topics.find(
        (t) => t.startIndex <= segIdx && t.endIndex > segIdx
      );
      const title = topic ? chapterTitle(topic.keywords) : `Part ${i + 1}`;

      chapters.push({
        timestamp,
        formattedTime: formatTimestamp(timestamp),
        title,
      });
    }
  }

  // Ensure "0:00 Introduction" is always first
  if (chapters.length === 0 || chapters[0]!.timestamp > 0) {
    chapters.unshift({
      timestamp: 0,
      formattedTime: '0:00',
      title: 'Introduction',
    });
  } else {
    chapters[0] = {
      timestamp: 0,
      formattedTime: '0:00',
      title: 'Introduction',
    };
  }

  // Sort by timestamp and deduplicate
  chapters.sort((a, b) => a.timestamp - b.timestamp);

  // Remove duplicate timestamps
  const seen = new Set<string>();
  chapters = chapters.filter((ch) => {
    if (seen.has(ch.formattedTime)) return false;
    seen.add(ch.formattedTime);
    return true;
  });

  return chapters;
}
