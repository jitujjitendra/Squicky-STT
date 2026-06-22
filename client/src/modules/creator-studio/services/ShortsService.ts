/**
 * ShortsService
 *
 * Generates Shorts/Reels-specific content from ContentIntelligenceCache data.
 * Produces: Highlight Detection, Hook Suggestions, Caption Ideas,
 * and Best Timestamps.
 *
 * Scoring: score = textrank x keyword x brevity
 * - textrank: normalized TextRank score (0-1)
 * - keyword: bonus for containing top keywords (1.0-2.0)
 * - brevity: bonus for short segments <60 words (1.0-1.5)
 */

import type { StandardTranscript, TranscriptSegment } from '@/modules/speech-engine/types';
import type { ContentIntelligence } from '@/modules/content-studio/types';
import type { ShortsOutputs, OutputCard, HighlightSegment } from '../types';
import { formatTimestamp } from './ChapterDetectionService';

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
 * Compute highlight score for a segment:
 * score = textrank x keyword_factor x brevity_factor
 */
function computeHighlightScore(
  text: string,
  textrankScore: number,
  topKeywords: Set<string>
): number {
  const wordCount = text.split(/\s+/).length;

  // Keyword factor: 1.0 base + 0.2 per keyword match (max 2.0)
  let keywordFactor = 1.0;
  const lowerText = text.toLowerCase();
  for (const kw of topKeywords) {
    if (lowerText.includes(kw)) {
      keywordFactor += 0.2;
    }
  }
  keywordFactor = Math.min(keywordFactor, 2.0);

  // Brevity factor: shorter = better for shorts (max at <30 words)
  let brevityFactor = 1.0;
  if (wordCount < 60) {
    brevityFactor = 1.0 + (60 - wordCount) / 60 * 0.5; // 1.0 to 1.5
  }

  return textrankScore * keywordFactor * brevityFactor;
}

/**
 * Detect highlights suitable for short-form content
 */
function detectHighlights(
  intelligence: ContentIntelligence,
  transcript: StandardTranscript,
  offset: number = 0
): HighlightSegment[] {
  const segments = transcript.segments;
  const topKeywords = new Set(
    intelligence.keywords.slice(0, 10).map((k) => k.term.toLowerCase())
  );

  // Score each ranked sentence
  const scored: HighlightSegment[] = intelligence.rankedSentences
    .slice(offset)
    .map((s) => {
      const seg = segments[s.segmentIndex];
      if (!seg) return null;

      const wordCount = s.text.split(/\s+/).length;
      // Only include segments <60 words
      if (wordCount >= 60) return null;

      const score = computeHighlightScore(s.text, s.score, topKeywords);
      const duration = seg.end - seg.start;

      return {
        start: seg.start,
        end: seg.end,
        duration,
        text: s.text,
        score,
      };
    })
    .filter((h): h is HighlightSegment => h !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  return scored;
}

/**
 * Generate highlights formatted for display
 */
function formatHighlights(highlights: HighlightSegment[]): string {
  if (highlights.length === 0) {
    return 'No suitable highlight segments found in this transcript.';
  }

  return highlights
    .map((h, i) => {
      const start = formatTimestamp(h.start);
      const end = formatTimestamp(h.end);
      const scoreDisplay = (h.score * 100).toFixed(0);
      return `${i + 1}. [${start} - ${end}] (Score: ${scoreDisplay}%)\n   "${h.text}"`;
    })
    .join('\n\n');
}

/**
 * Generate hook suggestions from topic openers
 */
function generateHookSuggestions(
  intelligence: ContentIntelligence,
  transcript: StandardTranscript,
  offset: number = 0
): string {
  const topics = intelligence.topics;
  const segments = transcript.segments;

  const hooks: string[] = [];

  // Get the opening sentence of each topic as a hook
  for (const topic of topics.slice(offset)) {
    if (hooks.length >= 5) break;
    const seg = segments[topic.startIndex];
    if (!seg) continue;

    const text = seg.text_display || seg.text;
    const wordCount = text.split(/\s+/).length;

    // Good hooks are punchy (< 30 words)
    if (wordCount <= 30) {
      hooks.push(text);
    } else {
      // Shorten to first sentence or 25 words
      const shortened = text.split(/[.!?]/)[0] ?? text.split(/\s+/).slice(0, 25).join(' ');
      hooks.push(shortened + '...');
    }
  }

  // Fill with high-ranked short sentences
  if (hooks.length < 3) {
    const shortRanked = intelligence.rankedSentences
      .filter((s) => s.text.split(/\s+/).length <= 20)
      .slice(offset, offset + 5);
    for (const s of shortRanked) {
      if (hooks.length >= 5) break;
      if (!hooks.includes(s.text)) {
        hooks.push(s.text);
      }
    }
  }

  if (hooks.length === 0) {
    return 'No suitable hook suggestions found.';
  }

  return hooks.map((h, i) => `${i + 1}. "${h}"`).join('\n\n');
}

/**
 * Generate caption ideas (<150 chars + hashtags)
 */
function generateCaptionIdeas(
  intelligence: ContentIntelligence,
  offset: number = 0
): string {
  const hashtags = intelligence.keywords
    .slice(0, 3)
    .map((k) => `#${k.term.replace(/\s+/g, '')}`)
    .join(' ');

  const captions: string[] = [];

  // Generate captions from top sentences (shortened to <150 chars)
  const candidates = intelligence.rankedSentences.slice(offset, offset + 8);

  for (const s of candidates) {
    if (captions.length >= 5) break;

    let text = s.text;
    // Ensure caption + hashtags fits in ~150 chars
    const maxTextLen = 150 - hashtags.length - 1;
    if (text.length > maxTextLen) {
      text = text.slice(0, maxTextLen - 3) + '...';
    }

    const caption = `${text} ${hashtags}`;
    if (caption.length <= 150) {
      captions.push(caption);
    } else {
      // Trim further
      const trimmed = text.slice(0, 100) + '... ' + hashtags;
      captions.push(trimmed.slice(0, 150));
    }
  }

  if (captions.length === 0) {
    return 'No suitable captions found.';
  }

  return captions
    .map((c, i) => `${i + 1}. ${c}\n   (${c.length} chars)`)
    .join('\n\n');
}

/**
 * Generate best timestamps: segments <60s suitable for shorts
 */
function generateBestTimestamps(
  intelligence: ContentIntelligence,
  transcript: StandardTranscript,
  offset: number = 0
): string {
  const segments = transcript.segments;
  const topKeywords = new Set(
    intelligence.keywords.slice(0, 10).map((k) => k.term.toLowerCase())
  );

  // Find segments or groups of adjacent segments <60s with high relevance
  const candidates: Array<{ start: number; end: number; text: string; score: number }> = [];

  for (const s of intelligence.rankedSentences.slice(offset)) {
    const seg = segments[s.segmentIndex];
    if (!seg) continue;

    const duration = seg.end - seg.start;
    if (duration > 60) continue;

    const score = computeHighlightScore(s.text, s.score, topKeywords);
    candidates.push({
      start: seg.start,
      end: seg.end,
      text: s.text,
      score,
    });
  }

  const sorted = candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  if (sorted.length === 0) {
    return 'No suitable timestamps found for short-form content.';
  }

  return sorted
    .map((c, i) => {
      const start = formatTimestamp(c.start);
      const end = formatTimestamp(c.end);
      const dur = Math.round(c.end - c.start);
      return `${i + 1}. ${start} - ${end} (${dur}s)\n   ${c.text}`;
    })
    .join('\n\n');
}

/**
 * Generate all Shorts/Reels mode outputs
 *
 * @param intelligence - ContentIntelligenceCache data
 * @param transcript - Source transcript
 * @param offset - Offset for regeneration
 */
export function generateShortsOutputs(
  intelligence: ContentIntelligence,
  transcript: StandardTranscript,
  offset: number = 0
): ShortsOutputs {
  const highlights = detectHighlights(intelligence, transcript, offset);

  return {
    highlights: makeCard(
      'shorts-highlights',
      'Highlight Detection',
      formatHighlights(highlights)
    ),
    hookSuggestions: makeCard(
      'shorts-hooks',
      'Hook Suggestions',
      generateHookSuggestions(intelligence, transcript, offset)
    ),
    captionIdeas: makeCard(
      'shorts-captions',
      'Caption Ideas',
      generateCaptionIdeas(intelligence, offset),
      150
    ),
    bestTimestamps: makeCard(
      'shorts-timestamps',
      'Best Timestamps',
      generateBestTimestamps(intelligence, transcript, offset)
    ),
  };
}
