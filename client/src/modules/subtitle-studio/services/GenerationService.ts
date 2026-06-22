/**
 * Subtitle Generation Service
 *
 * Converts transcript segments into subtitle cues following broadcast
 * subtitling rules: max 42 chars/line, max 2 lines, duration constraints,
 * minimum gap between cues, and target CPS (characters per second).
 *
 * Split priority: sentence boundaries > clause boundaries > word boundaries.
 * Uses word-level timestamps when available, otherwise applies proportional timing.
 */

import type {
  StandardTranscript,
  TranscriptSegment,
  TranscriptWord,
  SpeakerEntry,
} from '@/modules/speech-engine/types';
import type { SubtitleCue, CueId, SubtitleConfig } from '../types';
import { DEFAULT_SUBTITLE_CONFIG } from '../types';
import { ValidationService } from './ValidationService';

/** Sentence-ending punctuation */
const SENTENCE_ENDS = /[.!?]+$/;

/** Clause boundary punctuation */
const CLAUSE_ENDS = /[,;:\-]+$/;

/**
 * Generate a unique CueId
 */
function generateCueId(): CueId {
  const rand = Math.random().toString(36).substring(2, 10);
  const time = Date.now().toString(36);
  return `cue_${time}${rand}` as CueId;
}

/**
 * Check if a word ends a sentence
 */
function isSentenceEnd(word: string): boolean {
  return SENTENCE_ENDS.test(word.trim());
}

/**
 * Check if a word ends a clause
 */
function isClauseEnd(word: string): boolean {
  return CLAUSE_ENDS.test(word.trim());
}

/**
 * Split text into lines respecting max character limit
 */
function splitIntoLines(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];

  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;

    if (candidate.length <= maxCharsPerLine) {
      currentLine = candidate;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        if (lines.length >= maxLines) {
          // Remaining words go on the last line (may exceed limit)
          const remaining = words.slice(words.indexOf(word)).join(' ');
          lines[lines.length - 1] = remaining;
          return lines;
        }
      }
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.slice(0, maxLines);
}

/**
 * Calculate proportional timing for a word chunk within a segment
 */
function proportionalTiming(
  segmentStart: number,
  segmentEnd: number,
  totalChars: number,
  charsBeforeChunk: number,
  chunkChars: number
): { start: number; end: number } {
  const duration = segmentEnd - segmentStart;
  const charRate = duration / Math.max(totalChars, 1);
  return {
    start: segmentStart + charsBeforeChunk * charRate,
    end: segmentStart + (charsBeforeChunk + chunkChars) * charRate,
  };
}

/**
 * Group words into cue-sized chunks based on subtitle rules
 */
function groupWordsIntoCueTexts(
  words: TranscriptWord[],
  config: SubtitleConfig
): Array<{ text: string; words: TranscriptWord[] }> {
  const maxTotal = config.maxCharsPerLine * config.maxLines;
  const groups: Array<{ text: string; words: TranscriptWord[] }> = [];
  let current: TranscriptWord[] = [];
  let currentText = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i]!;
    const candidate = currentText ? `${currentText} ${word.word}` : word.word;

    if (candidate.length > maxTotal && current.length > 0) {
      // Finalize current group
      groups.push({ text: currentText, words: [...current] });
      current = [word];
      currentText = word.word;
    } else {
      current.push(word);
      currentText = candidate;

      // Check for natural break points
      const atSentenceEnd = isSentenceEnd(word.word);
      const atClauseEnd = isClauseEnd(word.word);
      const nearMaxLength = currentText.length >= maxTotal * 0.7;

      if (atSentenceEnd && current.length >= 2) {
        groups.push({ text: currentText, words: [...current] });
        current = [];
        currentText = '';
      } else if (atClauseEnd && nearMaxLength && current.length >= 3) {
        groups.push({ text: currentText, words: [...current] });
        current = [];
        currentText = '';
      }
    }
  }

  // Remaining words
  if (current.length > 0) {
    groups.push({ text: currentText, words: [...current] });
  }

  return groups;
}

/**
 * Generate subtitle cues from a transcript segment with word timestamps
 */
function generateFromWordsSegment(
  segment: TranscriptSegment,
  config: SubtitleConfig,
  speakerMap: Map<string, SpeakerEntry>
): SubtitleCue[] {
  const words = segment.words!;
  if (words.length === 0) return [];

  const groups = groupWordsIntoCueTexts(words, config);
  const speaker = segment.speaker_id ? speakerMap.get(segment.speaker_id) : undefined;

  return groups.map((group) => {
    const start = group.words[0]!.start;
    const end = group.words[group.words.length - 1]!.end;
    const text = splitIntoLines(group.text, config.maxCharsPerLine, config.maxLines).join('\n');

    return {
      id: generateCueId(),
      sequenceIndex: 0, // Will be assigned later
      start,
      end: Math.max(end, start + config.minDuration),
      text,
      speakerId: segment.speaker_id,
      speakerName: speaker?.display_name ?? speaker?.label,
      language: segment.language,
      validation: { isValid: true, issues: [], cps: 0, lineCount: 1, maxLineLength: 0 },
      isEdited: false,
      isDeleted: false,
    };
  });
}

/**
 * Generate subtitle cues from a segment using proportional timing
 */
function generateFromProportionalSegment(
  segment: TranscriptSegment,
  config: SubtitleConfig,
  speakerMap: Map<string, SpeakerEntry>
): SubtitleCue[] {
  const text = segment.text_display || segment.text;
  if (!text.trim()) return [];

  const maxTotal = config.maxCharsPerLine * config.maxLines;
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const speaker = segment.speaker_id ? speakerMap.get(segment.speaker_id) : undefined;

  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if (sentence.length > maxTotal) {
      // Split long sentence at word boundaries
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = '';
      }
      const words = sentence.split(/\s+/);
      let part = '';
      for (const w of words) {
        const candidate = part ? `${part} ${w}` : w;
        if (candidate.length > maxTotal && part) {
          chunks.push(part);
          part = w;
        } else {
          part = candidate;
        }
      }
      if (part) chunks.push(part);
    } else {
      const candidate = currentChunk ? `${currentChunk} ${sentence}` : sentence;
      if (candidate.length > maxTotal) {
        if (currentChunk) chunks.push(currentChunk);
        currentChunk = sentence;
      } else {
        currentChunk = candidate;
      }
    }
  }
  if (currentChunk) chunks.push(currentChunk);

  const totalChars = text.length;
  let charsSoFar = 0;

  return chunks.map((chunk) => {
    const timing = proportionalTiming(
      segment.start,
      segment.end,
      totalChars,
      charsSoFar,
      chunk.length
    );
    charsSoFar += chunk.length + 1; // +1 for space

    const formattedText = splitIntoLines(chunk, config.maxCharsPerLine, config.maxLines).join('\n');

    return {
      id: generateCueId(),
      sequenceIndex: 0,
      start: timing.start,
      end: Math.max(timing.end, timing.start + config.minDuration),
      text: formattedText,
      speakerId: segment.speaker_id,
      speakerName: speaker?.display_name ?? speaker?.label,
      language: segment.language,
      validation: { isValid: true, issues: [], cps: 0, lineCount: 1, maxLineLength: 0 },
      isEdited: false,
      isDeleted: false,
    };
  });
}

/**
 * Apply minimum gap between cues by adjusting end times
 */
function applyMinGap(cues: SubtitleCue[], minGap: number): SubtitleCue[] {
  for (let i = 0; i < cues.length - 1; i++) {
    const current = cues[i]!;
    const next = cues[i + 1]!;
    const gap = next.start - current.end;

    if (gap < minGap) {
      // Shorten current cue to enforce gap
      current.end = Math.max(current.start + 0.5, next.start - minGap);
    }
  }
  return cues;
}

/**
 * Main generation service: converts a StandardTranscript into SubtitleCue[]
 */
export const GenerationService = {
  /**
   * Generate subtitle cues from a transcript
   * @param transcript - Source transcript
   * @param config - Subtitle generation configuration
   * @returns Array of generated subtitle cues with validation
   */
  generate(
    transcript: StandardTranscript,
    config: SubtitleConfig = DEFAULT_SUBTITLE_CONFIG
  ): SubtitleCue[] {
    const speakerMap = new Map<string, SpeakerEntry>();
    for (const entry of transcript.speakers.entries) {
      speakerMap.set(entry.id, entry);
    }

    let allCues: SubtitleCue[] = [];

    for (const segment of transcript.segments) {
      const hasWords = segment.words && segment.words.length > 0;
      const segmentCues = hasWords
        ? generateFromWordsSegment(segment, config, speakerMap)
        : generateFromProportionalSegment(segment, config, speakerMap);

      allCues = allCues.concat(segmentCues);
    }

    // Sort by start time
    allCues.sort((a, b) => a.start - b.start);

    // Apply minimum gap
    allCues = applyMinGap(allCues, config.minGap);

    // Assign sequence indices
    allCues.forEach((cue, index) => {
      cue.sequenceIndex = index + 1;
    });

    // Validate all cues
    allCues = allCues.map((cue) => ({
      ...cue,
      validation: ValidationService.validateCue(cue, allCues, config),
    }));

    return allCues;
  },

  /**
   * Check whether the transcript has word-level timestamps
   */
  hasWordTimestamps(transcript: StandardTranscript): boolean {
    return transcript.segments.some(
      (seg) => seg.words && seg.words.length > 0
    );
  },
};
