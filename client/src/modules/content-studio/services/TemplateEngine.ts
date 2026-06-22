/**
 * Template Engine
 *
 * 8 content templates that are pure functions:
 * (intelligence, transcript) => ContentResult
 *
 * Each template produces extractive content - no generative AI.
 * Templates use TextRank scores, topic detection, and keyword data
 * to assemble structured content from the transcript.
 */

import type {
  ContentType,
  ContentTemplate,
  ContentResult,
  ContentIntelligence,
  ContentSection,
  FaqItem,
  ScoredSentence,
} from '../types';
import type { StandardTranscript } from '@/modules/speech-engine/types';

// ─── Question Detection Patterns ─────────────────────────────────────────────

const QUESTION_WORDS = ['what', 'how', 'why', 'when', 'where', 'who', 'which', 'whom', 'whose'];

function isQuestion(text: string): boolean {
  const lower = text.toLowerCase().trim();
  if (lower.endsWith('?')) return true;
  const firstWord = lower.split(/\s+/)[0] ?? '';
  return QUESTION_WORDS.includes(firstWord);
}

// ─── Helper: Filter filler sentences ─────────────────────────────────────────

function isFillerSentence(text: string): boolean {
  const lower = text.toLowerCase().trim();
  const words = lower.split(/\s+/);
  if (words.length <= 2) return true;
  const fillerPhrases = ['um', 'uh', 'you know', 'i mean', 'like', 'so yeah', 'okay so'];
  return fillerPhrases.some((f) => lower === f || (words.length <= 3 && lower.startsWith(f)));
}

// ─── Helper: Sentence word count ─────────────────────────────────────────────

function wordCount(text: string): number {
  return text.trim().split(/\s+/).length;
}

// ─── Blog Template ───────────────────────────────────────────────────────────

const blogTemplate: ContentTemplate = {
  type: 'blog',
  label: 'Blog Post',
  description: 'Transform transcript into a structured blog post with sections per topic.',

  generate(intelligence: ContentIntelligence, transcript: StandardTranscript): ContentResult {
    const { topics, keywords, rankedSentences } = intelligence;
    const usedIndices: number[] = [];

    // Title from top keywords
    const titleKeywords = keywords.slice(0, 3).map((k) => k.term);
    const title = titleKeywords.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(': ');

    // Intro from TextRank top 2 sentences
    const introSentences = rankedSentences
      .slice(0, 2)
      .sort((a, b) => a.segmentIndex - b.segmentIndex);
    const introSection: ContentSection = {
      heading: 'Introduction',
      body: introSentences.map((s) => s.text).join(' '),
      sourceIndices: introSentences.map((s) => s.segmentIndex),
    };
    usedIndices.push(...introSection.sourceIndices);

    // Body sections per topic
    const bodySections: ContentSection[] = topics.map((topic) => {
      const topSentences = topic.topSentences
        .sort((a, b) => a.segmentIndex - b.segmentIndex);
      const indices = topSentences.map((s) => s.segmentIndex);
      usedIndices.push(...indices);

      return {
        heading: topic.label,
        body: topSentences.map((s) => s.text).join(' '),
        sourceIndices: indices,
      };
    });

    // Conclusion from last topic's top sentence
    const lastTopic = topics[topics.length - 1];
    const conclusionSentence = lastTopic?.topSentences[0];
    const conclusionSection: ContentSection = {
      heading: 'Conclusion',
      body: conclusionSentence?.text || introSentences[0]?.text || '',
      sourceIndices: conclusionSentence ? [conclusionSentence.segmentIndex] : [],
    };
    if (conclusionSentence) usedIndices.push(conclusionSentence.segmentIndex);

    const sections = [introSection, ...bodySections, conclusionSection];

    // Render
    const rendered = sections
      .map((s) => `## ${s.heading}\n\n${s.body}`)
      .join('\n\n');

    return {
      type: 'blog',
      title,
      sections,
      rendered: `# ${title}\n\n${rendered}`,
      usedSegmentIndices: [...new Set(usedIndices)],
      generatedAt: Date.now(),
    };
  },
};

// ─── Summary Short Template ──────────────────────────────────────────────────

const summaryShortTemplate: ContentTemplate = {
  type: 'summary-short',
  label: 'Short Summary',
  description: 'TextRank top 3-5 most important sentences.',

  generate(intelligence: ContentIntelligence, _transcript: StandardTranscript): ContentResult {
    const topN = Math.min(5, Math.max(3, Math.floor(intelligence.rankedSentences.length * 0.1)));
    const topSentences = intelligence.rankedSentences
      .slice(0, topN)
      .sort((a, b) => a.segmentIndex - b.segmentIndex);

    const body = topSentences.map((s) => s.text).join(' ');
    const indices = topSentences.map((s) => s.segmentIndex);

    return {
      type: 'summary-short',
      title: 'Summary',
      sections: [{ body, sourceIndices: indices }],
      rendered: body,
      usedSegmentIndices: indices,
      generatedAt: Date.now(),
    };
  },
};

// ─── Summary Detailed Template ───────────────────────────────────────────────

const summaryDetailedTemplate: ContentTemplate = {
  type: 'summary-detailed',
  label: 'Detailed Summary',
  description: 'Top 30% of sentences grouped by topic.',

  generate(intelligence: ContentIntelligence, _transcript: StandardTranscript): ContentResult {
    const { topics, rankedSentences } = intelligence;
    const threshold = Math.floor(rankedSentences.length * 0.3);
    const topSet = new Set(
      rankedSentences.slice(0, threshold).map((s) => s.segmentIndex)
    );

    const sections: ContentSection[] = topics.map((topic) => {
      const sentences: ScoredSentence[] = [];
      for (let i = topic.startIndex; i < topic.endIndex; i++) {
        if (topSet.has(i)) {
          const found = rankedSentences.find((s) => s.segmentIndex === i);
          if (found) sentences.push(found);
        }
      }
      sentences.sort((a, b) => a.segmentIndex - b.segmentIndex);

      return {
        heading: topic.label,
        body: sentences.map((s) => s.text).join(' '),
        sourceIndices: sentences.map((s) => s.segmentIndex),
      };
    });

    const usedIndices = sections.flatMap((s) => s.sourceIndices);
    const rendered = sections
      .filter((s) => s.body.length > 0)
      .map((s) => (s.heading ? `## ${s.heading}\n\n${s.body}` : s.body))
      .join('\n\n');

    return {
      type: 'summary-detailed',
      title: 'Detailed Summary',
      sections,
      rendered,
      usedSegmentIndices: [...new Set(usedIndices)],
      generatedAt: Date.now(),
    };
  },
};

// ─── Summary Executive Template ──────────────────────────────────────────────

const summaryExecutiveTemplate: ContentTemplate = {
  type: 'summary-executive',
  label: 'Executive Summary',
  description: 'Concise overview with key points and decisions.',

  generate(intelligence: ContentIntelligence, _transcript: StandardTranscript): ContentResult {
    const { topics, rankedSentences } = intelligence;

    // Key points: top sentence per topic
    const keyPoints = topics
      .map((t) => t.topSentences[0])
      .filter(Boolean) as ScoredSentence[];

    // Overview: absolute top 2 sentences
    const overview = rankedSentences
      .slice(0, 2)
      .sort((a, b) => a.segmentIndex - b.segmentIndex);

    const overviewSection: ContentSection = {
      heading: 'Overview',
      body: overview.map((s) => s.text).join(' '),
      sourceIndices: overview.map((s) => s.segmentIndex),
    };

    const keyPointsSection: ContentSection = {
      heading: 'Key Points',
      body: keyPoints.map((s) => `- ${s.text}`).join('\n'),
      sourceIndices: keyPoints.map((s) => s.segmentIndex),
    };

    const topicsSection: ContentSection = {
      heading: 'Topics Covered',
      body: topics.map((t) => `- ${t.label}`).join('\n'),
      sourceIndices: [],
    };

    const sections = [overviewSection, keyPointsSection, topicsSection];
    const usedIndices = sections.flatMap((s) => s.sourceIndices);

    const rendered = sections
      .map((s) => `## ${s.heading}\n\n${s.body}`)
      .join('\n\n');

    return {
      type: 'summary-executive',
      title: 'Executive Summary',
      sections,
      rendered: `# Executive Summary\n\n${rendered}`,
      usedSegmentIndices: [...new Set(usedIndices)],
      generatedAt: Date.now(),
    };
  },
};

// ─── FAQ Template ────────────────────────────────────────────────────────────

const faqTemplate: ContentTemplate = {
  type: 'faq',
  label: 'FAQ',
  description: 'Detect questions and pair with following sentences as answers.',

  generate(intelligence: ContentIntelligence, transcript: StandardTranscript): ContentResult {
    const segments = transcript.segments;
    const faqItems: FaqItem[] = [];
    const usedIndices: number[] = [];

    for (let i = 0; i < segments.length; i++) {
      const text = segments[i].text_display || segments[i].text;

      if (isQuestion(text)) {
        // Collect next 1-3 non-question sentences as answer
        const answerParts: string[] = [];
        const answerIndices: number[] = [];
        for (let j = i + 1; j < Math.min(i + 4, segments.length); j++) {
          const answerText = segments[j].text_display || segments[j].text;
          if (isQuestion(answerText)) break;
          if (isFillerSentence(answerText)) continue;
          answerParts.push(answerText);
          answerIndices.push(j);
          if (answerParts.length >= 3) break;
        }

        if (answerParts.length > 0) {
          faqItems.push({
            question: text,
            answer: answerParts.join(' '),
            sourceIndices: [i, ...answerIndices],
          });
          usedIndices.push(i, ...answerIndices);
        }
      }
    }

    // If no questions found, generate from topics
    if (faqItems.length === 0) {
      for (const topic of intelligence.topics) {
        if (topic.topSentences.length > 0) {
          const topSentence = topic.topSentences[0]!;
          faqItems.push({
            question: `What about ${topic.label.toLowerCase()}?`,
            answer: topSentence.text,
            sourceIndices: [topSentence.segmentIndex],
          });
          usedIndices.push(topSentence.segmentIndex);
        }
      }
    }

    const sections: ContentSection[] = faqItems.map((item) => ({
      heading: item.question,
      body: item.answer,
      sourceIndices: item.sourceIndices,
    }));

    const rendered = faqItems
      .map((item) => `**Q: ${item.question}**\n\nA: ${item.answer}`)
      .join('\n\n---\n\n');

    return {
      type: 'faq',
      title: 'Frequently Asked Questions',
      sections,
      faqItems,
      rendered: `# FAQ\n\n${rendered}`,
      usedSegmentIndices: [...new Set(usedIndices)],
      generatedAt: Date.now(),
    };
  },
};

// ─── Meeting Notes Template ──────────────────────────────────────────────────

const ACTION_PATTERNS = [
  /\b(will|shall|going to|need to|must|should|have to|action item)\b/i,
  /\b(assigned to|responsible for|due by|deadline)\b/i,
  /\b(let'?s|we'?ll|i'?ll)\b/i,
];

const DECISION_PATTERNS = [
  /\b(decided|agreed|confirmed|approved|resolved|conclusion)\b/i,
  /\b(decision is|we decided|final answer|go with)\b/i,
];

const notesMeetingTemplate: ContentTemplate = {
  type: 'notes-meeting',
  label: 'Meeting Notes',
  description: 'Extract action items, decisions, and key points from meeting transcripts.',

  generate(intelligence: ContentIntelligence, transcript: StandardTranscript): ContentResult {
    const segments = transcript.segments;
    const actionItems: ScoredSentence[] = [];
    const decisions: ScoredSentence[] = [];
    const usedIndices: number[] = [];

    // Detect action items and decisions
    for (let i = 0; i < segments.length; i++) {
      const text = segments[i].text_display || segments[i].text;
      if (isFillerSentence(text)) continue;

      if (ACTION_PATTERNS.some((p) => p.test(text))) {
        actionItems.push({
          text,
          score: 1,
          segmentIndex: i,
          segmentId: segments[i].id,
        });
      }
      if (DECISION_PATTERNS.some((p) => p.test(text))) {
        decisions.push({
          text,
          score: 1,
          segmentIndex: i,
          segmentId: segments[i].id,
        });
      }
    }

    // Key points from TextRank
    const keyPoints = intelligence.rankedSentences
      .slice(0, 7)
      .sort((a, b) => a.segmentIndex - b.segmentIndex);

    const actionSection: ContentSection = {
      heading: 'Action Items',
      body: actionItems.length > 0
        ? actionItems.map((a) => `- ${a.text}`).join('\n')
        : '- No explicit action items detected',
      sourceIndices: actionItems.map((a) => a.segmentIndex),
    };

    const decisionSection: ContentSection = {
      heading: 'Decisions',
      body: decisions.length > 0
        ? decisions.map((d) => `- ${d.text}`).join('\n')
        : '- No explicit decisions detected',
      sourceIndices: decisions.map((d) => d.segmentIndex),
    };

    const keyPointsSection: ContentSection = {
      heading: 'Key Points',
      body: keyPoints.map((k) => `- ${k.text}`).join('\n'),
      sourceIndices: keyPoints.map((k) => k.segmentIndex),
    };

    const sections = [actionSection, decisionSection, keyPointsSection];
    usedIndices.push(...sections.flatMap((s) => s.sourceIndices));

    const rendered = sections
      .map((s) => `## ${s.heading}\n\n${s.body}`)
      .join('\n\n');

    return {
      type: 'notes-meeting',
      title: 'Meeting Notes',
      sections,
      rendered: `# Meeting Notes\n\n${rendered}`,
      usedSegmentIndices: [...new Set(usedIndices)],
      generatedAt: Date.now(),
    };
  },
};

// ─── Quick Notes Template ────────────────────────────────────────────────────

const notesQuickTemplate: ContentTemplate = {
  type: 'notes-quick',
  label: 'Quick Notes',
  description: 'Bullet-point key takeaways from the transcript.',

  generate(intelligence: ContentIntelligence, _transcript: StandardTranscript): ContentResult {
    const topSentences = intelligence.rankedSentences
      .slice(0, 10)
      .sort((a, b) => a.segmentIndex - b.segmentIndex)
      .filter((s) => !isFillerSentence(s.text));

    const body = topSentences.map((s) => `- ${s.text}`).join('\n');
    const indices = topSentences.map((s) => s.segmentIndex);

    return {
      type: 'notes-quick',
      title: 'Quick Notes',
      sections: [{ heading: 'Key Takeaways', body, sourceIndices: indices }],
      rendered: `# Quick Notes\n\n${body}`,
      usedSegmentIndices: indices,
      generatedAt: Date.now(),
    };
  },
};

// ─── Social LinkedIn Template ────────────────────────────────────────────────

const socialLinkedInTemplate: ContentTemplate = {
  type: 'social-linkedin',
  label: 'LinkedIn Post',
  description: 'Professional-tone sentences with hashtags for LinkedIn.',

  generate(intelligence: ContentIntelligence, _transcript: StandardTranscript): ContentResult {
    const { rankedSentences, keywords } = intelligence;

    // Find professional-tone sentences (10-30 words, no filler, has keyword)
    const keywordSet = new Set(keywords.slice(0, 10).map((k) => k.term.toLowerCase()));

    const candidates = rankedSentences
      .filter((s) => {
        const wc = wordCount(s.text);
        if (wc < 10 || wc > 30) return false;
        if (isFillerSentence(s.text)) return false;
        // Must contain at least one keyword
        const lower = s.text.toLowerCase();
        return [...keywordSet].some((kw) => lower.includes(kw));
      })
      .slice(0, 5);

    // Generate hashtags from top keywords
    const hashtags = keywords
      .slice(0, 3)
      .map((k) => `#${k.term.replace(/\s+/g, '')}`);

    const posts = candidates.map((c) => c.text);
    const rendered = posts.length > 0
      ? `${posts[0]}\n\n${hashtags.join(' ')}`
      : `Key insight from this discussion.\n\n${hashtags.join(' ')}`;

    return {
      type: 'social-linkedin',
      title: 'LinkedIn Post',
      sections: [{ body: rendered, sourceIndices: candidates.map((c) => c.segmentIndex) }],
      socialPosts: posts,
      hashtags,
      rendered,
      usedSegmentIndices: candidates.map((c) => c.segmentIndex),
      generatedAt: Date.now(),
    };
  },
};

// ─── Social Twitter Template ─────────────────────────────────────────────────

const socialTwitterTemplate: ContentTemplate = {
  type: 'social-twitter',
  label: 'Twitter/X Post',
  description: 'Short, impactful sentences under 280 characters.',

  generate(intelligence: ContentIntelligence, _transcript: StandardTranscript): ContentResult {
    const { rankedSentences, keywords } = intelligence;

    // Find sentences under 280 chars, ranked by TextRank
    const candidates = rankedSentences
      .filter((s) => s.text.length <= 280 && !isFillerSentence(s.text) && wordCount(s.text) >= 5)
      .slice(0, 5);

    const hashtags = keywords
      .slice(0, 2)
      .map((k) => `#${k.term.replace(/\s+/g, '')}`);

    const posts = candidates.map((c) => {
      const withTags = `${c.text} ${hashtags.join(' ')}`;
      return withTags.length <= 280 ? withTags : c.text;
    });

    const rendered = posts.join('\n\n---\n\n');

    return {
      type: 'social-twitter',
      title: 'Twitter/X Posts',
      sections: [{ body: rendered, sourceIndices: candidates.map((c) => c.segmentIndex) }],
      socialPosts: posts,
      hashtags,
      rendered: rendered || 'No suitable tweets could be extracted from this transcript.',
      usedSegmentIndices: candidates.map((c) => c.segmentIndex),
      generatedAt: Date.now(),
    };
  },
};

// ─── Template Registry ───────────────────────────────────────────────────────

/** All available content templates */
export const CONTENT_TEMPLATES: ContentTemplate[] = [
  blogTemplate,
  summaryShortTemplate,
  summaryDetailedTemplate,
  summaryExecutiveTemplate,
  faqTemplate,
  notesMeetingTemplate,
  notesQuickTemplate,
  socialLinkedInTemplate,
  socialTwitterTemplate,
];

/** Map of content type to template for quick lookup */
export const TEMPLATE_MAP: Record<ContentType, ContentTemplate> = {
  'blog': blogTemplate,
  'summary-short': summaryShortTemplate,
  'summary-detailed': summaryDetailedTemplate,
  'summary-executive': summaryExecutiveTemplate,
  'faq': faqTemplate,
  'notes-meeting': notesMeetingTemplate,
  'notes-quick': notesQuickTemplate,
  'social-linkedin': socialLinkedInTemplate,
  'social-twitter': socialTwitterTemplate,
};

/**
 * Generate content using the specified template.
 *
 * @param type - Content type to generate
 * @param intelligence - Precomputed intelligence cache
 * @param transcript - Source transcript
 * @returns Generated content result
 */
export function generateContent(
  type: ContentType,
  intelligence: ContentIntelligence,
  transcript: StandardTranscript
): ContentResult {
  const template = TEMPLATE_MAP[type];
  if (!template) {
    throw new Error(`Unknown content type: ${type}`);
  }
  return template.generate(intelligence, transcript);
}
