# Squicky Speech Intelligence Platform (SSIP)
## Creator Studio Module -- Architecture Document

> **Status:** Module Design Phase -- No code yet.  
> **Author role:** Lead Creator Tools Architect.  
> **Prerequisites:** Master Architecture Document (approved), UI/UX Design System (approved), Speech Engine Module (approved), Content Studio Module (approved).  
> **Purpose:** Complete architectural blueprint for the Creator Studio module -- a thin platform-formatting layer that consumes Content Studio intelligence and produces ready-to-publish outputs for YouTube, Podcasts, and Shorts/Reels creators.

---

## Table of Contents

1. [Creator Studio Architecture](#1-creator-studio-architecture)
2. [Creator Workflow](#2-creator-workflow)
3. [YouTube Mode Design](#3-youtube-mode-design)
4. [Podcast Mode Design](#4-podcast-mode-design)
5. [Shorts/Reels Mode Design](#5-shortsreels-mode-design)
6. [Content Repurposing Strategy](#6-content-repurposing-strategy)
7. [Dashboard UI Plan](#7-dashboard-ui-plan)
8. [Integration Strategy](#8-integration-strategy)
9. [Privacy Workflow](#9-privacy-workflow)
10. [Future Upgrade Roadmap](#10-future-upgrade-roadmap)

---

## 1. Creator Studio Architecture

### 1.1 Module Role & Responsibility

Creator Studio is a **THIN formatting layer** on top of Content Studio intelligence. It does NOT perform its own NLP extraction. It consumes the `ContentIntelligenceCache` -- the same cache that Content Studio populates with TextRank scores, TF-IDF keywords, topic boundaries, and extractive summaries.

**Core principle:** Creator Studio adds PLATFORM FORMATTING, not intelligence.

```
ContentIntelligenceCache (populated by Content Studio or self-triggered)
        |
        v
+-------------------+
| Creator Studio    |  <-- Thin layer
|                   |
| - Chapter detect  |  (uses topic_boundary_hint + timestamps)
| - Platform format |  (YouTube limits, podcast RSS, hashtags)
| - Mode routing    |  (YouTube / Podcast / Shorts)
| - Copy-ready UX   |  (one-click copy, character counts)
+-------------------+
        |
        v
Platform-ready outputs (paste into YouTube Studio, podcast host, etc.)
```

**What Creator Studio does NOT do:**
- Does NOT re-run TextRank or TF-IDF
- Does NOT duplicate Content Studio logic
- Does NOT craft creative hooks or attention-grabbing titles
- Does NOT perform video analysis or thumbnail generation
- Does NOT translate content between languages

**What Creator Studio DOES do:**
- Formats existing intelligence into platform-specific templates
- Detects chapters from topic boundaries + timestamps
- Applies character limits (YouTube title: 100 chars, description: 5000 chars)
- Provides mode-specific UI (YouTube/Podcast/Shorts views)
- Adds copy-to-clipboard, edit-in-place, and regenerate UX

### 1.2 Architectural Position

```
+------------------------------------------------------------------+
|                    SQUICKY PLATFORM MODULES                        |
+------------------------------------------------------------------+
|                                                                    |
|  Speech Engine --> Transcript Studio --> Content Studio             |
|                                              |                     |
|                                              v                     |
|                                   ContentIntelligenceCache         |
|                                         |         |                |
|                                         v         v                |
|                                  Creator Studio   Meeting Intel    |
|                                   /    |    \                      |
|                                  v     v     v                     |
|                             YouTube Podcast Shorts                  |
|                                                                    |
+------------------------------------------------------------------+
```

Creator Studio sits ONE level below Content Studio. It is a **consumer**, not a producer, of intelligence. The only original logic it contributes is:

1. **Chapter detection algorithm** (maps topic boundaries to timestamp markers)
2. **Platform formatting rules** (character limits, field structures, hashtag generation)
3. **Mode routing** (which outputs are relevant for which creator type)

### 1.3 Core Objectives

| # | Objective | Rationale |
|---|-----------|-----------|
| 1 | Never duplicate Content Studio logic | Single source of truth for intelligence |
| 2 | Produce copy-ready outputs | Creator pastes directly into YouTube Studio / podcast host |
| 3 | Support 3 creator modes | YouTube, Podcast, Shorts/Reels cover 90% of workflows |
| 4 | Complete in < 2 seconds | Cache-first means no heavy extraction at display time |
| 5 | Preserve Hindi/Hinglish | Original language maintained, no translation applied |
| 6 | Work within near-zero budget | Client-side only, no API calls, no server |
| 7 | Be honest about Stage 1 limits | Extractive outputs clearly labeled as keyword-based |

### 1.4 Cache-First Strategy

```
User opens Creator Studio
        |
        v
Check ContentIntelligenceCache
        |
   +----+----+
   |         |
   v         v
POPULATED   EMPTY
   |         |
   v         v
Use cache   Trigger extraction (same shared patterns)
directly    Populate cache, then format
   |              |
   v              v
   Format for platform --> Display outputs
```

- **Cache populated** (Content Studio opened previously): outputs in < 100ms
- **Cache empty** (Creator Studio opened first): triggers extraction via `@squicky/shared/intelligence-patterns`, populates cache, then formats (< 2s total)

### 1.5 Technology Constraints

| Constraint | Impact | Mitigation |
|-----------|--------|-----------|
| Near-zero budget | No paid APIs for title optimization | Honest keyword-based titles |
| Client-side only | No server-side generation | All formatting in browser |
| Stage 1 extractive | No abstractive generation | Clearly label as "keyword-based" |
| No video analysis | Cannot detect visual interest | Text-based highlight detection only |
| sessionStorage only | Data lost on tab close | Blob export always available |

---

## 2. Creator Workflow

### 2.1 Entry Points

```
Entry Point --> Quality Check --> Mode Selection --> Cache Check --> Output Generation --> User Editing --> Export/Copy
```

**Quality gate (first step):** Before generating any output, check `transcription_meta.quality_label`:
- "excellent" / "good": proceed normally, no banner
- "fair": proceed + show info banner "Transcript quality is moderate — generated titles and chapters may need more editing"
- "poor": proceed + show prominent warning "Low transcript quality — outputs will be less accurate. Review carefully."
- Creator workflow is NEVER blocked (even poor quality produces something useful — keywords still work)

Users reach Creator Studio via:
1. Direct sidebar navigation
2. "Format for YouTube/Podcast" button in Content Studio
3. "Create content" button in Transcript Studio

### 2.2 Mode Selection

```
+-------------------------------------------------------+
|   Select your creator mode:                             |
|   +-------------+  +-------------+  +---------------+  |
|   |  YOUTUBE    |  |  PODCAST    |  | SHORTS/REELS  |  |
|   | Long-form   |  | Audio-first |  | Short-form    |  |
|   | video       |  | episodes    |  | vertical      |  |
|   +-------------+  +-------------+  +---------------+  |
+-------------------------------------------------------+
```

- User selects ONE mode; mode determines visible output cards
- Switching modes does not re-process (cache persists)
- Last mode remembered in sessionStorage

### 2.3 User Editing Flow

Every output card supports: **Copy** (clipboard), **Edit** (inline with character counter), **Regenerate** (see below), **Export** (JSON download).

**Regenerate behavior per card type (Stage 1 — extractive is deterministic):**

| Card | What "Regenerate" does |
|------|----------------------|
| Title Suggestions | Shuffle keyword order; use 3rd-5th ranked bigrams instead of top 2; add/remove modifier word |
| Description | Swap takeaway sentences (use 4th-6th ranked instead of top 3); reorder topics |
| Chapters | Re-run with shifted topic threshold (0.20-0.35 instead of 0.25); may find different boundaries |
| Tags/Hashtags | Shuffle from top-25 pool (instead of fixed top-15); different subset each time |
| Highlights | Sample from top-20 (instead of top-10) with weighted random; different moments surface |
| Show Notes | Shuffle takeaway selection (diversity from different topics) |
| Pinned Comment | Use 2nd or 3rd highest-scored sentence instead of 1st |

After 3 regenerations on same card: show hint "Try editing directly for best results."

---

## 3. YouTube Mode Design

### 3.1 Output Cards

| Card | Source | Character Limit | Priority |
|------|--------|----------------|----------|
| Title Suggestions | TF-IDF bigrams/trigrams | 100 chars | High |
| Description | Template + chapters + takeaways | 5,000 chars | High |
| Chapters | topic_boundary_hint + timestamps | No limit | High |
| Tags | TF-IDF top 15-20 keywords | 500 chars total | Medium |
| Hashtags | Top 5 keywords with # prefix | 3-5 tags | Medium |
| Pinned Comment | Top quote + CTA template | 10,000 chars | Medium |
| Shorts Ideas | High-score sentences < 60 words | No limit | Low |
| SEO Blog | Content Studio blog template | No limit | Low |

### 3.2 Title Suggestions

**Algorithm:**
1. Retrieve top TF-IDF keywords (bigrams and trigrams preferred)
2. Combine into 3 title variations:
   - Variation A: Top bigram + context word
   - Variation B: Top trigram as-is
   - Variation C: Top keyword + "explained/overview"
3. Truncate to 100 characters; preserve Hindi/Hinglish as-is

**Honest limitation displayed to user:**
```
! These titles are keyword-based, not attention-grabbing hooks.
  They represent your content's core topics. Edit for personality.
```

### 3.3 Description Generation

**Template:**
```
[Intro sentence -- extractive summary first sentence]

CHAPTERS:
[Auto-generated chapter list with timestamps]

KEY TAKEAWAYS:
- [TextRank top sentence #1]
- [TextRank top sentence #2]
- [TextRank top sentence #3]

TOPICS COVERED:
[Comma-separated topic list]

#hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5
```

Rules: total < 5,000 chars. If exceeds: truncate takeaways first, then topics.

### 3.4 Chapter Generation

YouTube format: `0:00 Introduction\n2:15 Topic A\n8:42 Topic B...`

Rules:
- First chapter MUST be "0:00 Introduction" (YouTube requirement)
- Format: M:SS (< 1hr) or H:MM:SS (>= 1hr)
- Minimum 3 chapters (YouTube requirement)
- If < 3 boundaries detected: fall back to equal time divisions

### 3.5 Tags and Hashtags

**Tags:** TF-IDF top 15-20 keywords, comma-separated, < 500 chars total. Prioritize bigrams.

**Hashtags:** Top 5 TF-IDF single keywords prefixed with #, spaces removed (camelCase). Hindi keywords preserved in original script.

### 3.6 Pinned Comment Draft

```
"[Highest TextRank scored sentence, < 200 chars]"

What did you find most useful? Let me know in the comments!
If this helped, consider subscribing for more [topic] content.
```

### 3.7 Shorts Ideas

Filter scored_sentences where: TextRank > 75th percentile, word count < 60, contains top-10 keyword. Rank by score, return top 5 with timestamps and word counts.

### 3.8 SEO Blog

Reuses Content Studio blog template. Creator Studio adds: YouTube embed placeholder, "Watch full video" CTA, chapter links as section headers.

---

## 4. Podcast Mode Design

### 4.1 Output Cards

| Card | Source | Priority |
|------|--------|----------|
| Episode Title | TF-IDF bigrams/trigrams | High |
| Show Notes | Template + timestamps + takeaways | High |
| Key Takeaways | TextRank top 5 sentences | High |
| Guest Highlights | Non-host top sentences (if 2 speakers) | Medium |
| Chapter Markers | topic_boundary_hint + timestamps | Medium |
| Social Post Drafts | Content Studio social templates | Low |

### 4.2 Episode Title

Same algorithm as YouTube titles. Podcast additions: prefix with episode number if available. Format: "Ep. [N]: [Keyword-based title]". Limit: 200 chars.

### 4.3 Show Notes

**Template:**
```
EPISODE SUMMARY:
[Extractive summary first 2-3 sentences]

GUEST: [If 2 speakers: "Speaker 2"]

TOPICS DISCUSSED:
[Timestamp] - [Topic title]
...

KEY TAKEAWAYS:
- [TextRank top 5 sentences, one per topic for diversity]

RESOURCES MENTIONED:
[Placeholder -- user fills manually]
```

### 4.4 Key Takeaways

Top 5 TextRank sentences. Diversity rule: no two from same topic segment. If collision, skip to next highest from different topic.

### 4.5 Guest Highlights

**Trigger:** exactly 2 speakers detected.
- Host = more talk time, Guest = less talk time
- Filter guest's sentences by TextRank score
- Return top 5 as pull quotes with timestamps
- If only 1 speaker: card hidden entirely

### 4.6 Chapter Markers (Podcast Format)

Same detection as YouTube. Podcast-specific: always HH:MM:SS format, include "Introduction" and "Closing Thoughts" bookends. Export option for podcast chapter XML.

### 4.7 Social Post Drafts

Reuses Content Studio social templates with podcast additions:
- "Listen to the full episode: [link placeholder]"
- Podcast CTAs ("Subscribe", "Rate & Review")
- Quote format for audiogram-style posts

---

## 5. Shorts/Reels Mode Design

### 5.1 Output Cards

| Card | Source | Priority |
|------|--------|----------|
| Highlight Detection | TextRank + duration + keyword | High |
| Hook Suggestions | Topic openers (first sentence per segment) | High |
| Caption Ideas | Short sentences + hashtags (< 150 chars) | Medium |
| Best Timestamps | Self-contained high-score segments < 60s | Medium |

### 5.2 Highlight Detection

**Scoring:** `highlight_score = textrank_score * keyword_presence * brevity_factor`
- `keyword_presence`: 1.5x if contains top-10 keyword, else 1.0x
- `brevity_factor`: 1.3x if < 30 words, 1.0x if 30-60, 0.7x if > 60

Group consecutive high-scorers into clips. Filter where total duration < 60s. Return top 10 ranked by average highlight_score.

### 5.3 Hook Suggestions

Extract FIRST sentence of each topic segment (topic openers). Score by TextRank, return sorted.

**Honest limitation:**
```
! These are topic openers, not crafted hooks. Topic transitions
  naturally introduce ideas engagingly. Edit to sharpen for short-form.
```

### 5.4 Caption Ideas

Filter sentences: < 150 chars, TextRank > median, contains keyword. Append top 3 hashtags. Ensure total < 150 chars. Return top 10.

### 5.5 Best Timestamps

For each topic segment: calculate average TextRank, filter where duration < 60s and score > 70th percentile. Return top 5 self-contained segments with timestamp ranges.

---

## 6. Content Repurposing Strategy

### 6.1 Repurposing Matrix

ALL workflows reuse Content Studio templates. Creator Studio adds platform formatting, character limits, and copy-to-clipboard UX.

| Source | Target | Content Studio Template | Creator Studio Addition |
|--------|--------|------------------------|------------------------|
| Video | Blog Post | Blog template | YouTube embed + chapter links |
| Podcast | Article | Article template | Speaker-aware Q&A format |
| Transcript | Social Posts | Social templates | Platform character limits |
| Long Video | Shorts Ideas | -- | Highlight detection + timestamps |
| Interview | Quote Cards | -- | Guest top 5 sentences < 30 words |

### 6.2 Video to Blog

Pipeline: `ContentIntelligenceCache` --> Content Studio blog template --> Creator Studio adds YouTube embed, "Watch full video" CTA, chapter links as section headers.

### 6.3 Podcast to Article

If 2 speakers: format as Q&A (host bold, guest regular text with pull quotes). Add "Listen to full episode" CTA and topic headers from chapters.

### 6.4 Transcript to Social Posts

Apply platform limits: Twitter 280 chars / 2-3 hashtags, LinkedIn 3,000 chars / 3-5 hashtags, Instagram 2,200 chars / 20-30 hashtags.

### 6.5 Interview to Quote Cards

Guest speaker's top 5 sentences: TextRank > 75th percentile, < 30 words, contains keyword. Format with attribution and timestamp.

---

## 7. Dashboard UI Plan

### 7.1 Main Layout

```
+====================================================================+
|  SQUICKY - Creator Studio                              [Export All] |
+====================================================================+
|  +------------------+------------------+--------------------+       |
|  | [*] YOUTUBE      |  [ ] PODCAST     |  [ ] SHORTS/REELS |       |
|  +------------------+------------------+--------------------+       |
|                                                                     |
|  +-----------------------------------------------+ +-----------+   |
|  |  OUTPUT CARDS (mode-specific, scrollable)      | |  QUALITY  |   |
|  |                                                | |           |   |
|  |  +-------------------------------------------+| |  Score: B |   |
|  |  | Title Suggestions               [Copy]   || |  Words:   |   |
|  |  |                                           || |  12,450   |   |
|  |  | 1. "Hindi Speech Recognition Guide"       || |  Duration:|   |
|  |  | 2. "Open Source ASR for Indian Lang"       || |  45:30    |   |
|  |  | 3. "Speech to Text: Complete Overview"     || |  Topics:7 |   |
|  |  |                                           || |  Keys: 23 |   |
|  |  | [Edit] [Regenerate]                       || |  Chaps: 5 |   |
|  |  +-------------------------------------------+| |  Mode:    |   |
|  |                                                | |  YouTube  |   |
|  |  +-------------------------------------------+| +-----------+   |
|  |  | Description                      [Copy]   ||                  |
|  |  | [Generated text with chapters,            ||                  |
|  |  |  takeaways, hashtags]                     ||                  |
|  |  | Chars: 2,340 / 5,000                      ||                  |
|  |  | [Edit] [Regenerate]                       ||                  |
|  |  +-------------------------------------------+|                  |
|  |                                                |                  |
|  |  +-------------------------------------------+|                  |
|  |  | Chapters                         [Copy]   ||                  |
|  |  | 0:00  Introduction                        ||                  |
|  |  | 2:15  Speech Recognition Basics           ||                  |
|  |  | 8:42  Hindi Language Support              ||                  |
|  |  | 15:30 Performance Optimization            ||                  |
|  |  | [Edit] [+ Add Chapter] [Regenerate]       ||                  |
|  |  +-------------------------------------------+|                  |
|  +-----------------------------------------------+                  |
+=====================================================================+
```

### 7.2 Output Card Component

```
+--------------------------------------------------+
| [Icon] Card Title                    [Copy All]  |
+--------------------------------------------------+
| [Generated content]                               |
| Character count: X / Y (if limit applies)        |
+--------------------------------------------------+
| [Edit]  [Regenerate]  [Export]  [Hide]           |
+--------------------------------------------------+
```

Card states: Default (read-only), Editing (editable + counter), Loading (skeleton), Error (warning + reason), Hidden (collapsed to title bar).

### 7.3 Quality Panel

| Metric | Source |
|--------|--------|
| Quality Score (A-F) | Content richness assessment |
| Word Count | Transcript length |
| Duration | Audio/video duration |
| Topic Count | Detected boundaries |
| Keyword Count | TF-IDF results |
| Chapter Count | Detected chapters |

**Score mapping (composite — word count + transcript quality):**

```
Quality Score = min(word_count_grade, quality_label_grade)

word_count_grade:    A (>10k words), B (5k-10k), C (2k-5k), D (500-2k), F (<500)
quality_label_grade: A (excellent), B (good), C (fair), D (poor), F (null/unknown)

Final = LOWER of the two
```

This ensures a 15,000-word transcript with "poor" quality_label gets score D (not A). Length alone does not equal quality.

### 7.4 Mode-Specific Card Visibility

| Card | YouTube | Podcast | Shorts |
|------|---------|---------|--------|
| Title Suggestions | Yes | Yes | No |
| Description | Yes | No | No |
| Show Notes | No | Yes | No |
| Chapters | Yes | Yes | No |
| Tags | Yes | No | No |
| Hashtags | Yes | No | Yes |
| Pinned Comment | Yes | No | No |
| Key Takeaways | No | Yes | No |
| Guest Highlights | No | Yes* | No |
| Highlights/Shorts Ideas | Yes | No | Yes |
| Hook Suggestions | No | No | Yes |
| Caption Ideas | No | No | Yes |
| Best Timestamps | No | No | Yes |
| Social Posts | No | Yes | No |
| SEO Blog | Yes | No | No |

*Only if 2 speakers detected.

### 7.5 Responsive Layout

- **Desktop (> 1024px):** Output cards (left, scrollable) + Quality panel (right, fixed)
- **Tablet (768-1024px):** Quality collapsed to top bar + full-width cards
- **Mobile (< 768px):** Mode tabs (horizontal scroll) + inline quality badge + stacked cards

---

## 8. Integration Strategy

### 8.1 ContentIntelligenceCache Interface

Creator Studio consumes the canonical `ContentIntelligenceCache` interface (defined in Content Studio, Section 7.6). The approved interface provides:

```typescript
// CANONICAL interface (from Content Studio — authoritative source):
interface ContentIntelligenceCache {
  getTopics(): Topic[] | null;
  getKeywords(): Keyword[] | null;
  getActionItems(): ActionItem[] | null;
  getDecisions(): Decision[] | null;
  getSummary(type: 'short' | 'detailed'): string | null;
  isPopulated(): boolean;
  isStale(): boolean;
  populate(intelligence: ExtractedIntelligence): void;
  invalidate(): void;
}
```

**Creator Studio derives additional data via wrapper utilities (NOT by extending the cache interface):**

```typescript
// Creator Studio's derived helpers (local to this module, not on cache):
function getTopicBoundaries(cache: ContentIntelligenceCache): BoundaryMarker[] {
  const topics = cache.getTopics();
  if (!topics) return [];
  return topics.filter(t => t.isBoundary).map(t => ({
    timestamp: t.startTime,
    label: t.topicLabel,
    segmentId: t.segmentId
  }));
}

function getBigrams(cache: ContentIntelligenceCache): ScoredPhrase[] {
  const keywords = cache.getKeywords();
  if (!keywords) return [];
  return keywords.filter(k => k.term.split(' ').length === 2);
}

function getTrigrams(cache: ContentIntelligenceCache): ScoredPhrase[] {
  const keywords = cache.getKeywords();
  if (!keywords) return [];
  return keywords.filter(k => k.term.split(' ').length === 3);
}

function getSpeakerSentences(speakerId: string, sentences: ScoredSentence[]): ScoredSentence[] {
  return sentences.filter(s => s.speaker_id === speakerId);
}

function getTopSentencesDiverse(sentences: ScoredSentence[], n: number): ScoredSentence[] {
  // Diversity rule: no two from same topic segment
  const selected: ScoredSentence[] = [];
  const usedTopics = new Set<string>();
  for (const s of sentences.sort((a, b) => b.score - a.score)) {
    if (!usedTopics.has(s.topicId)) {
      selected.push(s);
      usedTopics.add(s.topicId);
    }
    if (selected.length >= n) break;
  }
  return selected;
}
```

**Key principle:** The canonical cache interface is NEVER extended by downstream modules. Creator Studio derives what it needs from existing methods. This prevents interface sprawl and keeps the contract stable.

### 8.2 Shared Intelligence Patterns

Creator Studio imports from `@squicky/shared/intelligence-patterns` (NOT from Content Studio directly):

```typescript
import {
  extractKeywords,
  scoreSentences,
  detectTopics,
  generateSummary,
} from '@squicky/shared/intelligence-patterns';
```

**Critical rule:** No direct imports from Content Studio module. All shared logic lives in the shared patterns package to prevent tight coupling.

### 8.3 Self-Triggered Extraction

```typescript
async function ensureCachePopulated(transcript: StandardTranscript): Promise<void> {
  if (ContentIntelligenceCache.isPopulated()) return;

  const keywords = await extractKeywords(transcript);
  const sentences = await scoreSentences(transcript);
  const topics = await detectTopics(transcript);
  const summary = await generateSummary(transcript);

  ContentIntelligenceCache.populate({
    keywords, sentences, topics, summary,
    source: 'creator-studio',
    timestamp: Date.now(),
  });
}
```

### 8.4 Platform Formatting Layer (Creator Studio's unique contribution)

```typescript
interface PlatformFormatter {
  // YouTube
  formatYouTubeTitle(keywords: ScoredKeyword[]): string[];
  formatYouTubeDescription(data: DescriptionData): string;
  formatYouTubeTags(keywords: ScoredKeyword[]): string;
  formatYouTubeChapters(boundaries: BoundaryMarker[]): string;
  // Podcast
  formatPodcastShowNotes(data: ShowNotesData): string;
  formatPodcastChapters(boundaries: BoundaryMarker[]): string;
  formatGuestHighlights(sentences: ScoredSentence[]): string;
  // Shorts
  formatHighlightClips(sentences: ScoredSentence[]): HighlightClip[];
  formatCaptions(sentences: ScoredSentence[], hashtags: string[]): string[];
  formatHookSuggestions(openers: ScoredSentence[]): string[];
}
```

### 8.5 Chapter Detection Algorithm

```
Step 1: Filter segments where topic_boundary_hint = true
Step 2: Each boundary becomes a chapter marker
Step 3: Chapter title = top 2 TF-IDF keywords from that segment (capitalized, < 50 chars)
Step 4: Timestamp = segment.start formatted as M:SS or H:MM:SS
Step 5: If < 3 boundaries: fall back to equal time divisions (every 5 min)
Step 6: User can add/remove/rename chapters manually (survives regeneration)
```

**Pseudocode:**

```typescript
function detectChapters(segments: TopicSegment[], totalDuration: number): Chapter[] {
  const boundaries = segments.filter(s => s.topic_boundary_hint === true);

  if (boundaries.length < 3) {
    return generateEqualDivisions(totalDuration, segments);
  }

  const chapters: Chapter[] = [
    { timestamp: formatTimestamp(0, totalDuration), title: 'Introduction' }
  ];

  for (const boundary of boundaries) {
    const keywords = extractKeywords(boundary.text).slice(0, 2);
    const title = keywords.map(k => capitalize(k.term)).join(' ');
    chapters.push({
      timestamp: formatTimestamp(boundary.start, totalDuration),
      title: truncate(title, 50),
    });
  }
  return chapters;
}

function formatTimestamp(seconds: number, total: number): string {
  if (total >= 3600) {
    return `${Math.floor(seconds/3600)}:${pad(Math.floor((seconds%3600)/60))}:${pad(seconds%60)}`;
  }
  return `${Math.floor(seconds/60)}:${pad(seconds%60)}`;
}
```

---

## 9. Privacy Workflow

### 9.1 Privacy Model

| Principle | Implementation |
|-----------|----------------|
| Zero server | All processing client-side in browser |
| No persistent storage | sessionStorage only (dies with tab) |
| No analytics | No tracking of content, outputs, or usage |
| No external calls | No API calls to YouTube, podcast hosts, or social platforms |
| User owns data | Export via Blob download at any time |
| No cloud sync | No accounts, no cross-device persistence |

### 9.2 Data Lifecycle

```
ContentIntelligenceCache (sessionStorage)
    --> Creator Studio formats (in-memory)
        --> Display in UI (DOM)
            --> User action: COPY (clipboard) or EXPORT (Blob download)
                --> Tab close = all data permanently destroyed
```

### 9.3 Storage Map

| Data | Location | Lifetime |
|------|----------|----------|
| Intelligence cache | sessionStorage | Tab session |
| User edits | sessionStorage | Tab session |
| Mode selection | sessionStorage | Tab session |
| Exported files | User filesystem | User-controlled |
| Original audio | NOT stored | N/A |

### 9.4 ExportPayload Schema

```json
{
  "source_module": "creator-studio",
  "payload_version": "1.0",
  "payload_type": "creator",
  "data": {
    "mode": "youtube",
    "chapters": [
      { "timestamp": "0:00", "title": "Introduction" },
      { "timestamp": "2:15", "title": "Speech Recognition Basics" },
      { "timestamp": "8:42", "title": "Hindi Language Support" }
    ],
    "description": "Full formatted YouTube description...",
    "tags": ["speech recognition", "hindi", "ASR", "open source"],
    "highlights": [
      { "text": "Key moment text...", "timestamp": "3:42", "duration_sec": 45 }
    ],
    "title_suggestions": [
      "Hindi Speech Recognition: Complete Guide",
      "Speech to Text for Indian Languages",
      "Automatic Speech Recognition Explained"
    ],
    "social_posts": {
      "linkedin": "Just published a deep dive on...",
      "twitter": "Hindi ASR has reached 94% accuracy...",
      "instagram": "The future of Indian language AI... #SpeechRecognition"
    }
  }
}
```

**How Export Center handles this:** Export Center does NOT differentiate by `mode`. It renders whatever sections exist in `data` and skips absent ones. The `mode` field is informational metadata (used in export filename: `{title}_{mode}_export.pdf` and document header). YouTube-mode exports have chapters+tags; Podcast-mode exports have show-notes+takeaways — Export Center renders what's present, ignores what's not.

---

## 10. Future Upgrade Roadmap

### 10.1 Stage Progression

| Stage | Capability | Creator Studio Impact |
|-------|-----------|----------------------|
| Stage 1 (Launch) | Extractive only | Keyword-based titles, structured outputs, honest limitations |
| Stage 2 (Growth) | Hybrid extractive + light generation | Better titles, refined descriptions, smarter hooks |
| Stage 3 (Scale) | Full generative AI | Crafted hooks, A/B variants, thumbnail suggestions |

### 10.2 Stage 1 Honest Limitations

**What works well:**
- Chapter detection from topic boundaries (high accuracy)
- Tag/hashtag generation (keyword extraction is reliable)
- Description structuring (template-based, consistent)
- Highlight detection (TextRank + brevity scoring)
- Show notes and quote card extraction

**What is limited:**
- Titles are keyword-based, not attention-grabbing hooks
- Descriptions are structured but not "crafted" with personality
- Shorts detection finds quotable moments but cannot identify visual interest
- Everything is text-based (no video analysis, no thumbnail)
- Hindi/Hinglish outputs preserve original language (no translation)
- Social posts are template-based, not engagement-optimized

**Value proposition:** Saves 70% of structuring work. User adds personality in remaining 30%.

### 10.3 Stage 2 Planned Improvements

| Feature | Stage 1 | Stage 2 |
|---------|---------|---------|
| Titles | Keyword combinations | Light rephrasing for readability |
| Descriptions | Template + extractive | Lightly edited intro |
| Hooks | Topic openers as-is | Openers with punch-up |
| Social posts | Template-based | Platform-tone-aware |
| Chapters | Keyword titles | More natural names |
| Thumbnails | Not available | Text overlay suggestions |

Requirements: small client-side model (< 1GB) via WebLLM, fine-tuned for title/hook improvement.

### 10.4 Stage 3 Capabilities

- Crafted titles with A/B CTR-optimized variants
- Written hook scripts for Shorts
- Platform-specific versions (YouTube vs TikTok vs Instagram)
- Trend-aware hashtag suggestions (requires API)
- Multi-language generation from single source
- Video frame analysis for clip selection
- Requires: server-side LLM, platform APIs, user accounts, operational budget

### 10.5 Hindi/Hinglish Roadmap

| Stage | Support Level |
|-------|--------------|
| 1 | Preserve as-is. No translation. Keywords in original language. |
| 2 | Transliteration options (Devanagari <-> Roman). Better Hindi keyword extraction. |
| 3 | Hindi-optimized generation. Bilingual outputs. Platform-specific Hindi hashtags. |

---

## 11. Error Handling

### 11.1 Error Scenarios

| Scenario | Detection | Response |
|----------|----------|----------|
| No transcript loaded | transcript === null | "Load a transcript first" + link to Speech Engine |
| Very short (< 500 words) | wordCount check | Quality F, limited cards shown with warning |
| No timestamps | segments lack start/end | Chapter card hidden; other outputs unaffected |
| No topic boundaries | all hints false | Chapters fall back to equal time divisions |
| Single speaker (podcast) | speakers.length === 1 | Guest Highlights card hidden |
| Very long (> 60 min) | duration check | Cap analysis at first 60 minutes with warning |
| Cache corruption | JSON parse failure | Clear cache, re-extract automatically |
| Storage full | QuotaExceededError | Prompt export, clear old sessions |

### 11.2 Graceful Degradation

| Content Length | Available Outputs | Hidden Outputs |
|--------------|-------------------|----------------|
| > 10,000 words | All at full quality | None |
| 5,000-10,000 | All, slightly fewer variations | None |
| 2,000-5,000 | Titles, tags, description, basic chapters | Shorts may be sparse |
| 500-2,000 | Titles, tags, basic description | Chapters, shorts, guest highlights |
| < 500 | Basic keywords only | Most cards hidden |

---

## 12. Technical Specifications

### 12.1 Component Architecture

```
creator-studio/
  +-- index.ts                    # Module entry point
  +-- CreatorStudioView.tsx        # Main view
  +-- modes/
  |     +-- YouTubeMode.tsx
  |     +-- PodcastMode.tsx
  |     +-- ShortsMode.tsx
  +-- formatters/
  |     +-- youtube.ts
  |     +-- podcast.ts
  |     +-- shorts.ts
  |     +-- common.ts
  +-- algorithms/
  |     +-- chapter-detection.ts
  |     +-- highlight-scoring.ts
  |     +-- title-generation.ts
  +-- components/
  |     +-- OutputCard.tsx
  |     +-- ModeSelector.tsx
  |     +-- QualityPanel.tsx
  |     +-- CharacterCounter.tsx
  +-- hooks/
  |     +-- useCreatorCache.ts
  |     +-- useChapters.ts
  |     +-- usePlatformFormat.ts
  +-- types/
  |     +-- creator.types.ts
  |     +-- export.types.ts
  +-- __tests__/
        +-- chapter-detection.test.ts
        +-- highlight-scoring.test.ts
        +-- formatters.test.ts
```

### 12.2 Key Interfaces

```typescript
type CreatorMode = 'youtube' | 'podcast' | 'shorts';

interface Chapter {
  timestamp: string;
  startSeconds: number;
  title: string;
  isManual: boolean;
}

interface HighlightClip {
  text: string;
  timestamp: string;
  startSeconds: number;
  durationSec: number;
  score: number;
  keywords: string[];
}

interface OutputCard {
  id: string;
  type: OutputCardType;
  title: string;
  content: string;
  charLimit?: number;
  charCount: number;
  isEdited: boolean;
  isHidden: boolean;
  mode: CreatorMode;
}
```

### 12.3 Performance Budget

| Operation | Target |
|-----------|--------|
| Cache read | < 5ms |
| Chapter detection | < 50ms |
| Title generation | < 20ms |
| Description formatting | < 30ms |
| Highlight scoring | < 100ms |
| Full mode render | < 200ms |
| Self-triggered extraction | < 2000ms |
| Mode switch | < 50ms |

### 12.4 Testing Strategy

| Type | Target | Tool |
|------|--------|------|
| Unit | Chapter detection, highlight scoring, formatters | Vitest |
| Component | OutputCard, ModeSelector, QualityPanel | Vitest + Testing Library |
| Integration | Cache access, mode switching, export | Vitest |
| Visual | Card layouts, responsive breakpoints | Playwright |
| Accessibility | ARIA labels, keyboard nav | axe-core |

---

## 13. Stage 1 Value Summary

| Task (Manual) | Time Without Squicky | Time With Squicky | Savings |
|--------------|---------------------|-------------------|---------|
| YouTube description + chapters | 15-20 min | 2-3 min | ~85% |
| Podcast show notes | 20-30 min | 3-5 min | ~80% |
| Finding Shorts-worthy moments | 30-60 min | 1-2 min | ~95% |
| Tag research | 10-15 min | < 1 min | ~95% |
| Social post drafts | 15-20 min/platform | 2-3 min | ~85% |
| Blog post from video | 60-90 min | 10-15 min | ~80% |

**Average savings: 70-85%.** The remaining 15-30% is where creators add personality, verify accuracy, and make editorial choices -- the VALUABLE part of creation.

---

## 14. Appendix

### 14.1 Glossary

| Term | Definition |
|------|-----------|
| ContentIntelligenceCache | Shared cache holding NLP results (keywords, scores, topics) |
| TextRank | Graph-based sentence importance scoring |
| TF-IDF | Term Frequency-Inverse Document Frequency -- keyword extraction |
| topic_boundary_hint | Boolean flag on segments indicating topic change |
| StandardTranscript | Normalized transcript from Speech Engine |
| Extractive | Selecting existing text vs generating new text |
| Thin layer | Module adding formatting, not intelligence |

### 14.2 Related Documents

| Document | Relevance |
|----------|-----------|
| Master Architecture | Platform patterns, module communication rules |
| UI/UX Design System | Component library, design tokens |
| Speech Engine Module | StandardTranscript schema, segment structure |
| Content Studio Module | ContentIntelligenceCache, extraction algorithms |

### 14.3 Dependencies

```
creator-studio
  +-- @squicky/shared/intelligence-patterns (REQUIRED)
  +-- ContentIntelligenceCache (REQUIRED)
  +-- StandardTranscript from Speech Engine (REQUIRED)
  +-- UI Component Library from Design System (REQUIRED)
  +-- Content Studio Module (OPTIONAL -- warm cache benefit only)
```

---

*End of Creator Studio Module Architecture Document.*  
*Version: 1.0 | Module Design Phase*  
*Next: Content Studio Module architecture must be approved before implementation begins.*
