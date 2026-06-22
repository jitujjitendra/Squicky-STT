/**
 * PodcastService
 *
 * Generates podcast-specific content from ContentIntelligenceCache data.
 * Produces: Episode Title, Show Notes, Key Takeaways, Guest Highlights,
 * and Chapter Markers.
 *
 * This is a thin formatting layer - it does NOT re-run TextRank/TF-IDF.
 */

import type { StandardTranscript } from '@/modules/speech-engine/types';
import type { ContentIntelligence } from '@/modules/content-studio/types';
import type { PodcastOutputs, OutputCard } from '../types';
import { detectChapters, formatTimestamp } from './ChapterDetectionService';

/**
 * Create an OutputCard with calculated character count
 */
function makeCard(id: string, title: string, content: string, maxChars?: number): OutputCard {
  return {
    id,
    title,
    content,
    charCount: content.length,
    maxChars,
    isEdited: false,
  };
}

/**
 * Generate episode title from top keywords
 */
function generateEpisodeTitle(
  intelligence: ContentIntelligence,
  offset: number = 0
): string {
  const keywords = intelligence.keywords.slice(offset, offset + 5);
  const multiWord = keywords.filter((k) => k.term.includes(' '));
  const singleWord = keywords.filter((k) => !k.term.includes(' '));

  const titles: string[] = [];

  // Format 1: Topic-based
  if (multiWord.length > 0) {
    const phrase = multiWord[0]!.term;
    const capitalized = phrase.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    titles.push(capitalized);
  }

  // Format 2: Single keyword based
  if (singleWord.length > 0) {
    const word = singleWord[0]!.term.charAt(0).toUpperCase() + singleWord[0]!.term.slice(1);
    titles.push(`Deep Dive: ${word}`);
  }

  // Format 3: From top sentence
  if (intelligence.rankedSentences.length > offset) {
    const sentence = intelligence.rankedSentences[offset]!.text;
    const shortened = sentence.length > 80 ? sentence.slice(0, 77) + '...' : sentence;
    titles.push(shortened);
  }

  return titles.map((t, i) => `${i + 1}. ${t}`).join('\n');
}

/**
 * Generate show notes template
 */
function generateShowNotes(
  intelligence: ContentIntelligence,
  transcript: StandardTranscript
): string {
  const parts: string[] = [];

  // Episode summary
  parts.push('EPISODE SUMMARY');
  parts.push('─'.repeat(40));
  if (intelligence.rankedSentences.length > 0) {
    const summary = intelligence.rankedSentences
      .slice(0, 3)
      .map((s) => s.text)
      .join(' ');
    parts.push(summary);
  }
  parts.push('');

  // Topics covered
  parts.push('TOPICS COVERED');
  parts.push('─'.repeat(40));
  intelligence.topics.forEach((topic) => {
    parts.push(`- ${topic.label}`);
  });
  parts.push('');

  // Timestamps
  const chapters = detectChapters(transcript.segments, intelligence.topics);
  if (chapters.length > 0) {
    parts.push('TIMESTAMPS');
    parts.push('─'.repeat(40));
    chapters.forEach((ch) => {
      parts.push(`[${ch.formattedTime}] ${ch.title}`);
    });
    parts.push('');
  }

  // Key quotes
  parts.push('KEY QUOTES');
  parts.push('─'.repeat(40));
  intelligence.rankedSentences.slice(0, 3).forEach((s) => {
    parts.push(`"${s.text}"`);
  });
  parts.push('');

  // Keywords
  parts.push('KEYWORDS');
  parts.push('─'.repeat(40));
  const tags = intelligence.keywords.slice(0, 10).map((k) => k.term).join(', ');
  parts.push(tags);

  return parts.join('\n');
}

/**
 * Generate key takeaways from TextRank top 5 diverse sentences.
 * Ensures diversity by selecting sentences from different topic segments.
 */
function generateKeyTakeaways(
  intelligence: ContentIntelligence,
  offset: number = 0
): string {
  const ranked = intelligence.rankedSentences;
  const topics = intelligence.topics;

  // Select diverse sentences: one from each topic if possible
  const selected: string[] = [];
  const usedTopics = new Set<number>();

  // First pass: pick top sentence from each topic
  for (const topic of topics) {
    if (selected.length >= 5) break;
    const topicSentence = ranked.find(
      (s) =>
        s.segmentIndex >= topic.startIndex &&
        s.segmentIndex < topic.endIndex &&
        !usedTopics.has(s.segmentIndex)
    );
    if (topicSentence) {
      selected.push(topicSentence.text);
      usedTopics.add(topicSentence.segmentIndex);
    }
  }

  // Fill remaining with top-ranked sentences not yet used
  const remaining = ranked
    .slice(offset)
    .filter((s) => !usedTopics.has(s.segmentIndex));
  for (const s of remaining) {
    if (selected.length >= 5) break;
    selected.push(s.text);
  }

  if (selected.length === 0) {
    return 'No key takeaways could be extracted from this transcript.';
  }

  return selected.map((t, i) => `${i + 1}. ${t}`).join('\n\n');
}

/**
 * Generate guest highlights (if 2+ speakers: non-host top sentences)
 */
function generateGuestHighlights(
  intelligence: ContentIntelligence,
  transcript: StandardTranscript
): string {
  const speakers = transcript.speakers;

  if (speakers.count < 2) {
    return 'Single speaker detected. Guest highlights require at least 2 speakers.';
  }

  // Identify host as the speaker with most speaking time
  const entries = speakers.entries;
  const speakingTime = speakers.speaking_time;

  let hostId = entries[0]?.id ?? '';
  let maxTime = 0;
  for (const entry of entries) {
    const time = speakingTime[entry.id] ?? 0;
    if (time > maxTime) {
      maxTime = time;
      hostId = entry.id;
    }
  }

  // Find non-host top sentences
  const segments = transcript.segments;
  const guestSentences = intelligence.rankedSentences
    .filter((s) => {
      const seg = segments[s.segmentIndex];
      return seg && seg.speaker_id !== hostId;
    })
    .slice(0, 5);

  if (guestSentences.length === 0) {
    return 'No notable guest highlights detected.';
  }

  // Get guest speaker name
  const guestEntry = entries.find((e) => e.id !== hostId);
  const guestName = guestEntry?.display_name || guestEntry?.label || 'Guest';

  const highlights = guestSentences.map((s, i) => {
    const seg = segments[s.segmentIndex]!;
    const time = formatTimestamp(seg.start);
    return `${i + 1}. [${time}] ${guestName}: "${s.text}"`;
  });

  return highlights.join('\n\n');
}

/**
 * Generate all Podcast mode outputs
 *
 * @param intelligence - ContentIntelligenceCache data
 * @param transcript - Source transcript
 * @param offset - Offset for regeneration
 */
export function generatePodcastOutputs(
  intelligence: ContentIntelligence,
  transcript: StandardTranscript,
  offset: number = 0
): PodcastOutputs {
  const chapters = detectChapters(transcript.segments, intelligence.topics);
  const chaptersContent = chapters
    .map((ch) => `[${ch.formattedTime}] ${ch.title}`)
    .join('\n');

  return {
    episodeTitle: makeCard(
      'pod-title',
      'Episode Title',
      generateEpisodeTitle(intelligence, offset)
    ),
    showNotes: makeCard(
      'pod-shownotes',
      'Show Notes',
      generateShowNotes(intelligence, transcript)
    ),
    keyTakeaways: makeCard(
      'pod-takeaways',
      'Key Takeaways',
      generateKeyTakeaways(intelligence, offset)
    ),
    guestHighlights: makeCard(
      'pod-guests',
      'Guest Highlights',
      generateGuestHighlights(intelligence, transcript)
    ),
    chapterMarkers: makeCard(
      'pod-chapters',
      'Chapter Markers',
      chaptersContent
    ),
  };
}
