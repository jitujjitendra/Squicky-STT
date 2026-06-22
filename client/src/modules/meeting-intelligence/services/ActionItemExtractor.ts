/**
 * Action Item Extractor
 *
 * Extracts action items from transcript segments using pattern matching
 * for both English and Hindi/Hinglish phrases. Resolves assignees via
 * speaker attribution.
 *
 * Patterns:
 * - EN: "will", "need to", "should", "must", "have to", "going to"
 * - HI: "karna padega", "main karunga", "kal tak", "karna hai"
 *
 * Architecture decision: Pattern-based extraction with no AI dependency.
 * All items start as "suggested" requiring human confirmation.
 */

import type { TranscriptSegment, SpeakerEntry, SpeakerId } from '@/modules/speech-engine/types';
import type { ActionItem, Priority } from '../types';

/** English action patterns (regex) */
const EN_ACTION_PATTERNS: RegExp[] = [
  /\b(?:i|we|he|she|they)\s+will\s+(.{10,80})/i,
  /\bneed\s+to\s+(.{10,80})/i,
  /\bshould\s+(.{10,80})/i,
  /\bmust\s+(.{10,80})/i,
  /\bhave\s+to\s+(.{10,80})/i,
  /\bgoing\s+to\s+(.{10,80})/i,
  /\blet(?:'s|s)\s+(.{10,80})/i,
  /\bplease\s+(.{10,80})/i,
  /\baction\s*(?:item)?[:\s]+(.{10,80})/i,
  /\btake\s+care\s+of\s+(.{10,80})/i,
];

/** Hindi/Hinglish action patterns */
const HI_ACTION_PATTERNS: RegExp[] = [
  /\bkarna\s+padega\b/i,
  /\bmain\s+karunga\b/i,
  /\bkar\s+dena\b/i,
  /\bkarna\s+hai\b/i,
  /\bkar\s+lena\b/i,
  /\bkaro\s+(?:ye|yeh|wo|woh)\b/i,
  /\bkar\s+do\b/i,
  /\bkar\s+dijiye\b/i,
];

/** Urgency patterns for priority detection */
const URGENT_PATTERNS: RegExp[] = [
  /\burgent(?:ly)?\b/i,
  /\basap\b/i,
  /\bimmediately\b/i,
  /\bcritical\b/i,
  /\bright\s+now\b/i,
  /\btop\s+priority\b/i,
  /\bturant\b/i,
  /\babhi\b/i,
  /\bjaldi\b/i,
];

const LOW_PRIORITY_PATTERNS: RegExp[] = [
  /\bwhen\s+(?:you|we)\s+get\s+(?:a\s+)?chance\b/i,
  /\bno\s+rush\b/i,
  /\blow\s+priority\b/i,
  /\bnice\s+to\s+have\b/i,
  /\beventually\b/i,
  /\bsometime\b/i,
];

/**
 * Detect priority from text content
 */
function detectPriority(text: string): Priority {
  for (const pattern of URGENT_PATTERNS) {
    if (pattern.test(text)) return 'urgent';
  }
  for (const pattern of LOW_PRIORITY_PATTERNS) {
    if (pattern.test(text)) return 'low';
  }
  return 'normal';
}

/**
 * Resolve assignee from segment speaker and text patterns
 */
function resolveAssignee(
  text: string,
  speakerId: SpeakerId | undefined,
  speakers: SpeakerEntry[]
): { name: string; spkId?: SpeakerId } {
  // "I will" / "main karunga" => current speaker
  if (/\b(?:i\s+will|i'll|main\s+karunga|main\s+kar)\b/i.test(text)) {
    if (speakerId) {
      const speaker = speakers.find((s) => s.id === speakerId);
      if (speaker) {
        return { name: speaker.display_name || speaker.label, spkId: speakerId };
      }
    }
  }

  // Check if a speaker name is mentioned directly in the text
  for (const speaker of speakers) {
    const name = speaker.display_name || speaker.label;
    if (name && text.toLowerCase().includes(name.toLowerCase())) {
      return { name, spkId: speaker.id };
    }
  }

  // Fallback: attribute to current speaker if available
  if (speakerId) {
    const speaker = speakers.find((s) => s.id === speakerId);
    if (speaker) {
      return { name: speaker.display_name || speaker.label, spkId: speakerId };
    }
  }

  return { name: 'Unassigned' };
}

/**
 * Generate a unique ID for an item
 */
function generateId(): string {
  return `ai_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Extract the meaningful task text from a match
 */
function cleanTaskText(text: string, matchedGroup?: string): string {
  const raw = matchedGroup || text;
  // Trim trailing punctuation and whitespace
  return raw
    .replace(/[.!?,;:]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract action items from transcript segments.
 *
 * @param segments - Transcript segments
 * @param speakers - Speaker registry entries
 * @returns Array of extracted action items
 */
export function extractActionItems(
  segments: TranscriptSegment[],
  speakers: SpeakerEntry[]
): ActionItem[] {
  const items: ActionItem[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]!;
    const text = segment.text_display || segment.text;

    // Try English patterns
    let matched = false;
    for (const pattern of EN_ACTION_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        const task = cleanTaskText(text, match[1]);
        if (task.length < 10) continue;

        const assignee = resolveAssignee(text, segment.speaker_id, speakers);
        items.push({
          id: generateId(),
          task,
          assignee: assignee.name,
          assigneeSpeakerId: assignee.spkId,
          priority: detectPriority(text),
          status: 'suggested',
          segmentIndex: i,
        });
        matched = true;
        break;
      }
    }

    if (matched) continue;

    // Try Hindi patterns
    for (const pattern of HI_ACTION_PATTERNS) {
      if (pattern.test(text)) {
        const task = cleanTaskText(text);
        if (task.length < 5) continue;

        const assignee = resolveAssignee(text, segment.speaker_id, speakers);
        items.push({
          id: generateId(),
          task,
          assignee: assignee.name,
          assigneeSpeakerId: assignee.spkId,
          priority: detectPriority(text),
          status: 'suggested',
          segmentIndex: i,
        });
        break;
      }
    }
  }

  return items;
}
