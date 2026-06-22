# Squicky Speech Intelligence Platform (SSIP)
## Business Studio Module -- Architecture Document

> **Status:** Module Design Phase -- No code yet.  
> **Author role:** Lead Business Intelligence Architect.  
> **Prerequisites:** Master Architecture Document (approved), UI/UX Design System (approved), Speech Engine Module (approved).  
> **Purpose:** Complete architectural blueprint for the Business Studio module -- a domain-specific intelligence layer that transforms business conversations into actionable CRM-ready outputs.

---

## Table of Contents

1. [Business Studio Architecture](#1-business-studio-architecture)
2. [Business Intelligence Pipeline](#2-business-intelligence-pipeline)
3. [Customer Intelligence System](#3-customer-intelligence-system)
4. [Sales Intelligence System](#4-sales-intelligence-system)
5. [Risk & Opportunity System](#5-risk--opportunity-system)
6. [Dashboard Design](#6-dashboard-design)
7. [CRM Output Strategy](#7-crm-output-strategy)
8. [Integration Strategy](#8-integration-strategy)
9. [Privacy Workflow](#9-privacy-workflow)
10. [Future Upgrade Roadmap](#10-future-upgrade-roadmap)
11. [Business Modes & Templates](#11-business-modes--templates)
12. [Follow-Up Intelligence](#12-follow-up-intelligence)
13. [Commitment Detection](#13-commitment-detection)
14. [Support Intelligence](#14-support-intelligence)
15. [Interview Intelligence](#15-interview-intelligence)
16. [Analytics Layer](#16-analytics-layer)
17. [Review Workflow](#17-review-workflow)
18. [Hinglish/Indian Business Differentiator](#18-hinglishindian-business-differentiator)
19. [Mobile Experience](#19-mobile-experience)
20. [Error Handling](#20-error-handling)

---

## 1. Business Studio Architecture

### 1.1 Module Role & Responsibility

Business Studio is a **DOMAIN-SPECIFIC intelligence layer** built on top of shared platform infrastructure. It does NOT duplicate Meeting Intelligence -- it extends it with business-context patterns that transform conversation data into CRM-ready outputs.

```
StandardTranscript --> Shared Intelligence Patterns --> Business-Specific Extractors --> CRM-Ready Output
```

It shares base extraction patterns with Meeting Intelligence (actions, decisions, risks, deadlines) via `@squicky/shared/intelligence-patterns`. It ADDS business-specific patterns: customer objections, buying signals, pain points, opportunities, commitments, and keyword-based sentiment indicators.

### 1.2 Relationship to Meeting Intelligence

| Concern | Meeting Intelligence | Business Studio |
|---------|---------------------|-----------------|
| Actions & Decisions | Extracts and displays | Reuses from shared, adds business context |
| Customer Pain Points | Not applicable | Business-specific extractor |
| Buying Signals | Not applicable | Business-specific extractor |
| Objections | Not applicable | Business-specific extractor |
| CRM Output | Not applicable | Core output format |
| Commitments | Not applicable | External vs internal classification |

### 1.3 Mode-Driven Architecture

The user selects a business mode which determines: active extractors, prioritized output sections, dashboard arrangement, and CRM template format.

### 1.4 ContentIntelligenceCache Interface

Uses the canonical `ContentIntelligenceCache` 9-method interface ONLY. Business-specific logic lives in local derived helpers.

```typescript
interface ContentIntelligenceCache {
  getActions(): CachedAction[];
  getDecisions(): CachedDecision[];
  getRisks(): CachedRisk[];
  getDeadlines(): CachedDeadline[];
  getTopics(): CachedTopic[];
  getSpeakerStats(): CachedSpeakerStats[];
  getSummary(): CachedSummary;
  getKeyPhrases(): CachedKeyPhrase[];
  invalidate(): void;
}

// Local derived helpers (NOT on the cache interface)
function deriveCustomerPainPoints(cache: ContentIntelligenceCache, transcript: StandardTranscript): PainPoint[];
function deriveBuyingSignals(cache: ContentIntelligenceCache, transcript: StandardTranscript): BuyingSignal[];
function deriveObjections(cache: ContentIntelligenceCache, transcript: StandardTranscript): Objection[];
function deriveCommitments(cache: ContentIntelligenceCache, transcript: StandardTranscript): Commitment[];
function deriveOpportunities(cache: ContentIntelligenceCache, transcript: StandardTranscript): Opportunity[];
```

### 1.5 Component Hierarchy

```
BusinessStudioModule/
|-- BusinessModeSelector
|-- BusinessIntelligencePipeline
|   |-- ModeDetector
|   |-- ConversationAnalyzer
|   |-- BusinessInsightExtractor
|   |-- AttributionEngine
|   |-- OutputGenerator
|-- BusinessDashboard
|-- CRMOutputPanel
|-- FollowUpTracker
|-- CommitmentPanel
|-- RiskOpportunityPanel
```

---

## 2. Business Intelligence Pipeline

### 2.1 6-Stage Pipeline

```
Stage 1: Transcript Input --> Stage 2: Mode Detection --> Stage 3: Conversation Analysis -->
Stage 4: Business Insight Extraction --> Stage 5: Attribution --> Stage 6: Output Generation
```

**Stage 1 -- Transcript Input:** Receives `StandardTranscript` from Speech Engine.

**Stage 2 -- Mode Detection:** When no mode is explicitly selected, analyzes first 2 minutes to auto-suggest mode based on keyword frequency matching.

**Stage 3 -- Conversation Analysis:** Identifies speaker roles (host/client/participant), turn patterns, and conversation phases (opening/discovery/presentation/objection/closing).

**Stage 4 -- Business Insight Extraction:** Runs all mode-active extractors against transcript segments. Each extractor operates independently.

**Stage 5 -- Attribution:** Links each insight to a speaker and timestamp.

**Stage 6 -- Output Generation:** Formats into dashboard model and CRM export model.

### 2.2 Performance Requirements

| Metric | Target |
|--------|--------|
| Full pipeline | < 3 seconds |
| Individual stage | < 500ms |
| Memory overhead | < 50MB |

Entire pipeline runs in a **Web Worker** to avoid blocking UI:

```typescript
type WorkerMessage =
  | { type: 'start'; payload: PipelineInput }
  | { type: 'progress'; stage: number; percent: number }
  | { type: 'complete'; payload: BusinessOutput }
  | { type: 'error'; error: string };
```

---

## 3. Customer Intelligence System

All extraction is pattern-based (regex + keyword). Supports English and Hinglish/Hindi.

### 3.1 Pain Point Extraction

**EN patterns:** "problem is", "struggling with", "frustrated", "biggest challenge", "wasting time on", "costing us"

**HI patterns:** "dikkat hai", "problem ho rahi", "pareshan", "mushkil hai", "time waste ho raha", "paisa doob raha"

### 3.2 Requirements Extraction

**EN patterns:** "we need", "looking for", "must have", "essential that", "can't work without"

**HI patterns:** "chahiye", "zaroorat hai", "hona chahiye", "zaroori hai", "bina X nahi chalega"

### 3.3 Expectations Extraction

**EN patterns:** "expecting", "hope", "should be", "anticipate", "by next week/month"

**HI patterns:** "umeed hai", "expect kar rahe", "hona chahiye X tak"

### 3.4 Concerns Extraction

**EN patterns:** "worried about", "risk", "concern is", "not sure if", "afraid that"

**HI patterns:** "chinta hai", "dar hai", "tension hai", "kya hoga agar", "risk hai"

### 3.5 Customer Profile Aggregation

```typescript
interface CustomerProfile {
  sessionId: string;
  customerName: string | null;    // Only if explicitly stated
  companyName: string | null;     // Only if explicitly mentioned
  painPoints: PainPoint[];
  requirements: CustomerRequirement[];
  expectations: CustomerExpectation[];
  concerns: CustomerConcern[];
  overallSentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
}
```

**Limitation:** Customer name extracted ONLY when explicitly stated ("Hi, I'm Rahul from TechCorp"). No inference.

---

## 4. Sales Intelligence System

### 4.1 Objection Extraction

**EN patterns:** "too expensive", "not in budget", "need to think", "not the right time", "need to talk to manager", "already using X", "looking at other options"

**HI patterns:** "mehnga hai", "budget nahi hai", "sochna padega", "abhi nahi", "boss se baat karni padegi", "doosre options dekh rahe"

### 4.2 Buying Signal Extraction

**EN patterns:** "when can we start", "what's the next step", "send proposal", "how soon can", "let me discuss with my team"

**HI patterns:** "kab shuru", "proposal bhejo", "aage kya karna hai", "jaldi chahiye", "team se baat karta hoon"

### 4.3 Interest Level Indicators

**EN patterns:** "interesting", "tell me more", "that's exactly what", "perfect fit"

**HI patterns:** "accha hai", "batao aur", "yahi chahiye tha", "bilkul sahi hai"

### 4.4 Competitor Mention Detection

Patterns: "other vendors", "currently using X", "compared to", "also evaluating", "doosre options", "alternative dekh rahe"

### 4.5 Deal Risk Assessment

**EN patterns:** "delay", "not sure", "push back", "not a priority", "budget freeze", "revisit later"

**HI patterns:** "dekhte hain", "pata nahi", "aage dekh lenge", "abhi nahi", "budget nahi hai", "baad mein baat karte"

### 4.6 Deal Health Calculation

```typescript
function calculateDealHealth(signals: BuyingSignal[], risks: DealRisk[], objections: Objection[]): string {
  const signalScore = signals.filter(s => s.strength === 'strong').length * 3
    + signals.filter(s => s.strength === 'moderate').length * 2
    + signals.filter(s => s.strength === 'weak').length * 1;
  const riskScore = risks.filter(r => r.riskLevel === 'high').length * 3
    + risks.filter(r => r.riskLevel === 'medium').length * 2;
  const objectionPenalty = objections.filter(o => !o.addressed).length * 2;
  const netScore = signalScore - riskScore - objectionPenalty;
  if (netScore >= 5) return 'healthy';
  if (netScore >= 0) return 'at-risk';
  return 'cold';
}
```

---

## 5. Risk & Opportunity System

### 5.1 Shared Risk Reuse

Reuses `RISK_PATTERNS` from `@squicky/shared/intelligence-patterns` (general risks). Adds business-specific: revenue risks ("losing customers", "churn"), competitive risks ("competitor launched"), relationship risks ("client unhappy", "escalation"), operational risks ("can't deliver on time").

**Hinglish:** "client naraz hai", "revenue gir raha", "deliver nahi ho payega", "competition badh gayi"

### 5.2 Opportunity Patterns

**Upsell:** "also need", "upgrade", "additional features", "aur chahiye"
**Expansion:** "expand to", "other teams/departments", "roll out across", "baaki team ko bhi"
**Partnership:** "partnership", "collaborate", "joint venture", "saath mein karte hain"

### 5.3 Severity Classification

| Severity | Criteria | Action |
|----------|----------|--------|
| High | Revenue impact, client escalation, delivery failure | Immediate attention |
| Medium | Competitive pressure, resource strain | Review within 24 hours |
| Low | Minor concerns, potential future issues | Note for tracking |

---

## 6. Dashboard Design

### 6.1 Layout (ASCII)

```
+=========================================================================+
|  BUSINESS STUDIO DASHBOARD                                              |
|  Mode: [Sales Call]  Duration: [32:15]  Participants: [3]               |
+=========================================================================+
|  EXECUTIVE SUMMARY                                                      |
|  Call with [Customer]. Deal Health: [HEALTHY]. Key: [Send proposal]     |
+-------------------------+-----------------------------------------------+
| CUSTOMER INSIGHTS       | SALES SIGNALS                                |
| Pain Points: [3]        | Buying Signals: [2] strong                   |
| Requirements: [2]       | Objections: [1] (addressed)                  |
+-------------------------+-----------------------------------------------+
| ACTIONS & COMMITMENTS   | RISKS & OPPORTUNITIES                        |
| External: Send proposal | Risks: Budget concern [high]                 |
| Internal: Prep deck     | Opportunities: Expansion [high]              |
+-------------------------+-----------------------------------------------+
|  FOLLOW-UPS                                                             |
|  [Sales Rep] will send proposal by [Friday]                             |
|  [Customer] will share requirements by [next week]                      |
+=========================================================================+
|  [Copy CRM Notes]  [Export]  [Review & Edit]                            |
+=========================================================================+
```

### 6.2 Mode-Dependent Visibility

Sections show/hide per mode. Sales Call shows all. Customer Support hides sales signals, shows issue tracking. Internal Discussion hides customer/sales sections. Recruitment shows candidate profile instead.

---

## 7. CRM Output Strategy

### 7.1 Copy-Paste-Ready Format (Salesforce/HubSpot Style)

```
CALL NOTES - [Date] [Time]
===========================
SUMMARY: [2-3 sentence paragraph]

CUSTOMER PROFILE
Name: [Name or "Not identified"]  Company: [Company or "Not identified"]
Pain Points: [list]

DEAL STATUS
Health: [Healthy/At-Risk/Cold]  Signals: [count]  Objections: [count]

NEXT STEPS
[ ] [Who] - [What] - by [When]

COMMITMENTS (External): [list with deadlines]
COMMITMENTS (Internal): [list]

RISKS: [list with severity]
OPPORTUNITIES: [list with potential]

Generated by Squicky Business Studio. All items are suggestions -- please review.
```

### 7.2 Data Model

```typescript
interface CRMExportModel {
  format: 'salesforce' | 'hubspot' | 'generic';
  callDate: string;
  callTime: string;
  duration: string;
  summary: string;
  customerProfile: {
    name: string | null;
    company: string | null;
    role: string | null;
    painPoints: string[];
  };
  dealStatus: {
    health: string;
    buyingSignalCount: number;
    objectionCount: number;
    objectionAddressedCount: number;
  } | null;
  requirements: { mustHave: string[]; niceToHave: string[] };
  followUps: { who: string; what: string; when: string; completed: boolean }[];
  commitments: {
    external: { text: string; deadline: string }[];
    internal: { text: string }[];
  };
  risks: { text: string; severity: string }[];
  opportunities: { text: string; type: string; potential: string }[];
}
```

### 7.3 Implementation

- 100% client-side. Copy to clipboard only. NO direct CRM API integration at Stage 1.
- Plain text format (no rich formatting).
- User selects CRM style (Salesforce/HubSpot/Generic).
- Visual feedback on copy: "Copied! Paste into your CRM." (3s duration).
- Fallback: "Copy failed. Please select and copy manually."

### 7.4 Stage 1 Boundaries

| What we DO | What we do NOT do |
|-----------|-------------------|
| Generate formatted notes | Push to CRM via API |
| Copy to clipboard | Auto-create CRM records |
| Format for SF/HubSpot style | Integrate with CRM OAuth |
| Extract fields from transcript | Guarantee field accuracy |
| Provide editable output | Auto-populate custom fields |

---

## 8. Integration Strategy

### 8.1 Pattern Reuse

```typescript
import { RISK_PATTERNS, ACTION_PATTERNS, DECISION_PATTERNS, DEADLINE_PATTERNS }
  from '@squicky/shared/intelligence-patterns';
// Business Studio ADDS domain-specific patterns only
```

### 8.2 Cache Usage

Consumes `ContentIntelligenceCache` canonical 9-method interface. Does NOT extend it.

### 8.3 ExportPayload

```typescript
interface BusinessExportPayload {
  payload_type: 'business';
  version: '1.0.0';
  mode: BusinessMode;
  data: { dashboard: DashboardModel; crmNotes: CRMExportModel; rawInsights: BusinessInsightExtraction };
}
```

### 8.4 Dependency Map

```
@squicky/shared/intelligence-patterns  (consumed)
@squicky/shared/intelligence-cache     (consumed - 9-method interface)
@squicky/shared/transcript-schema      (consumed)
@squicky/shared/export-registry        (consumed)
@squicky/business-studio/patterns      (owned)
@squicky/business-studio/pipeline      (owned)
@squicky/business-studio/dashboard     (owned)
```

---

## 9. Privacy Workflow

### 9.1 Core Principles

- **100% client-side** processing. No server calls.
- **sessionStorage only.** Data destroyed on tab close.
- **No CRM integration** at Stage 1 (copy-paste only).
- **No telemetry** on business content.
- **No-account operation.** Zero authentication required.

### 9.2 Data Lifecycle

```
Audio --> Speech Engine (client) --> Transcript (sessionStorage) -->
Pipeline (Web Worker) --> Insights (sessionStorage) -->
Dashboard (DOM) --> User Review --> Copy to Clipboard -->
Tab Close --> sessionStorage cleared --> Data gone
```

### 9.3 Never Stored

Raw audio, API keys, CRM credentials, customer PII (beyond what appears in transcript).

---

## 10. Future Upgrade Roadmap

### Stage 2: Enhanced Intelligence
- NLP-based sentiment (ONNX on-device model)
- Entity extraction (client-side NER)
- Historical session comparison (IndexedDB, user opt-in)

### Stage 3: CRM Integration
- Salesforce/HubSpot OAuth push (user-provided credentials, stored locally)
- Custom CRM webhook support

### Stage 4: Advanced Analytics
- Conversation scoring (ML)
- Win/loss pattern analysis
- Automated coaching suggestions

### Non-Goals (Explicitly Out of Scope)
- Voice tone analysis, video body language, auto CRM record creation without review, cross-session customer tracking without opt-in, third-party data enrichment.

---

## 11. Business Modes & Templates

### 11.1 Nine Supported Modes

| # | Mode | Focus | Key Extractors |
|---|------|-------|----------------|
| 1 | Sales Call | Deal progression | Objections, buying signals, deal risk |
| 2 | Customer Support | Issue resolution | Issues, resolutions, escalation |
| 3 | Discovery Call | Qualification | Pain points, requirements, fit |
| 4 | Client Meeting | Relationship | Commitments, actions, expectations |
| 5 | Internal Discussion | Decisions | Actions, decisions, blockers |
| 6 | Project Review | Status | Risks, deadlines, progress |
| 7 | Vendor Discussion | Terms | Requirements, commitments, concerns |
| 8 | Recruitment Interview | Evaluation | Strengths, concerns, skills |
| 9 | General Business | Broad | All extractors at lower priority |

### 11.2 Mode Configuration

```typescript
type BusinessMode = 'sales-call' | 'customer-support' | 'discovery-call' |
  'client-meeting' | 'internal-discussion' | 'project-review' |
  'vendor-discussion' | 'recruitment-interview' | 'general-business';

interface BusinessModeConfig {
  id: BusinessMode;
  label: string;
  activeExtractors: ExtractorId[];
  dashboardSections: DashboardSection[];
  crmTemplate: CRMTemplate;
  autoDetectSignals: string[];
}
```

### 11.3 Auto-Detection Signals

- Sales Call: "pricing", "proposal", "budget", "deal", "contract"
- Customer Support: "issue", "problem", "ticket", "fix", "broken"
- Discovery: "requirements", "needs", "goals", "challenges"
- Client Meeting: "update", "progress", "timeline", "deliverable"
- Internal: "team", "sprint", "backlog", "standup"
- Project Review: "status", "blocker", "risk", "deadline"
- Vendor: "SLA", "contract", "terms", "supplier"
- Recruitment: "experience", "skills", "role", "salary"
- General: fallback (no signals)

---

## 12. Follow-Up Intelligence

### 12.1 Structured Format

```
[Who] will [what] by [when]
```

### 12.2 Extraction Patterns

**EN:** "I'll X by Y", "we will X by Y", "can you X by Y", "please X by Y"

**HI:** "main X kal tak", "hum X kar denge Y tak", "aap X kar dijiye Y tak", "bhej denge Y tak"

### 12.3 Open Questions

Tracks questions asked but not answered: "can you clarify X", "what about X", "is it possible X", "kya X ho sakta"

### 12.4 Output

```
FOLLOW-UPS: [Sales Rep] will send proposal by Friday
OPEN QUESTIONS: "What's the budget range?" (unanswered)
PENDING: 4 follow-ups (3 with deadlines), 2 open questions
```

---

## 13. Commitment Detection

### 13.1 External vs Internal

| Type | Definition | Accountability |
|------|-----------|----------------|
| External | Promise to customer: "We will send by Friday" | HIGH |
| Internal | Team task: "Let's review the deck" | MEDIUM |

### 13.2 External Commitment Patterns

**EN:** "we will send/deliver/provide", "you'll have X by Y", "I'll make sure", "count on us"

**HI:** "hum bhej denge kal tak", "aapko mil jayega", "hum kar denge", "pakka bhej denge"

### 13.3 Internal Action Patterns

**EN:** "let's review/prepare", "we need to internally", "I'll talk to/loop in", "take this offline"

**HI:** "apni team se baat karte hain", "internally discuss karte hain", "team ko bolo"

### 13.4 Classification Logic

```typescript
function classifyCommitment(
  text: string,
  speakerRole: string,
  context: ConversationAnalysis
): 'external' | 'internal' {
  const isHostSpeaker = speakerRole === 'host';
  const hasExternalSignal = EXTERNAL_SIGNALS.some(s => text.match(s));
  const hasInternalSignal = INTERNAL_SIGNALS.some(s => text.match(s));

  if (isHostSpeaker && hasExternalSignal && !hasInternalSignal) return 'external';
  if (hasInternalSignal) return 'internal';
  if (isHostSpeaker && hasExternalSignal) return 'external';
  return 'internal';  // Safe default -- lower accountability
}

const EXTERNAL_SIGNALS = [/you('ll| will) (have|receive|get)/i, /we('ll| will) (send|deliver)/i];
const INTERNAL_SIGNALS = [/let's/i, /internally/i, /our (team|side)/i, /offline/i];
```

Speaker role + pattern context determines type. If host says external-pattern to client = external. If internal signal words present = internal. Default = internal (safe).

---

## 14. Support Intelligence

Activated in Customer Support mode.

### 14.1 Issue Patterns

"not working", "broken", "error when", "can't access/login", "slow loading", "billing issue"

**HI:** "kaam nahi kar raha", "error aa raha", "login nahi ho raha", "bahut slow hai"

### 14.2 Resolution Patterns

"fixed it", "that should resolve", "try this workaround", "let me explain"

**HI:** "theek ho gaya", "ab kaam kar raha", "filhaal ye try karo"

### 14.3 Escalation Patterns

"escalate this", "need to talk to manager", "beyond our scope"

**HI:** "manager se baat karni hai", "upar bhejte hain", "senior ko bolte hain"

### 14.4 Basic Keyword Sentiment

**NOT real NLP.** Keyword spotting only.

- Positive: "thank you", "great", "solved", "shukriya", "ho gaya"
- Negative: "terrible", "worst", "unacceptable", "bakwaas", "bekar"
- Frustrated: "frustrated", "ridiculous", "waste of time", "tang aa gaya"

**Limitation:** Sarcasm ("Oh great, another issue") will be tagged positive. All sentiment outputs labeled "keyword-based indicators."

---

## 15. Interview Intelligence

Activated in Recruitment Interview mode. Simple extractive analysis only.

### 15.1 Candidate Strengths

**Self-stated:** "I'm good at X", "my strength is", "N years experience in", "I led/managed/built"

**Interviewer-noted:** "impressive work", "strong candidate", "that's excellent"

**HI:** "mujhe X mein experience hai", "maine X kiya hai", "N saal ka experience"

### 15.2 Candidate Concerns

**Gaps:** "I haven't/don't have experience in", "not familiar with"

**Hesitation:** "I'm not sure", "I would need to learn"

**HI:** "mujhe X nahi aata", "ye maine nahi kiya", "pata nahi X ke baare mein"

### 15.3 Skill Pattern Matching

Simple keyword detection against configurable skill list. Shows [x] matched / [ ] unmatched.

**Disclaimer:** "Extractive summary based on explicit statements. NOT a candidate score or recommendation."

---

## 16. Analytics Layer

### 16.1 Session Metrics

```typescript
interface SessionAnalytics {
  // Conversation metrics
  totalDuration: number;
  speakerCount: number;
  totalTurns: number;
  averageTurnDuration: number;
  longestMonologue: { speakerId: string; duration: number };

  // Intelligence metrics
  totalInsightsExtracted: number;
  insightsByType: Record<string, number>;
  highPriorityItems: number;
  confidenceDistribution: { high: number; medium: number; low: number };

  // Mode-specific
  modeMetrics: SalesModeAnalytics | SupportModeAnalytics | GeneralAnalytics;
}

interface SalesModeAnalytics {
  dealHealthScore: number;
  buyingSignalDensity: number;
  objectionRate: number;
  objectionAddressedRate: number;
  competitorMentionCount: number;
  conversationBalance: number;
}

interface SupportModeAnalytics {
  issueCount: number;
  resolutionRate: number;
  escalationRate: number;
  customerSentimentArc: { timestamp: number; sentiment: string }[];
}
```

### 16.2 Conversation Quality Indicators

- Host talk ratio vs ideal for mode (e.g., 30-40% for discovery = listen more)
- Questions asked per minute
- Back-and-forth exchange rate

### 16.3 Display

Collapsible analytics panel below main dashboard showing session-level metrics only. No cross-session analytics at Stage 1.

---

## 17. Review Workflow

### 17.1 Human-in-the-Loop Philosophy

All outputs are suggestions requiring human review. Pattern matching produces false positives.

### 17.2 Review UI

- Green check: high confidence, likely correct
- Yellow dot: medium confidence, review recommended
- Red flag: low confidence or high impact, review required

### 17.3 Actions

For each item: Accept / Reject / Edit / Skip. Accepted items go to CRM output. Rejected items excluded. Unreviewed items included with disclaimer.

### 17.4 Priority Queue

Critical (low confidence + high impact items like commitments), Standard (medium confidence), Informational (high confidence).

---

## 18. Hinglish/Indian Business Differentiator

### 18.1 Indian Business Phrases

```typescript
const INDIAN_BUSINESS_PHRASES = {
  'deal pakka': { signal: 'buying-signal', strength: 'strong' },
  'payment pending hai': { signal: 'risk', severity: 'medium' },
  'client happy hai': { signal: 'positive' },
  'client naraz hai': { signal: 'risk', severity: 'high' },
  'kal tak ho jayega': { signal: 'commitment', deadline: 'tomorrow' },
  'dekhte hain': { signal: 'deal-risk', severity: 'medium' },  // Soft rejection
  'urgent hai': { signal: 'priority', severity: 'high' },
  'invoice bhejo': { signal: 'buying-signal', strength: 'strong' },
  'paisa aaya nahi': { signal: 'risk', severity: 'high' },
};
```

### 18.2 Cultural Context Handling

| Phrase | Cultural Meaning | Classification |
|--------|-----------------|----------------|
| "Dekhte hain" | Often soft rejection/delay | Deal risk (not neutral) |
| "Zaroor" | Social politeness, not always genuine | Medium confidence only |
| "Haan haan" | Conversational filler | NOT treated as agreement |
| "Pakka" | Genuine confirmation | Strong signal |
| "Theek hai" | Can mean agreement OR passive acceptance | Neutral unless with action |

### 18.3 Code-Switching Support

Handles mixed EN/HI naturally. Indian business conversations often use English for technical terms and Hindi for structure. Both are parsed simultaneously.

### 18.4 Hinglish CRM Output

Includes transliterated context for Hinglish extractions:

```
Pain Point: "Humara system bahut slow hai" (Our system is very slow)
Buying Signal: "Proposal bhejo" (Send proposal) -- Strength: Strong
```

---

## 19. Mobile Experience

### 19.1 Responsive Design

- Mobile (< 768px): single-column stack, accordion sections
- Tablet (768-1024px): two-column partial layout
- Desktop (> 1024px): full dashboard layout

### 19.2 Mobile Priority Stack

1. Executive Summary (always visible)
2. Follow-Ups & Commitments
3. Key Insights
4. Actions & Decisions
5. Risks & Opportunities
6. Analytics (collapsed)

### 19.3 Mobile Interactions

- Tap: expand item detail
- Swipe left: mark reviewed
- Swipe right: dismiss
- Primary CTA: "Copy Notes" button always accessible

### 19.4 Offline Capability

Works completely offline after initial load (all processing client-side).

---

## 20. Error Handling

### 20.1 Graceful Degradation

Errors in one extractor do NOT crash the pipeline. Each extractor runs in isolation.

### 20.2 Recovery Strategy

| Stage Failure | Recovery |
|---------------|----------|
| Mode Detection fails | Default to General Business |
| Speaker detection fails | Show without attribution |
| Single extractor fails | Skip it, continue with others |
| Attribution fails | Show insights without speaker |
| Output formatting fails | Fall back to raw display |

### 20.3 Performance Guards

```typescript
interface PerformanceGuards {
  pipelineTimeout: 10000;        // Show partial results
  extractorTimeout: 2000;        // Skip individual extractor
  workerTimeout: 15000;          // Restart Web Worker
  maxSegments: 5000;             // Safety cap on input size
  maxMatchesPerExtractor: 500;   // Prevent runaway regex
}
```

### 20.4 Extractor Isolation Pattern

```typescript
async function runExtractorsIsolated(
  input: PipelineInput,
  mode: BusinessMode
): Promise<{ results: BusinessInsightExtraction; errors: ExtractorError[] }> {
  const errors: ExtractorError[] = [];
  const results: Partial<BusinessInsightExtraction> = {};
  const extractors = getExtractorsForMode(mode);

  for (const extractor of extractors) {
    try {
      results[extractor.outputKey] = await withTimeout(
        extractor.run(input),
        2000  // Per-extractor timeout
      );
    } catch (e) {
      errors.push({
        type: 'extractor',
        extractorId: extractor.id,
        message: e.message,
        recoverable: true,
        timestamp: Date.now()
      });
      results[extractor.outputKey] = [];  // Empty array fallback
    }
  }
  return { results: results as BusinessInsightExtraction, errors };
}
```

### 20.4 User Messages

Non-technical, actionable: "Could not auto-detect conversation type. Using General Business mode." Never expose raw errors.

---

## 21. Stage 1 Honest Limitations

### What Business Studio IS

- Pattern matching system finding explicit business signals in text
- Formatting tool structuring signals into CRM-ready output
- Productivity aid saving manual note-taking time
- Suggestion engine requiring human review

### What Business Studio is NOT

- NOT AI that understands conversations
- NOT a prediction engine for deal outcomes
- NOT sentiment analysis (keyword matching only)
- NOT a replacement for human judgment

### Specific Limitations

| Claim | Reality |
|-------|---------|
| "Intent detection" | Pattern matching (misses implicit signals) |
| "Sentiment analysis" | Keyword-based (NOT real NLP, misses sarcasm) |
| "Opportunity detection" | Explicit mentions only |
| "Customer name extraction" | Only when explicitly stated |
| "Deal health scoring" | Weighted keyword count, not predictive |
| "Commitment detection" | Cannot distinguish genuine from polite |

### UI Transparency Requirements

Every output MUST include: confidence indicator, source text link, "Suggestions" label, review prompt, and export disclaimer.

---

---

## 22. Implementation Priority & Dependencies

### 22.1 Implementation Order

| Priority | Component | Depends On |
|----------|-----------|-----------|
| P0 | Pattern definition files (EN + HI) | None |
| P0 | Pipeline executor with error isolation | Pattern files |
| P0 | Web Worker wrapper | Pipeline executor |
| P1 | Mode selector UI component | None |
| P1 | Core extractors (pain points, objections, signals) | Pattern files |
| P1 | Dashboard component (responsive) | Extractors |
| P2 | CRM output panel + clipboard | Dashboard |
| P2 | Commitment classifier | Core extractors |
| P2 | Follow-up tracker | Core extractors |
| P3 | Support/Interview extractors | Pattern files |
| P3 | Review workflow UI | Dashboard |
| P3 | Analytics panel | All extractors |
| P4 | Mobile layout optimizations | Dashboard |
| P4 | Indian business phrase dictionary | Pattern files |

### 22.2 Testing Strategy

| Layer | Scope | Tool |
|-------|-------|------|
| Unit | Individual pattern matching | Vitest |
| Unit | Each extractor (EN + HI) | Vitest |
| Integration | Full pipeline (6 stages) | Vitest |
| Performance | Pipeline < 3s benchmark | Custom harness |
| Visual | Dashboard responsive layout | Storybook |
| E2E | Full flow: upload to CRM copy | Playwright |

### 22.3 Definition of Done

- [ ] All 9 modes selectable and configurable
- [ ] All extractors passing unit tests (EN + HI patterns)
- [ ] Pipeline completes in < 3 seconds for 30-minute transcript
- [ ] Dashboard renders correctly on mobile/tablet/desktop
- [ ] CRM copy produces valid, complete notes
- [ ] Review workflow allows accept/reject/edit
- [ ] Error isolation verified (one extractor failure does not crash pipeline)
- [ ] Zero data leaves the browser (verified via network tab)

---

> **End of Business Studio Module Architecture Document**
>
> All outputs from this module are SUGGESTIONS based on pattern matching. They require human review before being acted upon. This is not AI -- it is structured extraction with known limitations, and that honesty is a feature, not a bug.
