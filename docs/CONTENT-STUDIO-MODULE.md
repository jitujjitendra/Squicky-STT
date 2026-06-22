# Squicky Speech Intelligence Platform (SSIP)
## Content Studio Module -- Architecture Document

> **Status:** Module Design Phase -- No code yet.  
> **Author role:** Lead Content Intelligence Architect.  
> **Prerequisites:** Master Architecture Document (approved), UI/UX Design System (approved), Speech Engine Module (approved).  
> **Purpose:** Complete architectural blueprint for the Content Studio module -- transforms structured transcripts into publishable content formats using extractive intelligence at Stage 1 and generative intelligence at later stages.

---

## Table of Contents

1. [Content Studio Architecture](#1-content-studio-architecture)
2. [Content Generation Pipeline](#2-content-generation-pipeline)
3. [Content Intelligence Design](#3-content-intelligence-design)
4. [Template System Design](#4-template-system-design)
5. [SEO Content Strategy](#5-seo-content-strategy)
6. [Validation System](#6-validation-system)
7. [Integration Strategy](#7-integration-strategy)
8. [Privacy Workflow](#8-privacy-workflow)
9. [Performance Strategy](#9-performance-strategy)
10. [Future Upgrade Roadmap](#10-future-upgrade-roadmap)
11. [Speaker-Aware Content Generation](#11-speaker-aware-content-generation)
12. [Content Review Interface](#12-content-review-interface)
13. [Squicky Differentiator Workflows](#13-squicky-differentiator-workflows)
14. [Multi-Language Content Strategy](#14-multi-language-content-strategy)
15. [Mobile Experience](#15-mobile-experience)
16. [Error Handling](#16-error-handling)

---

## 1. Content Studio Architecture

### 1.1 Module Role & Responsibility

The Content Studio is the **value multiplier** of the Squicky platform. While the Speech Engine converts audio to text, the Content Studio converts that text into **publishable, shareable, actionable content formats**.

**Responsibility chain:**

```
StandardTranscript --> Content Intelligence --> Template Engine --> Content Formats --> Export
```

### 1.2 Brutal Honesty: Stage 1 Limitations

At Stage 1 (near-zero budget), the Content Studio uses ONLY extractive techniques:

| What Users Expect | What Stage 1 Actually Delivers | Why |
|-------------------|-------------------------------|-----|
| "Write me a blog post" | Restructured transcript with headings | No generative AI -- content is reorganized, not rewritten |
| "Create social media posts" | Best quotes extracted from transcript | No "crafted hooks" -- most impactful existing sentences |
| "Summarize this meeting" | Top sentences by TextRank score | Not abstract summary -- verbatim important sentences |
| "Generate FAQ" | Question-pattern sentences + context | Rule-based "?" detection, not generated Q&A pairs |
| "Article from interview" | Speaker turns reorganized by topic | Restructured transcript, not a polished article |

**The honest value proposition at Stage 1:** We save users 70% of the manual reorganization work. They still edit and polish. We are a **first draft accelerator**, not a content writer.

**Why this is still valuable:** Zero cost, 100% privacy (client-side), instant results, no rate limits, works offline.

### 1.3 Supported Content Types

| Content Type | Stage 1 Technique | Quality | User Effort After |
|-------------|-------------------|---------|-------------------|
| Blog Article | TextRank + heading insertion | Medium | High editing |
| Summary (Short) | TextRank top-3 sentences | Good | Light editing |
| Summary (Detailed) | TextRank top-30% sentences | Good | Light editing |
| Summary (Executive) | TextRank + action item extraction | Good | Medium editing |
| FAQ | Question-pattern detection + context | Medium | Medium editing |
| Notes (Meeting) | Action + decision + key point extraction | Good | Light editing |
| Notes (Study) | Topic segmentation + key concepts | Medium | Medium editing |
| Notes (Quick) | TF-IDF keywords + first sentence per topic | Good | Minimal editing |
| Article | Speaker-aware topic restructuring | Low-Medium | Heavy editing |
| Social Media (LinkedIn) | Professional-tone sentences via TF-IDF | Medium | Medium editing |
| Social Media (Twitter) | Sentences under 280 chars ranked by impact | Medium | Light editing |
| Social Media (Instagram) | Key quotes + hashtag extraction | Low-Medium | Medium editing |
| Newsletter Draft | Section headers + top sentences per section | Medium | High editing |

### 1.4 Architecture Diagram

```
+------------------------------------------------------------------+
|                     CONTENT STUDIO MODULE                          |
+------------------------------------------------------------------+
|  +------------------+    +----------------------+                  |
|  | Input Layer      |    | Intelligence Layer   |                  |
|  | StandardTranscript    | TextIntelligence-    |                  |
|  | (segments[])     |--->| Provider (interface) |                  |
|  | (speakers[])     |    | - ExtractiveProvider |                  |
|  | (metadata)       |    | - LocalModelProvider |                  |
|  +------------------+    | - CloudLLMProvider   |                  |
|                          +----------+-----------+                  |
|                                     |                              |
|                          +----------+-----------+                  |
|                          | Template Engine      |                  |
|                          | Blog, Summary, FAQ,  |                  |
|                          | Notes, Social, News  |                  |
|                          +----------+-----------+                  |
|                                     |                              |
|                          +----------+-----------+                  |
|                          | Output Layer         |                  |
|                          | ContentResult +      |                  |
|                          | QualityScore +       |                  |
|                          | ExportFormats        |                  |
|                          +----------------------+                  |
+------------------------------------------------------------------+
```

### 1.5 Data Source Selection

The Content Studio uses `text` from user-edited segments and `text_original` from unedited segments:

```typescript
for each segment in StandardTranscript.segments[]:
  if segment.text !== segment.text_original:
    source = segment.text           // User edited -- respect their corrections
  else:
    source = segment.text_original  // Unedited -- use original transcription
```

---

## 2. Content Generation Pipeline

### 2.1 Pipeline Overview

```
StandardTranscript --> Preprocessing --> Analysis --> Intelligence --> Templating --> Validation --> ContentResult
```

### 2.2 Preprocessing Stage

| Step | Operation | Rationale |
|------|-----------|-----------|
| 1 | Merge segments < 5 words with adjacent | Short fragments break analysis |
| 2 | Normalize whitespace and punctuation | Consistent NLP input |
| 3 | Resolve speaker labels to display names | Attribution support |
| 4 | Build full-text corpus | Document-level analysis |
| 5 | Detect language per segment | Route to correct processing |
| 6 | Mark segment boundaries | Preserve source mapping |

```typescript
interface PreprocessedCorpus {
  fullText: string;
  sentences: ScoredSentence[];
  speakerTurns: SpeakerTurn[];
  topicSegments: TopicSegment[];
}

function buildCorpus(transcript: StandardTranscript): PreprocessedCorpus {
  const segments = transcript.segments.map(seg => ({
    text: seg.text !== seg.text_original ? seg.text : seg.text_original,
    speaker: seg.speaker_id,
    startTime: seg.start,
    endTime: seg.end
  }));
  const merged = mergeShortSegments(segments, 5);
  const sentences = splitIntoSentences(merged);
  const speakerTurns = groupBySpeaker(merged);
  const topicSegments = detectTopicBoundaries(merged);
  return { fullText: merged.map(s => s.text).join(' '), sentences, speakerTurns, topicSegments };
}
```

### 2.3 Analysis Stage

#### TF-IDF Keyword Extraction

- Term Frequency counted per transcript, compared against pre-built static IDF table (~15K English terms from Wikipedia)
- Score = TF * IDF; high score = important to THIS document but rare generally
- Also extracts scored bigrams (two-word phrases)
- **Performance target:** < 500ms for 50,000 words

#### TextRank Sentence Scoring

- Each sentence = node in similarity graph
- Edge weight = cosine similarity of TF-IDF vectors
- PageRank-style iteration (damping=0.85, max 30 iterations)
- Top-N sentences by score = extractive summary
- **Performance target:** < 2 seconds for 1000 sentences

#### Topic Detection

- Sliding window TF-IDF comparison (window=5 sentences)
- When cosine similarity between adjacent windows < 0.3, mark topic boundary
- Topic titles generated from top 2-3 keywords per segment

### 2.4 Pipeline Execution

```typescript
async function executePipeline(transcript: StandardTranscript, config: PipelineConfig): Promise<ContentResult> {
  const corpus = buildCorpus(transcript);                              // <100ms
  const analysis = config.useWebWorker
    ? await runInWorker('analyze', corpus)                             // Off main thread
    : analyzeSync(corpus);
  const intelligence = await provider.process(corpus.fullText, config.contentType, config.options);
  const content = applyTemplate(config.contentType, intelligence, analysis);
  const validation = validateContent(content, config.contentType);
  return { content, validation, metadata: { executionTime: performance.now() - start, provider: provider.name } };
}
```

---

## 3. Content Intelligence Design

### 3.1 TextIntelligenceProvider Interface

```typescript
interface TextIntelligenceProvider {
  readonly name: string;
  readonly stage: 'extractive' | 'local-model' | 'cloud-llm';
  capabilities(): ProviderCapabilities;
  process(transcriptText: string, task: ContentTask, options: ProcessOptions): Promise<IntelligenceResult>;
}

interface ProviderCapabilities {
  supportedTasks: ContentTask[];
  maxInputLength: number;
  supportsStreaming: boolean;
  requiresNetwork: boolean;
  estimatedLatency: 'instant' | 'fast' | 'slow';
  qualityLevel: 'extractive' | 'near-human' | 'human-level';
}

type ContentTask =
  | 'summarize-short' | 'summarize-detailed' | 'summarize-executive'
  | 'extract-keywords' | 'extract-faq' | 'extract-actions' | 'extract-decisions'
  | 'generate-blog' | 'generate-article'
  | 'generate-social-linkedin' | 'generate-social-twitter' | 'generate-social-instagram'
  | 'generate-newsletter'
  | 'generate-notes-meeting' | 'generate-notes-study' | 'generate-notes-quick';

interface IntelligenceResult {
  success: boolean;
  content: { title?: string; sections: ContentSection[]; rawText: string; wordCount: number };
  quality: { overallScore: number; coherence: number; coverage: number; readability: number; estimatedEditEffort: 'minimal' | 'light' | 'medium' | 'heavy' };
}
```

### 3.2 ExtractiveProvider (Stage 1)

No neural networks, no API calls, no generative models. 100% client-side JavaScript.

```typescript
class ExtractiveProvider implements TextIntelligenceProvider {
  readonly name = 'extractive-v1';
  readonly stage = 'extractive';

  capabilities(): ProviderCapabilities {
    return {
      supportedTasks: [/* all 16 tasks */],
      maxInputLength: 500000,
      supportsStreaming: false,
      requiresNetwork: false,      // 100% client-side
      estimatedLatency: 'fast',
      qualityLevel: 'extractive'
    };
  }

  async process(text: string, task: ContentTask, options: ProcessOptions): Promise<IntelligenceResult> {
    // Routes to specific extractive method per task type
  }
}
```

### 3.3 Extractive Techniques

**TextRank for Summarization:** Graph-based sentence ranking. Output = "cherry-picked transcript sentences." May feel disconnected without surrounding context.

**TF-IDF for Keywords:** Static IDF table shipped with app. Filters stop words, applies stemming.

**Rule-Based FAQ Extraction:**

```typescript
const FAQ_PATTERNS = [
  // Pattern 1: Sentences ending with "?"
  // Pattern 2: Sentences starting with question words (what, how, why, when, where, who)
];
// Next 1-3 sentences after a question = the "answer"
// Deduplicate similar questions via cosine similarity > 0.8
```

**Action Item Extraction:**

```typescript
const ACTION_PATTERNS = [
  /\b(need to|must|should|have to|going to|will|shall)\s+\w+/i,
  /\b(action item|todo|follow up|next step)s?:?\s*/i,
  /\b(assigned to|responsible for|owner|deadline)\s*/i,
  /\b(let's|we should|we need to|I will|I'll)\s+\w+/i,
  /\b(by (monday|tuesday|wednesday|thursday|friday|tomorrow|next week))\s*/i
];
```

**Decision Extraction:**

```typescript
const DECISION_PATTERNS = [
  /\b(decided|agreed|conclusion|resolved|approved)\b/i,
  /\b(we'll go with|let's go with|the plan is|moving forward with)\b/i,
  /\b(confirmed|locked in|signed off|green light)\b/i
];
```

### 3.4 LocalModelProvider (Stage 2)

Available when user has Ollama or llama.cpp running locally.

```typescript
class LocalModelProvider implements TextIntelligenceProvider {
  readonly name = 'local-model-v1';
  readonly stage = 'local-model';
  // endpoint: 'http://localhost:11434/api/generate'
  // model: 'mistral:7b-instruct'
  // maxInputLength: 32000 (model context window)
  // supportsStreaming: true
  // requiresNetwork: true (localhost)
  // qualityLevel: 'near-human'
}
```

### 3.5 CloudLLMProvider (Stage 3)

Available when budget exists or user provides API key.

```typescript
class CloudLLMProvider implements TextIntelligenceProvider {
  readonly name = 'cloud-llm-v1';
  readonly stage = 'cloud-llm';
  // providers: 'openai' | 'anthropic' | 'groq'
  // maxInputLength: 128000 (GPT-4 Turbo)
  // supportsStreaming: true
  // qualityLevel: 'human-level'
}
```

### 3.6 Provider Selection

```typescript
function selectProvider(available: TextIntelligenceProvider[], task: ContentTask): TextIntelligenceProvider {
  // Priority: highest quality available that supports the task
  // Fallback: always ExtractiveProvider (always available, always client-side)
  return available
    .filter(p => p.capabilities().supportedTasks.includes(task))
    .sort((a, b) => qualityRank(b) - qualityRank(a))[0] || new ExtractiveProvider();
}
```

---

## 4. Template System Design

### 4.1 Template Architecture

```typescript
interface ContentTemplate {
  readonly type: ContentType;
  readonly constraints: { minWordCount: number; maxWordCount: number; requiredSections: string[]; optionalSections: string[] };
  apply(intelligence: IntelligenceResult, analysis: AnalysisResult): TemplatedContent;
  estimateQuality(analysis: AnalysisResult): QualityEstimate;
}
```

### 4.2 Blog Article Template

**Stage 1 output:** Restructured transcript with auto-generated headings. Reads like organized notes.

- **Title:** Top 2-3 TF-IDF keywords combined (keyword-based, not a crafted headline)
- **Introduction:** Top 2 TextRank sentences
- **Body:** Each detected topic becomes a section; heading from topic keywords, body from top sentences in that topic (restored to original order)
- **Key Takeaways:** Top 5 sentences overall as bullet points
- **Conclusion:** Last topic's highest-ranked sentence

### 4.3 Summary Templates

- **Short (3-5 sentences):** Top TextRank sentences restored to original order
- **Detailed (30%):** Top 30% of sentences by TextRank, grouped by topic
- **Executive:** Overview (top 3 sentences) + Key Decisions + Action Items + Next Steps

### 4.4 FAQ Template

- Question detection via "?" ending + question-word starts
- Next 1-3 sentences as answer (min 20 words)
- Deduplicated, sorted by confidence score
- Output: Q&A pairs with confidence indicators

### 4.5 Social Media Templates

**LinkedIn:**
- Hook: highest-scored sentence (10-30 words, no filler words, contains keyword)
- Body: 3-4 key points as short bullets
- Hashtags: top 5 TF-IDF keywords as #hashtags
- Constraint: max 3000 characters

**Twitter/X:**
- Find sentences already under 280 characters
- Rank by TextRank score, filter filler-word starts
- Format as numbered thread (max 10 tweets)

**Instagram:**
- Key quote extraction (short, impactful sentences)
- Hashtag generation from keywords (up to 30)
- Caption-length constraint

### 4.6 Notes Templates

**Meeting Notes:** Attendees + Agenda Topics + Key Points + Action Items + Decisions + Next Steps

**Study Notes:** Topic Overview + Key Concepts (TF-IDF terms with context) + Definitions ("X is..." pattern) + Examples ("for example..." pattern) + Summary

**Quick Notes:** Top keywords + one sentence per topic

---

## 5. SEO Content Strategy

### 5.1 SEO at Stage 1: Honest Assessment

True SEO requires understanding search intent and competitor content. At Stage 1, we provide **keyword-aware structuring** -- not full SEO optimization.

### 5.2 What Stage 1 Can Do

| SEO Element | Technique | Quality |
|-------------|-----------|---------|
| Title tag | Top TF-IDF keyword + content type modifier | Basic |
| H1/H2 structure | Topic detection headings with keywords | Good |
| Keyword density | TF-IDF frequency analysis (target 1-3%) | Good |
| Meta description | Top TextRank sentence under 160 chars | Medium |
| Readability score | Flesch-Kincaid calculation | Good |
| Content length check | Compare to type-specific target range | Good |

### 5.3 What Stage 1 Cannot Do

| SEO Element | Available At |
|-------------|-------------|
| Search intent matching | Stage 2+ (requires semantic understanding) |
| Competitor gap analysis | Stage 3 (requires crawling) |
| LSI keyword suggestions | Stage 2+ (requires embeddings) |
| Content brief generation | Stage 2+ (requires generative AI) |
| SERP feature optimization | Stage 3 (requires SERP API) |

### 5.4 SEO Scoring

```typescript
interface SEOScore {
  overall: number;  // 0-100
  breakdown: {
    titleOptimization: number;   // Keyword in title? 50-60 chars?
    headingStructure: number;    // H1 present? H2s with keywords?
    keywordDensity: number;      // 1-3% primary keyword?
    contentLength: number;       // Meets type minimum?
    readability: number;         // Flesch-Kincaid grade 6-8?
    metaDescription: number;     // Under 160 chars? Has keyword?
  };
  suggestions: SEOSuggestion[];
}
```

---

## 6. Validation System

### 6.1 Validation Rules

| Rule | Applies To | Check | Threshold |
|------|-----------|-------|-----------|
| MIN_LENGTH | All | Word count >= minimum | Varies by type |
| MAX_LENGTH | All | Word count <= maximum | Varies by type |
| NO_EMPTY_SECTIONS | All | Every section has content | > 0 words |
| READABILITY | Blog, Article | Flesch-Kincaid grade | <= 10 |
| KEYWORD_PRESENT | Blog, SEO | Primary keyword in title + body | >= 1 |
| NO_FILLER_START | Social media | No "um", "so", "like" openers | 0 fillers |
| CHAR_LIMIT | Twitter | Each tweet <= 280 chars | Hard limit |
| SPEAKER_ATTRIBUTION | Interview, Meeting | Speaker names present | >= 1 |
| COHERENCE | Blog, Article | Adjacent sentence similarity | Cosine > 0.05 |
| DUPLICATE_DETECTION | All | No repeated sentences | 0 duplicates |

### 6.2 Quality Scoring Formula

```typescript
function calculateQualityScore(content: TemplatedContent, analysis: AnalysisResult): number {
  const weights = { coherence: 0.25, coverage: 0.25, readability: 0.20, completeness: 0.15, formatting: 0.15 };
  // coherence: how well sections connect (adjacent sentence similarity)
  // coverage: % of transcript topics represented
  // readability: Flesch-Kincaid normalized
  // completeness: all required sections filled
  // formatting: matches template constraints
  return weightedSum(scores, weights) * 100;  // 0-100
}
```

### 6.3 Quality Display

```
+----------------------------------------------------------+
|  Quality Score: 72/100  [====|=====|==   ]               |
|  Coherence:    @@@@@@@@..  80%                           |
|  Coverage:     @@@@@@....  60%  (4/7 topics)             |
|  Readability:  @@@@@@@@@.  90%  (grade 7)               |
|  Completeness: @@@@@@@...  70%  (missing conclusion)     |
|  Formatting:   @@@@@@....  60%  (paragraphs too long)    |
|  Suggestions:                                            |
|  - Add concluding paragraph (+15% completeness)          |
|  - Break paragraph in section 2 (+10% formatting)        |
|  - 3 transcript topics not covered (+20% coverage)       |
+----------------------------------------------------------+
```

---

## 7. Integration Strategy

### 7.1 Module Dependencies

```
Speech Engine (upstream) --> StandardTranscript --> Content Studio (this) --> ContentResult --> Export Center (downstream)
```

### 7.2 Integration with Speech Engine

```typescript
interface ContentStudioInput {
  transcript: StandardTranscript;
  userPreferences: ContentPreferences;
  selectedContentTypes: ContentType[];
}
```

The Content Studio NEVER accesses raw audio. It only consumes the `StandardTranscript` schema.

### 7.3 Integration with Transcript Studio

- `segment.text !== segment.text_original`: user edited, use `segment.text`
- `segment.text === segment.text_original`: unedited, use `segment.text_original`

User corrections flow into content generation automatically.

### 7.4 Integration with Export Center

```typescript
interface ContentResult {
  id: string;
  contentType: ContentType;
  title: string;
  sections: ContentSection[];
  rawMarkdown: string;
  metadata: { generatedAt: number; provider: string; executionTime: number; qualityScore: number };
  exportFormats: ('markdown' | 'html' | 'pdf' | 'docx' | 'txt' | 'json')[];
}
```

### 7.5 Event Bus

```typescript
// Listens for:
EventBus.on('transcript:ready', (t) => contentStore.setTranscript(t));
EventBus.on('transcript:segment-edited', (id) => contentStore.invalidateCache(id));

// Emits:
EventBus.emit('content:generated', { contentType, result });
EventBus.emit('content:exported', { contentType, format });
```

---

## 8. Privacy Workflow

### 8.1 Core Principle

At Stage 1, ZERO transcript data leaves the browser.

### 8.2 Data Flow (Stage 1)

```
User's Browser (100% client-side)
+------------------------------------------------------------------+
|  StandardTranscript --> ExtractiveProvider --> ContentResult        |
|  (in memory)           (JS, no network)      (sessionStorage)      |
|                                               --> Blob export      |
+------------------------------------------------------------------+
        |
        | NOTHING crosses this boundary at Stage 1
        v
   Network / Server
```

### 8.3 Storage Rules

| Data Type | Location | Lifetime | Notes |
|-----------|----------|----------|-------|
| StandardTranscript | RAM (memory) | Session only | Never persisted |
| Generated content | sessionStorage | Tab close | Client-only |
| User preferences | localStorage | Persistent | Not sensitive |
| Export files | Client-side Blob | Until download | Blob URL revoked after |

### 8.4 Privacy by Stage

| Stage | Data Leaves Browser? | Consent Required? |
|-------|---------------------|-------------------|
| 1 (Extractive) | NO | No |
| 2 (Local Model) | To localhost only | Inform user |
| 3 (Cloud LLM) | YES - to API | Explicit consent + modal |

### 8.5 Stage 3 Consent Flow

When cloud APIs are used, show modal explaining: what data is sent (text, not audio), to whom, their retention policy, and that user can cancel to use extractive mode instead.

### 8.6 Content Sanitization (Optional)

Before export, users can enable: remove personal names, phone numbers, emails, addresses, or custom redaction terms.

---

## 9. Performance Strategy

### 9.1 Performance Targets

| Operation | Target | Context |
|-----------|--------|---------|
| TF-IDF extraction | < 500ms | 50,000 word transcript |
| TextRank scoring | < 2s | 1,000 sentences |
| Topic detection | < 1s | 1,000 sentences |
| Full pipeline | < 5s | Typical 30-min transcript |
| Template application | < 100ms | Post-analysis |
| UI render | < 50ms | Component update |
| Export (Markdown) | < 200ms | Blob creation |
| Export (PDF) | < 2s | Client-side generation |

### 9.2 Web Worker Strategy

```typescript
// Main thread: orchestrates pipeline
// Web Worker: runs heavy analysis (TF-IDF + TextRank + topic detection)
// Threshold: use Worker when transcript > 100 segments

worker.postMessage({ type: 'generate', transcript, contentType });
worker.onmessage = (event) => {
  if (event.data.type === 'progress') updateProgressBar(event.data.percent);
  if (event.data.type === 'result') resolve(event.data.result);
  if (event.data.type === 'error') fallbackToMainThread();
};
```

### 9.3 Caching

- Cache key: hash(transcript.id + contentType + provider.name)
- Storage: sessionStorage (privacy-safe, cleared on tab close)
- Max entries: 20, max size: 5MB
- Invalidation: when any source segment is edited

### 9.4 Memory Management

For transcripts > 2 hours (> 500 segments): split into overlapping chunks (10% overlap), process independently, merge results with deduplication.

---

## 10. Future Upgrade Roadmap

### 10.1 Stage Progression

```
Stage 1 (Launch)              Stage 2 (Growth)              Stage 3 (Scale)
-----------------             -----------------             -----------------
Extractive only               + Local models                + Cloud LLMs
TF-IDF + TextRank             + Ollama/llama.cpp            + OpenAI/Anthropic
100% client-side              + localhost inference          + API generation
Near-zero cost                + Hardware cost only           + Per-token cost
"Restructured content"        + "Rewritten content"         + "Crafted content"
```

### 10.2 Migration Path

**Stage 1 to 2:** Same templates, same UI, same schema. Only the `TextIntelligenceProvider` changes. Content quality jumps from "extractive" to "near-human." Processing time increases (5-30s) but quality justifies it.

**Stage 2 to 3:** Privacy consent required. Token tracking added. Rate limiting enabled. Quality reaches "human-level."

### 10.3 Feature Comparison by Stage

| Feature | Stage 1 | Stage 2 | Stage 3 |
|---------|---------|---------|---------|
| Blog generation | Restructured transcript | Rewritten with flow | Polished, SEO-optimized |
| Social posts | Best quotes extracted | Crafted hooks + CTAs | Platform-optimized variants |
| Summaries | Top sentences (extractive) | Abstractive summaries | Executive briefs with insights |
| FAQ | Question-pattern detection | Generated Q&A | Comprehensive with follow-ups |
| Translation | None | Basic (local model) | Professional quality |
| Tone adjustment | None | Basic formal/casual | Full tone control |

### 10.4 Technical Debt

| Debt Item | Stage Introduced | Resolution | Impact |
|-----------|-----------------|------------|--------|
| Static IDF table (limited vocab) | 1 | Stage 2 (model keywords) | Low |
| Rule-based FAQ (misses implicit) | 1 | Stage 2 (model detection) | Medium |
| No abstractive summarization | 1 | Stage 2 (local model) | High |
| Keyword-based topic titles | 1 | Stage 2 (model titles) | Low |
| No tone control | 1 | Stage 2 (model prompts) | Medium |

---

## 11. Speaker-Aware Content Generation

### 11.1 Speaker Data

```typescript
interface Speaker {
  id: string;
  label: string;           // "Speaker 1" or user-assigned name
  displayName?: string;    // "Dr. Sarah Chen" if labeled
  role?: string;           // "Interviewer", "Guest", "Facilitator"
}
```

### 11.2 Interview Q&A Generation

```typescript
function generateInterviewQA(transcript: StandardTranscript): ContentResult {
  // Identify interviewer: speaker who asks more questions ("?" endings)
  const interviewer = identifyInterviewer(transcript);
  
  // Build Q&A pairs from alternating speaker turns
  const qaPairs: { question: string; answer: string; speaker: Speaker }[] = [];
  let currentQuestion: string | null = null;
  
  for (const segment of transcript.segments) {
    if (segment.speaker_id === interviewer.id) {
      currentQuestion = getSegmentText(segment);
    } else if (currentQuestion) {
      qaPairs.push({ question: currentQuestion, answer: getSegmentText(segment), speaker: findSpeaker(segment.speaker_id) });
      currentQuestion = null;
    }
  }
  return formatAsQAArticle(qaPairs);
}
```

### 11.3 Podcast Quote Extraction

Score segments by "quotability": strong opinion markers ("I believe", "the truth is"), short enough for social (< 280 chars), high TextRank score, contains keywords. Return top 10 with speaker attribution and timestamp.

### 11.4 Meeting Attribution

Action items tagged with `assignedBy` (who said it) and `assignedTo` (detected from "John will..." patterns). Decisions tagged with `proposedBy` and `agreedBy` speakers.

---

## 12. Content Review Interface

### 12.1 Desktop Layout (ASCII)

```
+------------------------------------------------------------------+
|  Content Studio - Blog Article                    [Quality: 72%]  |
+------------------------------------------------------------------+
|                    |                    |                          |
|  SOURCE PANEL     |  OUTPUT PANEL      |  QUALITY PANEL           |
|  (transcript)     |  (generated)       |  (indicators)            |
|                   |                    |                          |
|  [Segment 1]     |  # Title           |  Coherence:    80%       |
|  "Today we're    |                    |  Coverage:     60%       |
|  going to talk   |  ## Introduction   |  Readability:  90%       |
|  about machine   |                    |  Completeness: 70%       |
|  learning..."    |  Today we discuss  |                          |
|                   |  machine learning  |  -- Suggestions --       |
|  [Segment 2]     |  training methods  |  [!] Add conclusion      |
|  "The first      |  and their impact  |  [!] Break long para     |
|  approach is     |  on modern...      |  [i] 3 topics missed     |
|  supervised      |                    |                          |
|  learning..."    |  ## Supervised     |  -- SEO Score --         |
|                   |  Learning          |  Title:       70%        |
|  [Segment 3]     |                    |  Keywords:    85%        |
|  "Another way    |  The supervised    |  Headings:    60%        |
|  is clustering   |  learning approach |  Length:      50%        |
|  ..."            |  involves...       |                          |
+------------------+--------------------+--------------------------+
|  [Highlight Source]  [Edit Output]  [Regenerate]  [Export v]     |
+------------------------------------------------------------------+
```

### 12.2 Interactive Features

| Feature | Behavior |
|---------|----------|
| Source highlighting | Click output sentence to highlight source segment |
| Inline editing | Double-click output to edit directly |
| Section reordering | Drag-and-drop sections in output panel |
| Regenerate section | Right-click to regenerate one section |
| Add from source | Drag source segment into output to include |
| Live quality refresh | Quality indicators update as user edits |

### 12.3 Mobile Layout

Panels stack vertically with `[Source] [Output] [Quality]` tab switcher. Swipe to navigate. Bottom toolbar: `[Export] [Regenerate] [Edit]`.

---

## 13. Squicky Differentiator Workflows

### 13.1 Podcast to Blog Post

**Pipeline:** Audio --> Speech Engine --> Topic detection + TextRank --> BlogArticleTemplate

- Title: top keywords combined
- Introduction: highest-scored opening sentences
- Body: one section per topic with top sentences
- Key Takeaways: top 5 sentences as bullets
- Conclusion: last topic's top sentence

**Honest Stage 1 result:** Reads like "well-organized podcast notes" -- not a polished article. Topic headings are keyword-based ("Machine Learning, Training Data"), not natural ("How Training Data Shapes ML"). Users must rewrite transitions and add narrative flow. Stage 2+ local model fixes this.

### 13.2 Meeting to Report

**Pipeline:** Recording --> Speech Engine (multi-speaker) --> Action/Decision extraction --> MeetingNotesTemplate

- Participants: speaker list
- Agenda Items: detected topics
- Key Points: top sentences per topic, speaker-attributed
- Decisions Made: pattern-matched decision sentences
- Action Items: with assignee + deadline (if detected)

**Honest Stage 1 result:** Works well when speakers use clear language ("I will do X by Friday"). Misses implicit action items and consensus-based decisions.

### 13.3 Interview to Article

**Pipeline:** Interview --> Speech Engine (2 speakers) --> Role detection + Q&A pairing --> ArticleTemplate

- Interviewer identified by question frequency
- Q&A pairs grouped by topic clusters
- Pull quotes: highest-scored short answers
- Output: organized Q&A, NOT a narrative article

**Honest Stage 1 result:** Essentially a cleaned-up Q&A transcript by topic. Does NOT read like a narrative article. Users add connectors, context, and editorial voice.

### 13.4 YouTube Video to SEO Blog

**Pipeline:** Video audio --> Speech Engine --> Full analysis + SEO scoring --> BlogTemplate + SEO enhancement

- SEO Title: primary keyword + modifier ("Guide", "Explained")
- Meta Description: top TextRank sentence under 160 chars
- H2s: topic headings with secondary keywords
- FAQ section from detected questions
- SEO score report alongside content

**Honest Stage 1 result:** SEO STRUCTURE is correct (proper heading hierarchy, keyword placement). But CONTENT is still extractive. Google's helpful content update may rank poorly because it reads unnaturally. Stage 2+ rewriting produces genuinely valuable SEO content.

### 13.5 Audio Notes to Knowledge Base

**Pipeline:** Lecture --> Speech Engine --> Concept + Definition + Example extraction --> StudyNotesTemplate

- Topic Overview: one sentence per topic
- Concepts: TF-IDF domain terms with context sentences
- Definitions: "X is..." and "X means..." pattern matching
- Examples: "for example" and "such as" pattern matching
- Summary: TextRank top sentences

### 13.6 Hinglish Content Workflow

**Challenge:** Hindi-English mixed language in Indian market recordings.

**Stage 1 approach:**
- Combined stop word list (English + Hindi)
- Merged IDF table for TF-IDF
- TextRank works language-agnostically (cosine similarity is math, not language)
- Output preserves original language mix (no translation at Stage 1)

**Honest Stage 1 limitation:** Hinglish output = original mixed-language text reorganized. No translation or normalization possible without generative model. Value is in ORGANIZATION, not language processing.

---

## 14. Multi-Language Content Strategy

### 14.1 Language Support Tiers

| Tier | Languages | Stage 1 Support |
|------|-----------|----------------|
| 1 | English | Full (TF-IDF + TextRank + all templates) |
| 2 | Hindi, Hinglish | Partial (TextRank works; TF-IDF needs Hindi IDF table) |
| 3 | Spanish, French, German | Basic (TextRank works; no IDF tables shipped) |
| 4 | All others | Minimal (TextRank only) |

### 14.2 Language Detection

Trigram-based detection. Ship profiles for English, Hindi, Spanish, French, German. When both English and Hindi trigrams score > 0.3, classify as Hinglish.

### 14.3 Output Language Rule

**Stage 1:** Output language = input language. No translation. If user speaks Hindi, blog is in Hindi. If mixed, output is mixed.

**Stage 2+:** Local model enables cross-language translation.

---

## 15. Mobile Experience

### 15.1 Mobile UI Adaptations

| Desktop Feature | Mobile Adaptation |
|-----------------|------------------|
| Side-by-side panels | Stacked with tab switcher |
| Drag-and-drop | Long-press + swipe |
| Inline editing | Full-screen edit modal |
| Quality panel | Collapsed score badge, expandable |
| Multiple types visible | One at a time, swipeable |
| Context menus | Long-press action sheets |

### 15.2 Mobile Layout

```
+----------------------------------+
|  [<] Content Studio    [72%] [*] |
+----------------------------------+
|  [Blog] [Summary] [FAQ] [Notes]  |
+----------------------------------+
|                                  |
|  # Machine Learning Training     |
|                                  |
|  ## Introduction                 |
|  Today we discuss machine        |
|  learning training methods...    |
|                                  |
|  ## Supervised Learning          |
|  The supervised learning         |
|  approach involves...            |
|                                  |
+----------------------------------+
|  [Source] [Edit] [Export] [More]  |
+----------------------------------+
```

### 15.3 Mobile Performance

| Concern | Strategy |
|---------|----------|
| Limited RAM | Cap transcript at 30 minutes on mobile |
| CPU throttling | Reduce TextRank iterations (20 vs 30) |
| Battery | Show "processing" indicator, avoid background work |
| Storage | Reduce cache to 2MB |
| Touch | Swipe between types, long-press for actions, pull-down to regenerate |

---

## 16. Error Handling

### 16.1 Error Table

| Code | Category | Trigger | User Message | Recovery |
|------|----------|---------|-------------|----------|
| CS-001 | Input | Empty transcript (0 segments) | "No transcript found. Ensure audio is processed." | Link to Speech Engine |
| CS-002 | Input | Too short (< 3 segments) | "Transcript too short for content generation." | Allow with warning |
| CS-003 | Processing | TextRank convergence failure | "Analysis taking longer than expected." | Return partial results |
| CS-004 | Processing | Web Worker crash | "Processing issue. Retrying..." | Fallback to main thread |
| CS-005 | Processing | Out of memory | "Transcript too large for browser." | Suggest chunking |
| CS-006 | Provider | LocalModel connection refused | "Local AI not available. Using basic mode." | Fallback to Extractive |
| CS-007 | Provider | Cloud API error (429/500) | "AI service unavailable. Using basic mode." | Fallback to Extractive |
| CS-008 | Provider | Cloud auth failure (401) | "API key invalid. Update in settings." | Show settings |
| CS-009 | Template | Content below minimum length | "Content shorter than expected." | Show with warning |
| CS-010 | Template | No topics detected | "Could not detect topics." | Use flat template |
| CS-011 | Export | Blob creation failure | "Export failed. Try simpler format." | Offer alternative |
| CS-012 | Export | PDF generation timeout | "PDF timed out. Try Markdown." | Alternative format |
| CS-013 | Cache | sessionStorage quota exceeded | "Storage full. Clearing cache." | Auto-clear oldest |
| CS-014 | Language | Unsupported language | "Language not fully supported." | TextRank-only mode |
| CS-015 | Privacy | User declined cloud consent | "Using local extraction mode." | ExtractiveProvider |

### 16.2 Graceful Degradation Chain

```
CloudLLMProvider (best quality)
    | fails?
    v
LocalModelProvider (good quality)
    | fails?
    v
ExtractiveProvider (baseline) <-- ALWAYS available, NEVER requires network
    | invalid input?
    v
Error State (user message + recovery action)
```

---

## End of Document

**Document Version:** 1.0  
**Last Updated:** Module Design Phase  
**Next Steps:** Implementation begins after approval. First targets: ExtractiveProvider (TextRank + TF-IDF), then BlogArticleTemplate and ShortSummaryTemplate.

---

*This document is part of the Squicky Speech Intelligence Platform architecture series. Read in conjunction with the Master Architecture Document, UI/UX Design System, and Speech Engine Module documents.*
