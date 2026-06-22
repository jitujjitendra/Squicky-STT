# Squicky Speech Intelligence Platform (SSIP)
## Meeting Intelligence Module -- Architecture Document

> **Status:** Module Design Phase -- No code yet.  
> **Author role:** Lead Meeting Intelligence Architect.  
> **Prerequisites:** Master Architecture Document (approved), UI/UX Design System (approved), Speech Engine Module (approved), Content Studio Module (approved).  
> **Purpose:** Complete architectural blueprint for the Meeting Intelligence module -- transforms raw meeting transcripts into structured, actionable intelligence including action items, decisions, risks, and summaries.

---

## Table of Contents

1. [Meeting Intelligence Architecture](#1-meeting-intelligence-architecture)
2. [Meeting Analysis Pipeline](#2-meeting-analysis-pipeline)
3. [Action Item System](#3-action-item-system)
4. [Decision Detection System](#4-decision-detection-system)
5. [Responsibility Detection System](#5-responsibility-detection-system)
6. [Deadline Detection System](#6-deadline-detection-system)
7. [Risk Detection System](#7-risk-detection-system)
8. [Meeting Types & Templates](#8-meeting-types--templates)
9. [Summary Engine](#9-summary-engine)
10. [Speaker Intelligence](#10-speaker-intelligence)
11. [Dashboard Design](#11-dashboard-design)
12. [Analytics Strategy](#12-analytics-strategy)
13. [Integration Strategy](#13-integration-strategy)
14. [ContentIntelligenceCache Integration](#14-contentintelligencecache-integration)
15. [Review & Approval Workflow](#15-review--approval-workflow)
16. [Hinglish/Indian Business Differentiator](#16-hinglishindian-business-differentiator)
17. [Mobile Experience](#17-mobile-experience)
18. [Error Handling](#18-error-handling)
19. [Privacy Workflow](#19-privacy-workflow)
20. [Performance Strategy](#20-performance-strategy)
21. [Future Upgrade Roadmap](#21-future-upgrade-roadmap)

---

## 1. Meeting Intelligence Architecture

### 1.1 Module Role & Responsibility

The Meeting Intelligence module is the **analytical brain** of Squicky for meeting recordings. It sits downstream of the Speech Engine and Content Studio, consuming a `StandardTranscript` and producing structured meeting intelligence that users can review, edit, and export.

**Responsibility chain:**

```
StandardTranscript --> Meeting Context Detection --> Segmentation --> Intelligence Extraction --> Attribution --> Review --> Export
```

This module does NOT:
- Perform transcription (Speech Engine's job)
- Generate creative content (Content Studio's job)
- Handle audio/video processing (Speech Engine's job)
- Store data permanently (Privacy architecture's guarantee)

This module DOES:
- Detect action items with assignees and deadlines
- Detect decisions with participants and confidence
- Detect risks and blockers with severity
- Attribute responsibility to speakers
- Generate meeting summaries at multiple detail levels
- Support Hindi/Hinglish meeting patterns natively

### 1.2 Core Objectives

| # | Objective | Rationale |
|---|-----------|-----------|
| 1 | Extract action items automatically | Meetings produce tasks; users forget them without structure |
| 2 | Detect decisions made | Teams lose track of what was agreed upon |
| 3 | Identify risks and blockers | Proactive risk awareness prevents project failures |
| 4 | Attribute responsibility | Accountability requires clear ownership |
| 5 | Generate summaries at multiple levels | Different audiences need different detail |
| 6 | Support Hindi/Hinglish patterns | Indian business communication is code-mixed |
| 7 | 100% client-side processing | Privacy-first; no meeting content leaves the browser |
| 8 | Human-in-the-loop review | AI suggestions require human confirmation |
| 9 | Integrate with Content Studio cache | Avoid redundant extraction; share pattern libraries |
| 10 | Work within near-zero budget | No paid NLP APIs; extractive methods only at Stage 1 |

### 1.3 Stage 1 Honest Limitations

| Limitation | Why | Stage 2+ Solution |
|------------|-----|-------------------|
| No semantic understanding | Pattern-matching only, not NLU | Local LLM for intent detection |
| No date resolution | "Friday" requires calendar context | Meeting-date anchor + calendar API |
| No cross-meeting tracking | Each meeting is isolated | Persistent local DB (IndexedDB) |
| No speaker diarization guarantee | Depends on Speech Engine | Improved diarization models |
| No real-time processing | Batch only | Streaming pipeline |
| Extractive summaries only | No abstractive generation without LLM | Local LLM summarization |

### 1.4 Architecture Diagram

```
+------------------------------------------------------------------+
|                    MEETING INTELLIGENCE MODULE                     |
+------------------------------------------------------------------+
|  +------------------+    +------------------+    +--------------+ |
|  | Meeting Context  |    | Discussion       |    | Intelligence | |
|  | Detector         |--->| Segmenter        |--->| Extractor    | |
|  +------------------+    +------------------+    +--------------+ |
|         ^                                              |          |
|         |                                              v          |
|  +------------------+    +------------------+    +--------------+ |
|  | StandardTranscript|   | Attribution      |    | Output       | |
|  | (from Speech     |    | Engine           |<---| Generator    | |
|  |  Engine)         |    +------------------+    +--------------+ |
|  +------------------+              |                              |
|                                    v                              |
|                          +--------------------+                   |
|                          | Review & Approval  |                   |
|                          | Interface          |                   |
|                          +--------------------+                   |
|                                    |                              |
|                                    v                              |
|                          +--------------------+                   |
|                          | Dashboard & Export  |                   |
|                          +--------------------+                   |
+------------------------------------------------------------------+
         ^                                               |
         |                                               v
+------------------+                           +------------------+
| Content Studio   |                           | Export Center    |
| (shared patterns |                           | (structured     |
|  + cache)        |                           |  output)        |
+------------------+                           +------------------+
```

---

## 2. Meeting Analysis Pipeline

### 2.1 Six-Stage Pipeline

```
+-------------+    +-----------------+    +--------------------+
| Stage 1     |    | Stage 2         |    | Stage 3            |
| Transcript  |--->| Meeting Context |--->| Discussion         |
| Ingestion   |    | Detection       |    | Segmentation       |
+-------------+    +-----------------+    +--------------------+
                                                    |
                                                    v
+-------------+    +-----------------+    +--------------------+
| Stage 6     |    | Stage 5         |    | Stage 4            |
| Output      |<---| Attribution     |<---| Intelligence       |
| Generation  |    |                 |    | Extraction         |
+-------------+    +-----------------+    +--------------------+
```

### 2.2 Stage 1: Transcript Ingestion

**Input:** `StandardTranscript` from Speech Engine  
**Output:** Normalized meeting data structure

- Validate transcript schema
- Extract metadata (duration, speaker count, language)
- Check ContentIntelligenceCache for existing extractions
- Normalize segments (merge short fragments, split overly long ones)

### 2.3 Stage 2: Meeting Context Detection

Classifies meeting type using heuristics from keywords in first 20% of transcript:

| Signal | Detection Method | Indicates |
|--------|-----------------|-----------|
| Participant count = 2 | Metadata | 1-on-1 or interview |
| "agenda" / "minutes" | Pattern match | Formal meeting |
| "client" / "customer" | Pattern match | Client meeting |
| "sprint" / "standup" / "blocker" | Pattern match | Agile ceremony |
| "revenue" / "pipeline" / "deal" | Pattern match | Sales call |

### 2.4 Stage 3: Discussion Segmentation

Segments transcript into topic clusters using:
- Topic shift detection (keyword clustering)
- Speaker change patterns (new dominant speaker often signals new topic)
- Temporal gaps (silence > 3s suggests topic change)
- Explicit markers ("next item", "moving on", "agle topic pe", "chalo aage badhte hain")

### 2.5 Stage 4: Intelligence Extraction

Runs all detectors in parallel:

```
DiscussionSegments
       |
       +---> ActionItemDetector ----> RawActionItem[]
       +---> DecisionDetector ------> RawDecision[]
       +---> RiskDetector ----------> RawRisk[]
       +---> DeadlineDetector ------> RawDeadline[]
       +---> SummaryExtractor ------> SummarySentences[]
```

### 2.6 Stage 5: Attribution

Resolves WHO is responsible for each extracted item (see Section 5).

### 2.7 Stage 6: Output Generation

Produces the final `MeetingIntelligenceResult`:

```
interface MeetingIntelligenceResult {
  metadata: MeetingMetadata;
  context: MeetingContext;
  summary: MeetingSummary;
  action_items: ActionItem[];
  decisions: Decision[];
  risks: Risk[];
  speaker_stats: SpeakerStats[];
  discussion_segments: DiscussionSegment[];
  generated_at: number;
  pipeline_duration_ms: number;
  stage_1_limitations: string[];
}
```

---

## 3. Action Item System

### 3.1 Pattern Library (Shared with Content Studio)

```
ACTION_PATTERNS = {
  english: [
    /(?:I|we|he|she|they)\s+(?:will|shall|going to|need to|have to|must)\s+(.+)/i,
    /(?:please|kindly)\s+(.+)/i,
    /(?:make sure|ensure)\s+(?:to\s+)?(.+)/i,
    /(?:let'?s|we should|we need to)\s+(.+)/i,
    /(?:action item|todo|task):\s*(.+)/i,
    /(?:can you|could you|would you)\s+(.+)/i,
    /(\w+)\s+(?:will|shall|should|needs? to)\s+(.+)/i,
    /(?:assign(?:ed)?|delegate(?:d)?)\s+(?:to\s+)?(\w+)\s*[:\-]?\s*(.+)/i,
  ],
  hindi: [
    /(\w+)\s+(?:ko|se)\s+(?:bolna|kehna|batana)\s+(.+)/i,
    /(\w+)\s+(?:kar(?:ega|enge|o|na)|karega|karenge)\s+(.+)/i,
    /(\w+)\s+(?:bhej|send|de|le)\s+(?:dega|denge|do|na)\s+(.+)/i,
    /(?:karna hai|karna padega|karna hoga)\s+(.+)/i,
    /(\w+)\s+(?:dekhega|dekhenge|dekh lena)\s+(.+)/i,
    /(?:yaad se|zaroor|pakka)\s+(.+)/i,
  ]
}
```

### 3.2 Action Item Schema

```
interface ActionItem {
  id: string;
  task_text: string;
  assignee: string;
  assignee_type: 'individual' | 'group' | 'unassigned';
  deadline_raw: string | null;
  deadline_resolved: null;        // Stage 1: always null
  priority: 'critical' | 'high' | 'normal' | 'low';
  status: 'open' | 'confirmed' | 'dismissed';
  confidence: number;
  source_text: string;
  source_timestamp: number;
  source_speaker: string;
  discussion_topic: string;
  user_edited: boolean;
}
```

### 3.3 Priority Detection

| Priority | English Triggers | Hindi Triggers |
|----------|-----------------|----------------|
| Critical | "urgent", "ASAP", "immediately", "blocker" | "abhi", "turant", "fauran", "jaldi" |
| High | "important", "priority", "today", "EOD" | "zaroori", "aaj hi", "pehle" |
| Normal | (default) | (default) |
| Low | "when you get a chance", "no rush" | "jab time mile", "koi jaldi nahi" |

### 3.4 Examples

**English:**
```
Input:  "John will send the report tomorrow"
Output: { task: "Send the report", assignee: "John", deadline: "tomorrow", priority: "normal" }
```

**Hindi:**
```
Input:  "Rahul kal tak budget bhej dega"
Output: { task: "Budget bhej dega", assignee: "Rahul", deadline: "kal tak", priority: "normal" }
```

**Ambiguous (low confidence):**
```
Input:  "Maybe someone should look into that"
Output: { task: "Look into that", assignee: "Unassigned", deadline: null, priority: "low", confidence: 0.40 }
```

### 3.5 Deduplication

- Same sentence produces multiple matches: keep highest confidence
- Overlapping task_text (>70% word overlap): merge, keep richer metadata
- Same assignee + similar task within 60s: likely same item, merge

---

## 4. Decision Detection System

### 4.1 Pattern Library (Shared with Content Studio)

```
DECISION_PATTERNS = {
  english: [
    /(?:we(?:'ve)?\s+)?decided\s+(?:to\s+)?(.+)/i,
    /(?:the\s+)?decision\s+is\s+(.+)/i,
    /(?:let'?s\s+)?go\s+with\s+(.+)/i,
    /(?:we(?:'ll)?|let'?s)\s+(?:do|use|pick|choose|go for)\s+(.+)/i,
    /(?:agreed|confirmed|finalized)\s*[:\-]?\s*(.+)/i,
    /(?:so\s+)?(?:we'?re|we are)\s+(?:going with|doing|using)\s+(.+)/i,
    /(?:everyone\s+)?(?:agrees?|on board|aligned)\s+(?:on|with|that)\s+(.+)/i,
    /(?:final|official)\s+(?:answer|decision|call)\s*[:\-]?\s*(.+)/i,
  ],
  hindi: [
    /(?:toh?\s+)?(?:pakka|final|done)\s+(.+)/i,
    /(?:theek hai|thik hai|ok)\s*[,.]?\s*(.+)\s+(?:karte|karenge|karlete)/i,
    /(?:yahi|wahi|isi)\s+(?:karenge|karte hain|pe chalte hain)/i,
    /(?:chalo|chal)\s+(.+)\s+(?:karte|lete|chalte)\s+hain/i,
    /(?:decision|faisla)\s+(?:ho gaya|hua|ye hai)\s*[:\-]?\s*(.+)/i,
    /(?:sab\s+)?(?:agree|raazi|taiyaar)\s+(?:hain|hai|ho)/i,
  ]
}
```

### 4.2 Confidence Scoring

| Level | Score Range | Trigger Type | Example |
|-------|-------------|--------------|---------|
| High | 0.80 - 1.0 | Explicit decision language | "We decided to use React" |
| Medium | 0.50 - 0.79 | Implicit agreement | "Let's go with option B" |
| Low | 0.20 - 0.49 | Inferred (topic change after discussion) | Discussion ends, new topic starts |

**Modifiers:** Multiple speakers agree (+0.15), "final/confirmed" (+0.10), only one speaker (-0.10), hedging ("maybe") (-0.20), question intonation (-0.25).

### 4.3 Decision Schema

```
interface Decision {
  id: string;
  decision_text: string;
  proposed_by: string;
  agreed_by: string[];
  context: string;
  confidence: 'high' | 'medium' | 'low';
  confidence_score: number;
  timestamp: number;
  discussion_topic: string;
  status: 'suggested' | 'confirmed' | 'rejected';
  user_edited: boolean;
}
```

---

## 5. Responsibility Detection System

### 5.1 Resolution Strategy (Priority Order)

| Priority | Method | Example | Resolution |
|----------|--------|---------|------------|
| 1 | Direct name mention | "Rahul will handle it" | Assignee = "Rahul" |
| 2 | Self-assignment (I/main) | "I will send it" | Assignee = current speaker |
| 3 | Second person (you/tum/aap) | "Can you check that?" | Addressee (context-based) |
| 4 | Third person (he/she/wo) | "He will do it" | Attempt context resolution |
| 5 | Role/team mention | "The design team should..." | "Design Team" (group) |
| 6 | No clear owner | "Someone needs to fix this" | "Unassigned" |

### 5.2 Graceful Failure

- If no assignee detected: mark as "Unassigned" (never guess wrong)
- Dashboard highlights unassigned items for manual resolution
- User can assign from participant dropdown
- A wrong assignment is worse than no assignment

### 5.3 Team/Role Patterns

```
TEAM_PATTERNS = [
  { pattern: /design\s*team/i, label: "Design Team" },
  { pattern: /dev(?:elopment)?\s*team/i, label: "Development Team" },
  { pattern: /QA\s*team|testing\s*team/i, label: "QA Team" },
  { pattern: /marketing\s*team/i, label: "Marketing Team" },
  { pattern: /(?:PM|product)\s*team/i, label: "Product Team" },
  { pattern: /management|leadership/i, label: "Leadership" },
]
```

---

## 6. Deadline Detection System

### 6.1 Stage 1 Constraint

We store raw deadline text ONLY. No date resolution because:
- "Friday" requires knowing when the meeting occurred
- Relative dates need a calendar anchor
- Ambiguity resolution is a Stage 2 feature

### 6.2 Detection Patterns

```
DEADLINE_PATTERNS = {
  english: {
    explicit: [
      /by\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
      /before\s+(\w+\s+\d{1,2}(?:st|nd|rd|th)?)/i,
      /deadline\s+(?:is\s+)?(.+?)(?:\.|,|$)/i,
      /due\s+(?:by|on)?\s*(.+?)(?:\.|,|$)/i,
    ],
    relative: [
      /\b(today|tonight|tomorrow)\b/i,
      /\b(next week|this week|end of week|EOW)\b/i,
      /\b(end of day|EOD|COB)\b/i,
      /\b(ASAP|immediately)\b/i,
      /\b(within \d+ (?:days?|hours?|weeks?))\b/i,
    ],
  },
  hindi: {
    explicit: [
      /(somvaar|mangalvaar|budhvaar|guruvaar|shukravaar)\s+tak/i,
    ],
    relative: [
      /\b(aaj|aaj hi|aaj shaam tak)\b/i,
      /\b(kal|kal tak|kal subah)\b/i,
      /\b(parso|parson)\b/i,
      /\b(is hafte|hafte ke end tak)\b/i,
      /\b(agle hafte)\b/i,
      /\b(mahine ke end tak|month end tak)\b/i,
      /\b(jaldi se jaldi)\b/i,
      /\b(do din mein|teen din mein)\b/i,
    ]
  }
}
```

### 6.3 Urgency Classification

| Urgency | English | Hindi | Timeframe |
|---------|---------|-------|-----------|
| Immediate | "ASAP", "right now" | "abhi", "turant", "fauran" | Hours |
| Short | "today", "tomorrow", "EOD" | "aaj", "kal", "aaj shaam tak" | 1-2 days |
| Medium | "this week", "by Friday" | "is hafte", "Friday tak" | 3-7 days |
| Long | "next week", "end of month" | "agle hafte", "month end tak" | 7+ days |
| Unknown | "soon", "when possible" | "jaldi", "jab ho sake" | Indeterminate |

---

## 7. Risk Detection System

### 7.1 Detection Patterns

```
RISK_PATTERNS = {
  english: [
    /\b(risk|risky|at risk)\b/i,
    /\b(concern(?:ed)?|worr(?:ied|y|ying))\b/i,
    /\b(blocker|blocked|blocking)\b/i,
    /\b(issue|problem|bug|defect)\b/i,
    /\b(might fail|could fail|may not work)\b/i,
    /\b(not sure|uncertain|unclear)\b/i,
    /\b(delay(?:ed)?|slipping|behind schedule)\b/i,
    /\b(dependency|dependent on|waiting for)\b/i,
    /\b(bottleneck|constraint|limitation)\b/i,
  ],
  hindi: [
    /\b(dikkat|problem|issue)\b/i,
    /\b(risk hai|risky hai)\b/i,
    /\b(mushkil|mushkil hai)\b/i,
    /\b(nahi ho payega|nahi hoga|possible nahi)\b/i,
    /\b(late ho sakta|delay ho sakta|time lagega)\b/i,
    /\b(ruk gaya|ruka hua|blocked hai)\b/i,
    /\b(tension|chinta|fikar)\b/i,
    /\b(dekhna padega|pata nahi|sure nahi)\b/i,
  ]
}
```

### 7.2 Severity Classification

| Severity | English Triggers | Hindi Triggers |
|----------|-----------------|----------------|
| High | "blocker", "critical", "can't proceed" | "ruk gaya", "bilkul nahi hoga", "critical hai" |
| Medium | "concern", "issue", "might delay" | "dikkat", "problem hai", "late ho sakta" |
| Low | "might", "could be", "not sure" | "dekhna padega", "shayad", "ho sakta hai" |

### 7.3 Risk Schema

```
interface Risk {
  id: string;
  risk_text: string;
  severity: 'high' | 'medium' | 'low';
  category: 'blocker' | 'delay' | 'dependency' | 'technical' | 'resource' | 'general';
  raised_by: string;
  timestamp: number;
  discussion_topic: string;
  related_action_items: string[];
  status: 'suggested' | 'confirmed' | 'mitigated' | 'dismissed';
  mitigation: string | null;
  user_edited: boolean;
}
```

---

## 8. Meeting Types & Templates

### 8.1 Template Registry

| Meeting Type | Detection Keywords | Primary Focus | Extra Patterns |
|-------------|-------------------|---------------|----------------|
| Team Meeting | "team", "standup", "sync", "weekly" | Actions, Decisions | Updates, Progress |
| Client Meeting | "client", "customer", "stakeholder" | Decisions, Commitments | Follow-ups |
| Sales Call | "deal", "pipeline", "prospect", "demo" | Commitments, Objections | Pricing, Next Steps |
| Interview | "candidate", "role", "experience" | Evaluation, Questions | Red Flags, Strengths |
| Project Review | "sprint", "milestone", "status" | Blockers, Progress | Risks, Deadlines |
| Board Meeting | "board", "quarterly", "investors" | Decisions, Strategy | Financials |

### 8.2 Template Schema

```
interface MeetingTemplate {
  type: MeetingType;
  display_name: string;
  detection_keywords: string[];
  primary_extractors: ExtractorType[];
  secondary_extractors: ExtractorType[];
  extra_patterns: PatternSet;
  summary_format: 'quick' | 'standard' | 'executive';
}

type MeetingType = 'team_meeting' | 'client_meeting' | 'sales_call'
  | 'interview' | 'project_review' | 'board_meeting' | 'general';
```

### 8.3 Auto-Detection vs. Manual

- **Auto (default):** Guess from keywords in first 20% of transcript
- **Manual:** User selects from dropdown before/after analysis
- **Fallback:** If confidence < 0.5, use "general" (all extractors equal priority)

---

## 9. Summary Engine

### 9.1 Summary Levels

| Level | Name | Length | Method | Use Case |
|-------|------|--------|--------|----------|
| Quick | 1-Minute Summary | 3-5 sentences | TextRank top sentences | Quick overview |
| Standard | Meeting Summary | 3-5 paragraphs | Top sentences per topic | Documentation |
| Executive | Executive Brief | Structured sections | Decisions + Actions + Risks | Leadership |

### 9.2 Quick Summary (TextRank)

```
function generateQuickSummary(segments: DiscussionSegment[]): string {
  const sentences = extractAllSentences(segments);
  const graph = buildSimilarityGraph(sentences);  // Jaccard word overlap
  const scores = textRank(graph, iterations=20, damping=0.85);
  const topSentences = selectTop(scores, min=3, max=5);
  return topSentences.sort((a, b) => a.timestamp - b.timestamp)
    .map(s => s.text).join(' ');
}
```

### 9.3 Executive Summary Structure

```
## Overview
[Quick summary: 2-3 sentences]

## Key Decisions
- Decision 1 (by Speaker)
- Decision 2 (by Speaker)

## Action Items
- [ ] Task -- @Assignee (deadline)

## Risks & Concerns
- [HIGH] Risk description
- [MED] Risk description
```

### 9.4 Stage 1 Limitations

| Aspect | Can Do | Cannot Do |
|--------|--------|-----------|
| Coverage | Select representative sentences | Generate new synthesis |
| Compression | Top sentences (extractive) | Rephrase for brevity (abstractive) |
| Language | Works in EN and HI separately | Cross-language summary |

---

## 10. Speaker Intelligence

### 10.1 Metrics

| Metric | Calculation | Unit |
|--------|-------------|------|
| Speaking Time | Sum of segment durations per speaker | Seconds / % |
| Segment Count | Number of transcript segments per speaker | Count |
| Participation % | (speaker_time / total_duration) * 100 | Percentage |
| Word Count | Total words spoken per speaker | Count |
| Questions Asked | Sentences ending with "?" per speaker | Count |
| Action Items Assigned | Items where speaker is assignee | Count |
| Decisions Proposed | Decisions attributed to speaker | Count |

### 10.2 No-Diarization Fallback

When speaker diarization is unavailable:
- Speaker section shows: "Speaker detection unavailable"
- All intelligence (actions, decisions, risks) still works
- Attribution falls back to "Unknown Speaker"
- User can manually assign speakers post-analysis

### 10.3 Participation Balance

```
+--------------------------------------------------+
| Speaker Participation                             |
+--------------------------------------------------+
| Priya     ████████████████████░░░░░░░  42%       |
| Rahul     ██████████████░░░░░░░░░░░░░  31%       |
| Amit      ████████░░░░░░░░░░░░░░░░░░░  18%       |
| Sneha     ████░░░░░░░░░░░░░░░░░░░░░░░   9%       |
+--------------------------------------------------+
```

Balance: No speaker > 40% = Balanced. One > 60% = Dominated.

---

## 11. Dashboard Design

### 11.1 Main Dashboard Layout

```
+==============================================================================+
|                    MEETING INTELLIGENCE DASHBOARD                              |
+==============================================================================+
|                                                                                |
|  +--MEETING SUMMARY CARD--------------------------------------------------+  |
|  | Type: Team Meeting (auto-detected)              Duration: 45:23          |  |
|  | Speakers: 4                                     Topics: 6                |  |
|  |                                                                          |  |
|  | Quick Summary:                                                           |  |
|  | "The team discussed Q3 roadmap priorities. Key decisions include         |  |
|  |  switching to React Native for mobile and delaying analytics to Q4.      |  |
|  |  Three blockers were identified..."                                      |  |
|  +--------------------------------------------------------------------------+  |
|                                                                                |
|  +--ACTION ITEMS (5)----+  +--DECISIONS (3)------+  +--RISKS (2)----------+  |
|  | [x] Send budget      |  | * Use React Native |  | [HIGH] API access   |  |
|  |     @Rahul, kal tak  |  |   @Priya, confirmed|  |   blocked           |  |
|  | [ ] Update roadmap   |  | * Delay analytics  |  | [MED] Design team   |  |
|  |     @Amit, this week |  |   @Amit, confirmed |  |   bandwidth         |  |
|  | [ ] Client proposal  |  | * Hire contractor  |  +---------------------+  |
|  |     @Sneha, Friday   |  |   @Priya, pending  |                            |
|  | [ ] Fix login bug    |  +---------------------+                            |
|  |     @Unassigned      |                                                     |
|  | [ ] Schedule review  |                                                     |
|  |     @Priya, next wk  |                                                     |
|  +----------------------+                                                     |
|                                                                                |
|  +--SPEAKER STATS-------------------------------------------------------+    |
|  | Priya: 42% | Rahul: 31% | Amit: 18% | Sneha: 9%                      |    |
|  | ████████████  ████████     █████        ███                            |    |
|  +--------------------------------------------------------------------+    |
|                                                                                |
|  +--MEETING TIMELINE-----------------------------------------------------+    |
|  | 0:00   0:10    0:20    0:30    0:40    0:45                           |    |
|  | |------|-------|-------|-------|-------|                                |    |
|  | [Intro][Roadmap  ][Mobile ][Analytics][Wrap]                           |    |
|  |     ^D      ^A  ^A ^D    ^R  ^A  ^D  ^A                              |    |
|  | D=Decision  A=Action Item  R=Risk                                      |    |
|  +--------------------------------------------------------------------+    |
|                                                                                |
+==============================================================================+
|  [Export PDF]  [Export MD]  [Export JSON]  [Share Summary]                     |
+==============================================================================+
```

### 11.2 Dashboard Components

| Component | Content | Interactions |
|-----------|---------|-------------|
| Summary Card | Type, duration, speakers, quick summary | Expand for full |
| Action Items | List with assignee, deadline, priority | Checkbox, edit, delete |
| Decisions | List with proposer, status | Confirm/reject, edit |
| Risks | Severity-colored list | Confirm, add mitigation |
| Speaker Stats | Participation bars | Click for detail |
| Timeline | Visual markers for extracted items | Click to jump to source |
| Export Bar | Format buttons | One-click export |

### 11.3 Item Detail View

```
+------------------------------------------------------------------+
| ACTION ITEM DETAIL                                          [x]   |
+------------------------------------------------------------------+
|  Task:     [Send the quarterly budget report        ] [Edit]      |
|  Assignee: [Rahul v]                                              |
|  Deadline: [kal tak] (raw)  |  Resolved: -- (Stage 1)            |
|  Priority: [Normal v]                                             |
|  Status:   ( ) Suggested  (*) Confirmed  ( ) Dismissed            |
|                                                                    |
|  Source: "Rahul kal tak budget bhej dega" at 12:34                |
|  Confidence: 0.80 [========--]                                    |
|                                                                    |
|  [Confirm]  [Edit]  [Dismiss]  [Jump to Source]                   |
+------------------------------------------------------------------+
```

---

## 12. Analytics Strategy

### 12.1 Per-Meeting Metrics

| Metric | What it shows |
|--------|---------------|
| Total Action Items | Meeting productivity |
| Assigned vs Unassigned | Accountability health |
| Decision Count | Meeting effectiveness |
| Risk Count (by severity) | Risk awareness |
| Discussion Coverage | % of transcript producing intelligence |
| Average Confidence | Extraction quality |
| Pipeline Duration (ms) | Performance |

### 12.2 Quality Tracking

| Metric | Target | Signal |
|--------|--------|--------|
| False positive rate | < 30% dismissed | Items user rejects |
| User edit rate | < 50% edited | Items user modifies |
| Unresolved attribution | < 40% unassigned | Items needing manual assignment |

### 12.3 No Cross-Session at Stage 1

Stage 1 is single-session only. Stage 2 plans: meeting-over-meeting tracking, recurring risk detection, speaker participation trends.

---

## 13. Integration Strategy

### 13.1 Input Contract (from Speech Engine)

```
interface StandardTranscript {
  id: string;
  metadata: { duration_seconds: number; language: string; speaker_count: number; };
  segments: TranscriptSegment[];
}

interface TranscriptSegment {
  id: string;
  start_time: number;
  end_time: number;
  text: string;
  speaker_id: string | null;
  speaker_name: string | null;
  confidence: number;
}
```

### 13.2 Shared Patterns (from Content Studio)

```
import { ACTION_PATTERNS } from '@content-studio/patterns';
import { DECISION_PATTERNS } from '@content-studio/patterns';
import { TOPIC_PATTERNS } from '@content-studio/patterns';
```

Meeting Intelligence adds its own: RISK_PATTERNS, DEADLINE_PATTERNS, MEETING_TYPE_PATTERNS.

### 13.3 Event Bus

```
// Listens to:
'transcript:ready'         -> Start pipeline
'transcript:updated'       -> Re-run analysis
'cache:invalidated'        -> Re-extract

// Emits:
'meeting:analysis:started'
'meeting:analysis:progress'   -> { stage: 1-6 }
'meeting:analysis:completed'  -> MeetingIntelligenceResult
'meeting:analysis:error'      -> PipelineError
'meeting:item:confirmed'
'meeting:item:dismissed'
'meeting:item:edited'
```

---

## 14. ContentIntelligenceCache Integration

### 14.1 Cache-First Strategy

```
async function runMeetingAnalysis(transcript: StandardTranscript) {
  // 1. CHECK cache first
  const cached = await ContentIntelligenceCache.get(transcript.id);

  if (cached && !cached.isStale()) {
    // 2a. USE cached data directly
    return buildResultFromCache(cached, transcript);
  }

  // 2b. Run full extraction
  const result = await fullExtractionPipeline(transcript);

  // 3. POPULATE cache for other modules
  await ContentIntelligenceCache.set(transcript.id, {
    topics: result.discussion_segments.map(s => s.topic_label),
    action_items: result.action_items,
    decisions: result.decisions,
    extracted_by: 'meeting-intelligence',
    extracted_at: Date.now(),
  });

  return result;
}
```

### 14.2 Staleness Rules

| Condition | Action |
|-----------|--------|
| Transcript unchanged, patterns unchanged | Use cache |
| Transcript re-processed | Re-extract |
| Pattern library updated | Re-extract |
| User edited items | Keep user edits, re-extract unedited |
| Cache age > session lifetime | Discard |

---

## 15. Review & Approval Workflow

### 15.1 Design Philosophy

**Nothing is final without user confirmation.** All extracted intelligence is "suggested" until explicitly confirmed. This protects against false positives, wrong attribution, and misinterpreted context (sarcasm, hypotheticals).

### 15.2 Item States

```
suggested -> confirmed (user confirms)
suggested -> dismissed (user dismisses)
confirmed <-> dismissed (user changes mind)
Any state + edit -> user_edited = true
```

### 15.3 Review Interface

```
+------------------------------------------------------------------+
| REVIEW: Action Items (5 detected)                    [Confirm All]|
+------------------------------------------------------------------+
| 1. [*] Send quarterly budget report                               |
|    @Rahul | kal tak | Normal | Confidence: 0.80                  |
|    [Confirm] [Edit] [Dismiss]                                     |
|    ---                                                             |
| 2. [ ] Update the roadmap document                                |
|    @Amit | this week | Normal | Confidence: 0.75                  |
|    [Confirm] [Edit] [Dismiss]                                     |
|    ---                                                             |
| 3. [?] Look into performance issues                               |
|    @Unassigned | -- | Low | Confidence: 0.40 (LOW)                |
|    [Confirm] [Edit] [Dismiss]                                     |
+------------------------------------------------------------------+
| [*] Confirmed  [ ] Pending  [?] Low confidence                   |
+------------------------------------------------------------------+
```

### 15.4 No Auto-Export Rule

Only confirmed items are exported. If nothing is confirmed, export contains summary only with a warning.

---

## 16. Hinglish/Indian Business Differentiator

### 16.1 Why This Matters

No major meeting intelligence tool handles Hinglish business communication well. Indian professionals mix English (technical terms) with Hindi (informal discussion, agreement) seamlessly.

### 16.2 Indian Business Phrases

| Phrase | Meaning | Detection Category |
|--------|---------|-------------------|
| "Theek hai" / "Thik hai" | Agreement | Decision marker |
| "Chalo" | "Let's proceed" | Decision trigger |
| "Dekhte hain" | "Let's see" (often = no) | Risk/indecision |
| "Pakka" | "Confirmed" | High-confidence decision |
| "Zaroor" | "Definitely" | Commitment/action |
| "Nahi yaar" | Disagreement | Counter-signal |
| "Bilkul" | "Absolutely" | Strong agreement |
| "Bas" | "That's it" | Topic close |

### 16.3 Indian Date/Time References

| Reference | Meaning | Urgency |
|-----------|---------|---------|
| "Kal tak" | By tomorrow | Short |
| "Parso" | Day after tomorrow | Short |
| "Is hafte" | This week | Medium |
| "Agle hafte" | Next week | Medium |
| "Diwali ke baad" | After Diwali (cultural) | Long |
| "Quarter end tak" | By quarter end | Long |
| "Financial year end tak" | By March 31 | Long |
| "Jaldi se jaldi" | ASAP | Immediate |

### 16.4 Code-Mixed Handling Strategy

```
// Run BOTH English and Hindi patterns on every sentence
// De-duplicate across languages
function extractFromCodeMixed(sentence: string): ExtractionResult[] {
  const enResults = applyPatterns(sentence, PATTERNS.english);
  const hiResults = applyPatterns(sentence, PATTERNS.hindi);
  return deduplicateCrossLanguage([...enResults, ...hiResults]);
}
```

### 16.5 Honorific Handling

```
INDIAN_HONORIFICS = ['ji', 'sir', 'ma\'am', 'sahab', 'bhai', 'didi'];
// "Sharma ji will handle this" -> assignee = "Sharma" (strip honorific)
// "Rahul bhai dekh lega" -> assignee = "Rahul"
```

---

## 17. Mobile Experience

### 17.1 Mobile Layout

```
+--------------------------------+
| Meeting Intelligence    [Menu] |
+--------------------------------+
| Team Meeting | 45:23 | 4 ppl  |
+--------------------------------+
| SUMMARY                        |
| "The team discussed Q3..."     |
| [See Full Summary >]           |
+--------------------------------+
| ACTION ITEMS (5)          [>]  |
| +----------------------------+ |
| | Send budget report         | |
| | @Rahul | kal tak          | |
| | [Confirm]  [Dismiss]      | |
| +----------------------------+ |
+--------------------------------+
| DECISIONS (3)             [>]  |
| * Use React Native (confirmed) |
| * Delay analytics (pending)    |
+--------------------------------+
| RISKS (2)                 [>]  |
| [!] API access blocked         |
| [!] Design bandwidth           |
+--------------------------------+
| [====== Export ======]         |
+--------------------------------+
```

### 17.2 Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| < 480px | Single column, stacked cards |
| 480-768px | Single column, wider cards |
| 768-1024px | Two columns |
| > 1024px | Full dashboard (Section 11) |

### 17.3 Touch Interactions

| Gesture | Action |
|---------|--------|
| Tap | Expand detail |
| Swipe right | Confirm item |
| Swipe left | Dismiss item |
| Long press | Edit mode |
| Pull down | Refresh analysis |

---

## 18. Error Handling

### 18.1 Error Scenarios

| # | Scenario | Detection | Response | Recovery |
|---|----------|-----------|----------|----------|
| 1 | Empty transcript | segments.length === 0 | "No content to analyze" | Re-upload |
| 2 | Very short (<30s) | duration < 30 | Warn "Limited content" | Show with caveat |
| 3 | No speaker data | all speaker_id null | Disable speaker stats | Fallback message |
| 4 | Pattern match timeout | extraction > 10s | Kill detector, continue | Mark unavailable |
| 5 | Cache read failure | try/catch | Skip cache, full extract | Log, continue |
| 6 | Web Worker crash | error event | Main thread fallback | Warn about perf |
| 7 | Out of memory | RangeError/OOM | Process in chunks | Reduce chunk size |
| 8 | Invalid schema | Validation fails | "Incompatible format" | Re-process |
| 9 | Language unknown | language undefined | Default English | Run both EN + HI |
| 10 | All extractors fail | all errors | Show transcript only | "Analysis unavailable" |
| 11 | Partial failure | 1-2 detectors fail | Show available results | Hide failed sections |

### 18.2 Graceful Degradation

```
Full Result (all stages complete)
  --> Partial Result (some extractors failed, show available)
    --> Minimal Result (only segmentation, show topics + summary)
      --> Fallback (raw transcript only, analysis unavailable)
```

### 18.3 Error Logging (Client-Side Only)

- Stored in sessionStorage, cleared on session end
- NO transcript text logged (privacy)
- Only metadata: duration, segment count, language, error type
- Optional: user can "report issue" with anonymized error

---

## 19. Privacy Workflow

### 19.1 Data Flow

```
+-------------------+     +-------------------+     +-------------------+
| User's Browser    |     | Web Worker        |     | sessionStorage    |
+-------------------+     +-------------------+     +-------------------+
| Audio upload      |---->| Transcription     |     |                   |
|                   |     | + Analysis        |---->| Extracted items   |
|                   |     +-------------------+     +-------------------+
|                   |<----------- Results displayed in UI -------------|
| [Export]          |---> Downloaded to user's device                   |
+-------------------+

            NOTHING leaves the browser. NOTHING hits a server.
```

### 19.2 Privacy Rules

| Rule | Enforcement |
|------|-------------|
| No server transmission | No fetch/XHR for content data |
| No persistent storage | sessionStorage only (tab close = deletion) |
| No cross-tab leakage | Session-scoped keys |
| User-initiated export only | Explicit button click required |
| No analytics on content | Only metadata in error logs |
| Right to delete | "Clear All" button clears immediately |

### 19.3 Privacy vs. Features

| Feature Blocked by Privacy | Stage 2 Path |
|---------------------------|--------------|
| Cross-meeting tracking | Opt-in IndexedDB |
| Team dashboards | Server + accounts (opt-in) |
| Email notifications | Server (opt-in) |
| Meeting history | Opt-in local persistence |
| Action item follow-up | Opt-in IndexedDB |

---

## 20. Performance Strategy

### 20.1 Targets

| Metric | Target |
|--------|--------|
| Full pipeline (30-min meeting) | < 3 seconds |
| Full pipeline (60-min meeting) | < 6 seconds |
| UI responsiveness during analysis | No frame drops |
| Memory (30-min meeting) | < 100 MB peak |
| Time to first result | < 1 second |

### 20.2 Web Worker Architecture

```
Main Thread (UI)                    Worker Thread (Analysis)
+-------------------+               +-------------------+
| UI Rendering      |               | Pipeline Stages   |
| User Interactions |<--messages--->| 1-6 sequential    |
| Progress Display  |               | Stage 4 parallel  |
+-------------------+               +-------------------+
```

### 20.3 Optimization Strategies

| Strategy | Implementation |
|----------|---------------|
| Parallel extraction | All detectors run via Promise.all in Stage 4 |
| Shared compiled patterns | RegExp objects created once at load, shared |
| Stream processing | Segments processed in chunks |
| Early GC | Null intermediate data after each stage |
| Lazy loading | Meeting-specific patterns loaded on demand |
| Cache-first | Skip extraction if ContentIntelligenceCache has data |

---

## 21. Future Upgrade Roadmap

### 21.1 Stage Progression

```
STAGE 1 (Current)          STAGE 2 (Near Future)       STAGE 3 (Long Term)
+------------------+       +------------------+        +------------------+
| Pattern-based    |       | Local LLM        |        | Cloud LLM        |
| Extractive only  |------>| + Abstractive    |------->| + Real-time      |
| No persistence   |       | + IndexedDB      |        | + Team features  |
| Client-side only |       | + Cross-session  |        | + Integrations   |
+------------------+       +------------------+        +------------------+
```

### 21.2 Stage 2 Features

| Feature | Dependency | Benefit |
|---------|-----------|---------|
| Date resolution | Meeting date input | "Friday" resolves to actual date |
| Abstractive summaries | Local LLM (Phi-2, TinyLlama) | Better summary quality |
| Cross-meeting tracking | IndexedDB (opt-in) | Action item follow-up |
| Sentiment analysis | Local NLP model | Meeting tone detection |
| Calendar integration | Browser extension | Auto-resolve deadlines |
| Smarter attribution | Coreference model | Better pronoun handling |

### 21.3 Stage 3 Features

| Feature | Benefit |
|---------|---------|
| Real-time analysis | Live meeting intelligence |
| Team dashboards | Shared meeting workspace |
| Action item sync (Jira, Notion) | Auto-create tickets |
| Meeting scoring | "How effective was this meeting?" |
| Multi-language support | Beyond EN/HI |
| Voice commands | "Mark that as an action item" |

### 21.4 Migration Guarantees

Each stage upgrade MUST:
- Not break existing functionality
- Be backward-compatible with exports
- Allow opt-out of new features (privacy)
- Work without new dependency (graceful fallback)

---

## Appendix A: Complete Enumerations

```
type MeetingType = 'team_meeting' | 'client_meeting' | 'sales_call'
  | 'interview' | 'project_review' | 'board_meeting' | 'general';
type ItemStatus = 'suggested' | 'confirmed' | 'dismissed';
type Priority = 'critical' | 'high' | 'normal' | 'low';
type Severity = 'high' | 'medium' | 'low';
type Urgency = 'immediate' | 'short' | 'medium' | 'long' | 'unknown';
type AssigneeType = 'individual' | 'group' | 'unassigned';
type RiskCategory = 'blocker' | 'delay' | 'dependency' | 'technical' | 'resource' | 'general';
```

## Appendix B: Glossary

| Term | Definition |
|------|-----------|
| StandardTranscript | Normalized transcript schema from Speech Engine |
| ContentIntelligenceCache | Shared cache between Content Studio and Meeting Intelligence |
| TextRank | Graph-based extractive summarization algorithm |
| Diarization | Speaker identification (who spoke when) |
| Attribution | Assigning responsibility to detected items |
| Code-mixing | Using multiple languages in one conversation |
| Extractive summary | Summary from actual source sentences |
| Hinglish | Hindi-English code-mixed language |

---

*This document is a DESIGN DOCUMENT. No production code exists yet. All interfaces, patterns, and architectures described here are specifications to be implemented in future development phases.*

*Built for the Squicky Speech Intelligence Platform -- where meetings become actionable intelligence, privately and instantly.*
