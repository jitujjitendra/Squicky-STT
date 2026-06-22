/**
 * Deadline Detector
 *
 * Detects deadline references in transcript segments. Stores RAW TEXT only
 * (no date resolution at Stage 1). Handles explicit dates, relative time
 * expressions, and Hindi/Hinglish variants.
 *
 * Pattern categories:
 * - Explicit: "by Friday", "before March 15th"
 * - Relative: "tomorrow", "next week", "in two days"
 * - Hindi: "kal tak", "is hafte", "agle mahine"
 *
 * Architecture decision: Raw text only. Date resolution is a Stage 2 feature.
 * Storing raw text preserves the original speaker intent without making
 * assumptions about calendar context.
 */

import type { TranscriptSegment } from '@/modules/speech-engine/types';
import type { Deadline } from '../types';

/** Deadline patterns that capture the raw deadline text */
const DEADLINE_PATTERNS: RegExp[] = [
  // Explicit dates
  /\bby\s+((?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b)/i,
  /\bby\s+((?:end\s+of\s+(?:day|week|month|quarter|year)))/i,
  /\bbefore\s+((?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:st|nd|rd|th)?)/i,
  /\bby\s+((?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:st|nd|rd|th)?)/i,
  /\bdue\s+(?:on\s+|by\s+)?((?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|next\s+\w+)\b)/i,
  /\bdeadline\s*(?:is|:)\s*(.{3,40}?)(?:\.|,|$)/i,

  // Relative time
  /\b(tomorrow)\b/i,
  /\b(next\s+(?:week|month|monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/i,
  /\b(in\s+(?:two|three|four|five|2|3|4|5)\s+(?:days|weeks|hours))\b/i,
  /\b(end\s+of\s+(?:this|the)\s+(?:week|month|sprint|quarter))\b/i,
  /\b(this\s+(?:friday|week|month))\b/i,

  // Hindi/Hinglish deadline patterns
  /\b(kal\s+tak)\b/i,
  /\b(parso\s+tak)\b/i,
  /\b(is\s+hafte)\b/i,
  /\b(agle\s+hafte)\b/i,
  /\b(agle\s+mahine)\b/i,
  /\b(is\s+mahine\s+(?:ke\s+)?end\s+tak)\b/i,
];

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `dl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Detect deadline references from transcript segments.
 *
 * @param segments - Transcript segments
 * @returns Array of detected deadlines with raw text
 */
export function detectDeadlines(segments: TranscriptSegment[]): Deadline[] {
  const deadlines: Deadline[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]!;
    const text = segment.text_display || segment.text;

    for (const pattern of DEADLINE_PATTERNS) {
      const match = text.match(pattern);
      if (match && match[1]) {
        deadlines.push({
          id: generateId(),
          rawText: match[1].trim(),
          context: text.trim(),
          status: 'suggested',
          segmentIndex: i,
        });
        break; // One deadline per segment
      }
    }
  }

  return deadlines;
}
