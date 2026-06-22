/**
 * SearchService
 *
 * Provides keyword search within transcript segments.
 * Returns match positions for highlighting and navigation.
 */

import type { SegmentId, TranscriptSegment } from '@/modules/speech-engine/types';
import type { SearchMatch, EditLayer } from '../types';

/**
 * Search through transcript segments and return all matches
 */
export function searchTranscript(
  segments: TranscriptSegment[],
  editLayer: EditLayer,
  query: string,
  caseSensitive: boolean
): SearchMatch[] {
  if (!query.trim()) {
    return [];
  }

  const matches: SearchMatch[] = [];
  let matchIndex = 0;

  const searchQuery = caseSensitive ? query : query.toLowerCase();

  for (const segment of segments) {
    // Skip deleted segments
    if (editLayer.deletedSegments.includes(segment.id)) {
      continue;
    }

    // Use edited text if available, otherwise use display text
    const text = editLayer.textEdits[segment.id] ?? segment.text_display;
    const searchText = caseSensitive ? text : text.toLowerCase();

    let startPos = 0;
    while (startPos < searchText.length) {
      const foundIndex = searchText.indexOf(searchQuery, startPos);
      if (foundIndex === -1) break;

      matches.push({
        segmentId: segment.id,
        startOffset: foundIndex,
        length: query.length,
        index: matchIndex++,
      });

      startPos = foundIndex + 1;
    }
  }

  return matches;
}

/**
 * Get matches for a specific segment
 */
export function getSegmentMatches(
  matches: SearchMatch[],
  segmentId: SegmentId
): SearchMatch[] {
  return matches.filter((m) => m.segmentId === segmentId);
}

/**
 * Navigate to next match
 */
export function getNextMatchIndex(currentIndex: number, totalMatches: number): number {
  if (totalMatches === 0) return -1;
  return (currentIndex + 1) % totalMatches;
}

/**
 * Navigate to previous match
 */
export function getPrevMatchIndex(currentIndex: number, totalMatches: number): number {
  if (totalMatches === 0) return -1;
  return currentIndex <= 0 ? totalMatches - 1 : currentIndex - 1;
}
