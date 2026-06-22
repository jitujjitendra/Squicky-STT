/**
 * YouTubeService
 *
 * Generates YouTube-specific content from ContentIntelligenceCache data.
 * Produces: Title Suggestions, Description, Chapters, Tags, Hashtags,
 * Pinned Comment, and Shorts Ideas.
 *
 * This is a thin formatting layer - it does NOT re-run TextRank/TF-IDF.
 */

import type { StandardTranscript } from '@/modules/speech-engine/types';
import type { ContentIntelligence } from '@/modules/content-studio/types';
import type { YouTubeOutputs, OutputCard, ChapterMarker } from '../types';
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
 * Generate title suggestions from top keyword bigrams/trigrams.
 * 3 variants, max 100 characters each.
 */
function generateTitleSuggestions(
  intelligence: ContentIntelligence,
  _offset: number = 0
): string {
  const keywords = intelligence.keywords;
  const topSentences = intelligence.rankedSentences;

  // Extract bigrams/trigrams from keywords
  const multiWord = keywords.filter((k) => k.term.includes(' ')).slice(_offset, _offset + 6);
  const singleWord = keywords.filter((k) => !k.term.includes(' ')).slice(0, 4);

  const titles: string[] = [];

  // Variant 1: Top bigram/trigram + context
  if (multiWord.length > 0) {
    const phrase = multiWord[0]!.term;
    const capitalized = phrase.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const title = `${capitalized}: A Complete Guide`;
    titles.push(title.slice(0, 100));
  }

  // Variant 2: Question format using top keyword
  if (singleWord.length > 0) {
    const keyword = singleWord[0]!.term.charAt(0).toUpperCase() + singleWord[0]!.term.slice(1);
    const title = `Everything You Need to Know About ${keyword}`;
    titles.push(title.slice(0, 100));
  }

  // Variant 3: From top ranked sentence (shortened)
  if (topSentences.length > _offset) {
    const sentence = topSentences[_offset]!.text;
    const shortened = sentence.length > 90 ? sentence.slice(0, 87) + '...' : sentence;
    titles.push(shortened.slice(0, 100));
  }

  // Ensure we always have 3
  while (titles.length < 3) {
    if (multiWord.length > titles.length) {
      const phrase = multiWord[titles.length]!.term;
      const capitalized = phrase.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      titles.push(capitalized.slice(0, 100));
    } else {
      titles.push('Untitled Video');
    }
  }

  return titles.map((t, i) => `${i + 1}. ${t}`).join('\n');
}

/**
 * Generate YouTube description with template structure:
 * intro + chapters + takeaways + hashtags (max 5000 chars)
 */
function generateDescription(
  intelligence: ContentIntelligence,
  transcript: StandardTranscript,
  chapters: ChapterMarker[]
): string {
  const parts: string[] = [];

  // Intro from top ranked sentence
  if (intelligence.rankedSentences.length > 0) {
    const intro = intelligence.rankedSentences[0]!.text;
    parts.push(`${intro}\n`);
  }

  // Chapters section
  if (chapters.length > 0) {
    parts.push('CHAPTERS:');
    chapters.forEach((ch) => {
      parts.push(`${ch.formattedTime} ${ch.title}`);
    });
    parts.push('');
  }

  // Key Takeaways
  const takeaways = intelligence.rankedSentences.slice(1, 4);
  if (takeaways.length > 0) {
    parts.push('KEY TAKEAWAYS:');
    takeaways.forEach((s) => {
      parts.push(`- ${s.text}`);
    });
    parts.push('');
  }

  // Hashtags
  const hashtags = intelligence.keywords
    .slice(0, 5)
    .map((k) => `#${k.term.replace(/\s+/g, '')}`)
    .join(' ');
  if (hashtags) {
    parts.push(hashtags);
  }

  const result = parts.join('\n');
  return result.slice(0, 5000);
}

/**
 * Generate tags from TF-IDF top 15-20 keywords, comma-separated
 */
function generateTags(intelligence: ContentIntelligence): string {
  const tags = intelligence.keywords
    .slice(0, 20)
    .map((k) => k.term);
  return tags.join(', ');
}

/**
 * Generate hashtags (top 5 with # prefix)
 */
function generateHashtags(intelligence: ContentIntelligence): string {
  return intelligence.keywords
    .slice(0, 5)
    .map((k) => `#${k.term.replace(/\s+/g, '')}`)
    .join(' ');
}

/**
 * Generate pinned comment (top quote + CTA)
 */
function generatePinnedComment(intelligence: ContentIntelligence): string {
  const topQuote = intelligence.rankedSentences[0]?.text ?? '';
  const parts: string[] = [];

  if (topQuote) {
    parts.push(`"${topQuote}"`);
    parts.push('');
  }

  parts.push('What do you think? Let me know in the comments below!');
  parts.push('');
  parts.push('If you found this helpful, please like and subscribe for more content.');

  return parts.join('\n');
}

/**
 * Generate Shorts ideas: high TextRank + <60 words + keyword match
 */
function generateShortsIdeas(
  intelligence: ContentIntelligence,
  transcript: StandardTranscript
): string {
  const segments = transcript.segments;
  const topKeywords = new Set(intelligence.keywords.slice(0, 10).map((k) => k.term.toLowerCase()));

  // Find segments suitable for shorts: ranked high + short + contains keyword
  const shortCandidates = intelligence.rankedSentences
    .filter((s) => {
      const wordCount = s.text.split(/\s+/).length;
      if (wordCount >= 60) return false;

      // Check keyword presence
      const lower = s.text.toLowerCase();
      for (const kw of topKeywords) {
        if (lower.includes(kw)) return true;
      }
      return false;
    })
    .slice(0, 5);

  if (shortCandidates.length === 0) {
    return 'No suitable short-form content found in this transcript.';
  }

  const ideas = shortCandidates.map((s, i) => {
    const seg = segments[s.segmentIndex];
    const time = seg ? formatTimestamp(seg.start) : '';
    return `${i + 1}. [${time}] ${s.text}`;
  });

  return ideas.join('\n\n');
}

/**
 * Generate all YouTube mode outputs
 *
 * @param intelligence - ContentIntelligenceCache data
 * @param transcript - Source transcript
 * @param offset - Offset for regeneration (use 2nd-5th ranked items)
 */
export function generateYouTubeOutputs(
  intelligence: ContentIntelligence,
  transcript: StandardTranscript,
  offset: number = 0
): YouTubeOutputs {
  const chapters = detectChapters(transcript.segments, intelligence.topics);

  const chaptersContent = chapters
    .map((ch) => `${ch.formattedTime} ${ch.title}`)
    .join('\n');

  return {
    titleSuggestions: makeCard(
      'yt-titles',
      'Title Suggestions',
      generateTitleSuggestions(intelligence, offset),
      100
    ),
    description: makeCard(
      'yt-description',
      'Description',
      generateDescription(intelligence, transcript, chapters),
      5000
    ),
    chapters: makeCard(
      'yt-chapters',
      'Chapters',
      chaptersContent
    ),
    tags: makeCard(
      'yt-tags',
      'Tags',
      generateTags(intelligence)
    ),
    hashtags: makeCard(
      'yt-hashtags',
      'Hashtags',
      generateHashtags(intelligence)
    ),
    pinnedComment: makeCard(
      'yt-pinned',
      'Pinned Comment',
      generatePinnedComment(intelligence)
    ),
    shortsIdeas: makeCard(
      'yt-shorts-ideas',
      'Shorts Ideas',
      generateShortsIdeas(intelligence, transcript)
    ),
  };
}
