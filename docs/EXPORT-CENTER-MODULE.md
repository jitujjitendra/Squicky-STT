# Squicky Speech Intelligence Platform (SSIP)

## Export Center Module — Architecture Document

> **Status:** Module Design Phase — No code yet.
> **Author role:** Lead Product Architect / Chief Document and Export Systems Architect.
> **Prerequisites:** Master Architecture (approved), UI/UX Design System (approved), Speech Engine Module (approved), Transcript Studio Module (approved).
> **Purpose:** Complete architectural blueprint for the Export Center module — the final delivery layer that transforms processed content into downloadable formats.

---

## Table of Contents

1. [Export Center Architecture](#1-export-center-architecture)
2. [Export Pipeline Design](#2-export-pipeline-design)
3. [Format Support Strategy](#3-format-support-strategy)
4. [Template System Design](#4-template-system-design)
5. [Preview System Design](#5-preview-system-design)
6. [Privacy Workflow](#6-privacy-workflow)
7. [Performance Strategy](#7-performance-strategy)
8. [Error Handling Strategy](#8-error-handling-strategy)
9. [Accessibility Plan](#9-accessibility-plan)
10. [Future Upgrade Roadmap](#10-future-upgrade-roadmap)

---

## 1. Export Center Architecture

### 1.1 Module Role

The Export Center is the **final delivery layer** of the entire Squicky Speech Intelligence Platform. It sits at the end of every user workflow, transforming structured data from upstream modules into professional, downloadable files.

**Core responsibilities:**

- Receive output from ALL 7 other modules via a standardized input contract
- Transform structured data into professional downloadable files
- Execute all generation client-side (zero server cost at Stage 1)
- Maintain absolute privacy (no storage, no network calls, no persistence)
- Support a wide range of formats to cover every use case
- Deliver fast results (no server round-trips for simple exports)

**Design principles:**

- **Fast:** Simple exports (TXT, MD, SRT) complete in under 100ms with native string operations
- **Flexible:** Many formats, many templates, many customization options
- **Private:** No storage, no server calls, no analytics on export content
- **Resilient:** Always offer a fallback format; never silently lose data

### 1.2 Export Sources — Standardized Input Contract

Every module that sends data to Export Center must provide an `ExportPayload`. This is the single, universal interface between any source module and the Export Center.

```json
{
  "source_module": "transcript-studio" | "subtitle-studio" | "content-studio" | "meeting-intelligence" | "creator-studio" | "business-studio",
  "payload_version": "1.0",
  "payload_type": "transcript" | "subtitles" | "content" | "meeting" | "creator" | "business",
  "data": { "...module-specific content..." },
  "metadata": {
    "title": "Meeting Recording - June 2026",
    "duration_sec": 745,
    "language": "hi+en",
    "speakers": {
      "count": 2,
      "entries": [
        { "id": "spk_001", "label": "Speaker 1", "display_name": "Rahul" },
        { "id": "spk_002", "label": "Speaker 2", "display_name": "Priya" }
      ]
    },
    "created_at": "2026-06-21T14:30:00Z",
    "quality_label": "good"
  },
  "export_options": {
    "include_timestamps": true,
    "include_speakers": true,
    "include_confidence": false,
    "mode": "detailed",
    "template": "standard"
  }
}
```

**Source module data specifications:**

| Source Module | payload_type | data content |
|---|---|---|
| Transcript Studio | `transcript` | Merged StandardTranscript (segments with `text`, `text_original`, `user_edited` flag, `editing_meta`, speakers, `full_text`) |
| Subtitle Studio | `subtitles` | Subtitle cues `[{id, start, end, text, style?}]` |
| Content Studio | `content` | `{type: "summary"\|"blog"\|"faq"\|"social", content: string, format: "markdown"\|"plain"}` |
| Meeting Intelligence | `meeting` | `{summary, action_items[], decisions[], topics[], speakers}` |
| Creator Studio | `creator` | `{chapters[], description, tags[], highlights[]}` |
| Business Studio | `business` | `{call_summary, crm_notes, follow_ups[], key_info}` |

**Transcript Studio data detail (Merged StandardTranscript):**

```json
{
  "segments": [
    {
      "id": "seg-uuid-001",
      "sequence_index": 0,
      "start": 0.0,
      "end": 4.5,
      "text": "Hello everyone, welcome to the meeting.",
      "text_original": "hello everyone welcome to the meeting",
      "user_edited": true,
      "speaker_id": "spk_001",
      "confidence": 0.92,
      "language": "en"
    }
  ],
  "speakers": {
    "count": 2,
    "entries": [
      { "id": "spk_001", "label": "Speaker 1", "display_name": "Rahul" },
      { "id": "spk_002", "label": "Speaker 2", "display_name": "Priya" }
    ],
    "speaking_time": { "spk_001": 500.2, "spk_002": 244.8 }
  },
  "full_text": "Hello everyone, welcome to the meeting. ...",
  "editing_meta": {
    "edited_at": "2026-06-21T14:35:00Z",
    "segments_modified": 5,
    "segments_split": 0,
    "segments_merged": 0,
    "segments_deleted": 0
  }
}
```

> **Note on text fields:** In the merged output from Transcript Studio, `text` = user's final edited version (authoritative), `text_original` = immutable engine output (for reference/NLP). Export Center uses `text` for all human-facing formats and preserves both in JSON full export.

### 1.3 Architecture Diagram

```
SOURCE MODULES                    EXPORT CENTER                         OUTPUT
+------------------+            +-------------------+                +----------+
| Transcript Studio|---+        | Input Validator   |                | .txt     |
| Subtitle Studio  |   |        | Template Engine   |                | .md      |
| Content Studio   |---+------->| Format Converter  |---[generate]-->| .docx    |
| Meeting Intel    |   |        | Packager          |                | .pdf     |
| Creator Studio   |---+        | Preview Generator |                | .srt/.vtt|
| Business Studio  |            +-------------------+                | .csv/.json|
+------------------+                    |                            | .zip     |
                                        v                            +----------+
                              [Client-side generation]
                              [No server, no storage]
                              [Direct download to user]
```

**Internal component breakdown:**

```
+--------------------------------------------------------------------+
|                       EXPORT CENTER MODULE                          |
+--------------------------------------------------------------------+
|                                                                    |
|  +----------------+    +------------------+    +-----------------+ |
|  | Input Validator|    | Template Engine   |    | Format Registry | |
|  | - Schema check |    | - Template select |    | - Format specs  | |
|  | - Data verify  |--->| - Options apply   |--->| - Availability  | |
|  | - Compat check |    | - Intermediate gen|    | - Validation    | |
|  +----------------+    +------------------+    +-----------------+ |
|                                                        |           |
|                                                        v           |
|  +-----------------+   +------------------+    +-----------------+ |
|  | Preview Engine  |   | Format Converters |    | Packager        | |
|  | - HTML render   |   | - TxtConverter    |    | - Blob create   | |
|  | - Approx layout |   | - DocxConverter   |    | - ZIP bundle    | |
|  | - Warnings show |   | - PdfConverter    |    | - Filename gen  | |
|  +-----------------+   | - SrtConverter    |    +-----------------+ |
|                         | - VttConverter    |            |          |
|                         | - CsvConverter    |            v          |
|                         | - JsonConverter   |    +-----------------+ |
|                         +------------------+    | Delivery Engine  | |
|                                                 | - Object URL     | |
|                                                 | - Download trigger| |
|                                                 | - Memory cleanup | |
|                                                 +-----------------+ |
+--------------------------------------------------------------------+
```

### 1.4 Client-side vs Server-side Decision Matrix

| Format | Generation Method | Library | Size (~) | Reason |
|---|---|---|---|---|
| TXT | Client-side | Native (Blob + `URL.createObjectURL`) | 0 KB | Trivial text concatenation |
| Markdown | Client-side | Native | 0 KB | Text with formatting markers |
| HTML | Client-side | Native | 0 KB | Template string rendering |
| SRT | Client-side | Native | 0 KB | Text with timing format |
| VTT | Client-side | Native | 0 KB | Text with timing format |
| ASS | Client-side | Native | 0 KB | Structured text sections |
| CSV | Client-side | Native or papaparse | 0-45 KB | Row/column text generation |
| JSON | Client-side | Native (`JSON.stringify`) | 0 KB | Direct serialization |
| DOCX | Client-side | docx.js | ~200 KB | XML-based, library handles structure |
| PDF | Client-side | jsPDF + jsPDF-autotable | ~300 KB | Canvas-based rendering |
| ZIP | Client-side | JSZip | ~100 KB | Compression for bundles |

**Total library budget:** ~600 KB (gzipped: ~200 KB). Acceptable for a full export system.

**ALL exports are client-side at Stage 1. Zero server cost. Files never leave the browser.**

Server-side generation is only considered at Stage 3 for:
- Heavy batch processing (100+ files)
- Custom branded PDFs with complex layouts
- Enterprise reporting with charts/graphs

---

## 2. Export Pipeline Design

### 2.1 Six-Step Pipeline

The export pipeline processes every export request through exactly six sequential steps:

```
[1] RECEIVE ExportPayload from source module
        |
        v
[2] VALIDATE
    - Required fields present?
    - Data integrity (segments have text, subtitles have timing)?
    - Format compatibility (SRT only for subtitles, not for meeting notes)?
        |
        v
[3] TEMPLATE APPLICATION
    - Select template (standard, meeting, interview, podcast, business, youtube)
    - Apply export_options (timestamps yes/no, speakers yes/no, mode compact/detailed)
    - Generate intermediate representation (IntermediateDocument)
        |
        v
[4] FORMAT CONVERSION
    - Convert IntermediateDocument to target format
    - TXT: plain text with optional formatting
    - DOCX: paragraphs, headings, tables via docx.js
    - PDF: layout, fonts, styling via jsPDF
    - SRT/VTT/ASS: timing format conversion
    - CSV: tabular row generation
    - JSON: structured serialization
        |
        v
[5] PACKAGING
    - Single format: direct Blob creation
    - Multiple formats: generate all, package into ZIP (JSZip)
    - Set filename: {title}_{format}_{date}.{ext}
        |
        v
[6] DELIVERY
    - Create object URL from Blob (URL.createObjectURL)
    - Trigger download via hidden <a> element with download attribute
    - Revoke object URL after download starts (URL.revokeObjectURL)
    - Show "Download complete" confirmation
    - Garbage collection handles remaining memory
```

### 2.2 Step Details

#### Step 1: Receive

```typescript
interface ExportRequest {
  payload: ExportPayload;
  target_formats: FormatId[];        // ["pdf", "docx"] or ["srt"]
  delivery: "download" | "preview";  // preview first, or direct download
}
```

The Export Center exposes a single entry point: `exportCenter.process(request: ExportRequest)`. Any module can call this with a valid `ExportPayload`.

#### Step 2: Validate

Validation rules applied before any generation begins:

| Check | Failure Behavior |
|---|---|
| `source_module` is known enum value | Reject with "Unknown source module" |
| `payload_type` matches `source_module` | Reject with "Payload type mismatch" |
| `data` is non-null and non-empty | Reject with "No data to export" |
| `metadata.title` exists | Auto-generate from source + timestamp |
| Segments have `text` field (transcript) | Reject with "Segments missing text content" |
| Subtitle cues have `start`, `end`, `text` | Reject with "Invalid subtitle cues" |
| Requested format is compatible with payload | Reject with "Format not available for this content type" |

**Format compatibility validation:**

| Format | Requires |
|---|---|
| SRT, VTT, ASS | `payload_type === "subtitles"` |
| CSV | `payload_type === "meeting"` or `"business"` (tabular data) |
| All others | Any payload type |

#### Step 2.5: Data Preparation (Speaker Resolution + Text Normalization)

After validation passes, data is prepared for template consumption. This step ensures templates receive clean, resolved, ready-to-render data — not raw schema internals.

**Speaker resolution:**
```
For each segment:
  segment.speaker_name = resolve(segment.speaker_id, metadata.speakers.entries)

resolve(speaker_id, entries):
  entry = entries.find(e => e.id === speaker_id)
  return entry.display_name ?? entry.label ?? "Unknown Speaker"
```

**Text field normalization for export:**

| Format | Text field used for export | Rationale |
|--------|---------------------------|-----------|
| TXT, MD, DOCX, PDF, HTML | `segment.text` (user's edited version) | User's corrections are authoritative |
| SRT, VTT, ASS | `segment.text` (user's version) | What user verified = what appears as subtitle |
| JSON (full export) | Both `text` + `text_original` preserved | Developer use; full data for reference/re-import |
| CSV | `segment.text` (user's version) | Tabular export of user-verified content |

**Timestamp formatting:**
- Convert raw seconds (float) to display format based on `export_options.timestamp_format`
- Default: `HH:MM:SS` for audio >1hr, `MM:SS` for shorter

**Output of Step 2.5:** A `PreparedPayload` where:
- All `speaker_id` values resolved to human-readable names
- `text` field is the export-ready text (user's version)
- `text_original` preserved for JSON full export only
- Timestamps are in display format strings
- Confidence flags set (low confidence segments marked)

Templates NEVER need to look up speaker entries or decide which text field to use — that's already done.

#### Step 3: Template Application

The template engine selects the appropriate template based on `export_options.template` and applies formatting rules. Output is always an `IntermediateDocument` (see Section 4 for full template system design).

**Important:** By the time data reaches the template, it has been through the Data Preparation step (Step 2.5) and all speaker IDs are resolved to display names, text fields are normalized, and timestamps are in display format.

#### Step 4: Format Conversion

Each format has a dedicated converter class that reads the `IntermediateDocument` and produces a `Blob`:

```typescript
interface FormatConverter {
  format_id: FormatId;
  mime_type: string;
  extension: string;
  convert(doc: IntermediateDocument): Promise<Blob>;
}
```

#### Step 5: Packaging

```typescript
// Single format
if (target_formats.length === 1) {
  return { blob, filename: generateFilename(metadata, format) };
}

// Multiple formats -> ZIP bundle
const zip = new JSZip();
for (const format of target_formats) {
  const blob = await converters[format].convert(doc);
  zip.file(generateFilename(metadata, format), blob);
}
return { blob: await zip.generateAsync({type: "blob"}), filename: `${title}_export_${date}.zip` };
```

#### Step 6: Delivery

```typescript
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke after short delay to ensure download starts
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
```

### 2.3 Filename Generation

Pattern: `{sanitized_title}_{format}_{YYYYMMDD}.{ext}`

Examples:
- `meeting_recording_june_2026_pdf_20260621.pdf`
- `interview_rahul_docx_20260621.docx`
- `podcast_episode_12_srt_20260621.srt`
- `meeting_recording_june_2026_export_20260621.zip` (bundle)

**Sanitization rules:**
- Lowercase all characters
- Replace spaces with underscores
- Remove special characters except hyphens and underscores
- Truncate to 50 characters (before adding format/date suffix)
- Ensure valid filename on Windows, macOS, and Linux

---

## 3. Format Support Strategy

### 3.1 Priority Tiers

| Tier | Formats | Implementation | Stage | Library Cost |
|---|---|---|---|---|
| P0 (launch) | TXT, MD, SRT, VTT, JSON | Native (no library needed) | Stage 1 | 0 KB |
| P1 (launch) | DOCX, PDF, CSV | Client-side libraries | Stage 1 | ~545 KB |
| P2 (soon after) | ASS, HTML | Native + styling | Stage 1-2 | 0 KB |
| P3 (future) | Custom reports, branded PDFs | Server-side (when budget exists) | Stage 2-3 | N/A |

### 3.2 Format Availability per Source Module

| Source | TXT | MD | DOCX | PDF | SRT | VTT | ASS | CSV | JSON | HTML |
|---|---|---|---|---|---|---|---|---|---|---|
| Transcript Studio | Y | Y | Y | Y | - | - | - | - | Y | Y |
| Subtitle Studio | - | - | - | - | Y | Y | Y | - | Y | - |
| Content Studio | Y | Y | Y | Y | - | - | - | - | Y | Y |
| Meeting Intelligence | Y | Y | Y | Y | - | - | - | Y | Y | Y |
| Creator Studio | Y | Y | Y | - | - | - | - | - | Y | - |
| Business Studio | Y | Y | Y | Y | - | - | - | Y | Y | - |

**Legend:** Y = Available, - = Not applicable/available

### 3.3 Subtitle Format Specifications

#### SRT (SubRip Text)

```
1
00:00:00,000 --> 00:00:04,500
Hello everyone, welcome to the meeting.

2
00:00:04,800 --> 00:00:08,200
Thank you for joining on such short notice.
```

**SRT rules:**
- Sequential numbering starting at 1
- Timing format: `HH:MM:SS,mmm --> HH:MM:SS,mmm` (comma for milliseconds)
- Blank line separates each cue
- Maximum 2 lines per cue
- Maximum 42 characters per line
- No styling support

#### VTT (WebVTT)

```
WEBVTT

1
00:00:00.000 --> 00:00:04.500
Hello everyone, welcome to the meeting.

2
00:00:04.800 --> 00:00:08.200
Thank you for joining on such short notice.
```

**VTT rules:**
- Must start with `WEBVTT` header
- Timing format: `HH:MM:SS.mmm --> HH:MM:SS.mmm` (dot for milliseconds)
- Optional cue settings: `position`, `align`, `size`, `line`
- Supports `::cue` CSS styling
- Supports `<b>`, `<i>`, `<u>` inline tags

#### ASS (Advanced SubStation Alpha)

```
[Script Info]
Title: Meeting Recording
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, ...
Style: Default,Noto Sans,48,&H00FFFFFF,...

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,0:00:04.50,Default,,0,0,0,,Hello everyone, welcome to the meeting.
```

**ASS rules:**
- Three required sections: `[Script Info]`, `[V4+ Styles]`, `[Events]`
- Rich styling: fonts, colors, positioning, effects
- Timing format: `H:MM:SS.cc` (centiseconds)
- Supports karaoke timing, movement effects, drawing commands

### 3.4 Format Validation Rules

| Format | Validation Rule | Auto-fix |
|---|---|---|
| SRT | Cue numbering must be sequential | Re-number automatically |
| SRT | No overlapping timestamps | Trim end of overlapping cue |
| SRT | Line length <= 42 chars | Word-wrap at nearest space |
| SRT | Max 2 lines per cue | Split into additional cues |
| VTT | Must have WEBVTT header | Add header automatically |
| VTT | Timestamps must be ascending | Sort cues by start time |
| ASS | Must have all three sections | Generate missing sections with defaults |
| CSV | Headers must match data columns | Align column count |
| JSON | Must be valid JSON | Always valid (generated by serializer) |
| PDF | Font must support document language | Fall back to Noto Sans (multi-script) |
| DOCX | Heading hierarchy must be valid | Fix level skipping (H1->H3 becomes H1->H2->H3) |

### 3.5 Text Format Specifications

#### TXT Output (Transcript)

```
Meeting Recording - June 2026
Duration: 12:25 | Speakers: 2 | Language: hi+en
Generated: 2026-06-21
================================================

[00:00:00] Speaker 1:
Hello everyone, welcome to the meeting.

[00:00:04] Speaker 2:
Thank you for joining on such short notice.

...

================================================
Total segments: 156 | Word count: 2,340
```

#### Markdown Output (Transcript)

```markdown
# Meeting Recording - June 2026

**Duration:** 12:25 | **Speakers:** 2 | **Language:** hi+en
**Generated:** 2026-06-21

---

## Transcript

**[00:00:00] Speaker 1:**
Hello everyone, welcome to the meeting.

**[00:00:04] Speaker 2:**
Thank you for joining on such short notice.

---

*Total segments: 156 | Word count: 2,340*
```

---

## 4. Template System Design

### 4.1 Template Architecture

Templates are **pure functions** that transform an `ExportPayload` into an `IntermediateDocument`. No template engine library is needed -- just structured TypeScript functions that define layout, section ordering, and formatting rules.

```typescript
type TemplateFunction = (payload: ExportPayload, options: ExportOptions) => IntermediateDocument;

const templates: Record<TemplateId, TemplateFunction> = {
  standard: standardTemplate,
  meeting: meetingTemplate,
  interview: interviewTemplate,
  podcast: podcastTemplate,
  business: businessTemplate,
  youtube: youtubeTemplate,
};
```

### 4.2 Built-in Templates

| Template ID | Use Case | Sections Included |
|---|---|---|
| `standard` | General transcript export | Header (meta), body (segments with timestamps/speakers), footer (stats) |
| `meeting` | Meeting recordings | Header, executive summary, action items table, decisions list, full transcript |
| `interview` | Interview transcripts | Header, Q&A format (speaker alternation highlighted), timestamps |
| `podcast` | Podcast episodes | Show notes header, chapters with timestamps, full transcript |
| `business` | Business/sales calls | Cover summary, key info block, follow-ups list, CRM notes, full transcript |
| `youtube` | Creator content | Description block, chapters (timestamp format), tags, highlights |

### 4.3 IntermediateDocument Model

The intermediate representation is format-agnostic. Each format converter reads this structure and renders it in its own way.

```json
{
  "title": "Meeting Recording - June 2026",
  "subtitle": "Product Roadmap Discussion",
  "metadata_block": {
    "duration": "12:25",
    "date": "2026-06-21",
    "speakers": ["Rahul", "Priya"],
    "language": "hi+en",
    "quality_label": "good",
    "word_count": 2340,
    "segment_count": 156
  },
  "sections": [
    { "type": "heading", "level": 1, "text": "Meeting Recording - June 2026" },
    { "type": "heading", "level": 2, "text": "Summary" },
    { "type": "paragraph", "text": "The team discussed...", "style": "normal" },
    { "type": "heading", "level": 2, "text": "Action Items" },
    { "type": "table", "headers": ["Item", "Owner", "Deadline"], "rows": [["Follow up on budget", "Rahul", "June 28"]] },
    { "type": "heading", "level": 2, "text": "Transcript" },
    { "type": "segment", "timestamp": "00:00:00", "speaker": "Rahul", "text": "Hello everyone...", "confidence_flag": false },
    { "type": "segment", "timestamp": "00:00:04", "speaker": "Priya", "text": "Thank you for...", "confidence_flag": true },
    { "type": "divider" },
    { "type": "footer", "text": "Generated by Squicky | 156 segments | 2,340 words" }
  ]
}
```

**Section type definitions:**

| Type | Fields | Description |
|---|---|---|
| `heading` | `level` (1-3), `text` | Section headers |
| `paragraph` | `text`, `style` (normal/bold/italic) | Body text blocks |
| `table` | `headers[]`, `rows[][]` | Tabular data (action items, decisions) |
| `list` | `items[]`, `ordered` (bool) | Bullet or numbered lists |
| `segment` | `timestamp`, `speaker`, `text`, `confidence_flag` | Transcript segments |
| `divider` | (none) | Horizontal separator |
| `footer` | `text` | Document footer with stats |

### 4.4 Template Rendering Examples

#### Standard Template (Transcript)

```
sections = [
  heading(1, title),
  metadata_block(duration, speakers, language),
  divider(),
  heading(2, "Transcript"),
  ...segments.map(s => segment(s.start, s.speaker, s.text)),
  divider(),
  footer(stats)
]
```

#### Meeting Template

```
sections = [
  heading(1, title),
  metadata_block(duration, speakers, language),
  divider(),
  heading(2, "Executive Summary"),
  paragraph(data.summary),
  heading(2, "Action Items"),
  table(["Item", "Owner", "Deadline"], data.action_items),
  heading(2, "Key Decisions"),
  list(data.decisions, ordered=true),
  heading(2, "Topics Discussed"),
  list(data.topics),
  divider(),
  heading(2, "Full Transcript"),
  ...segments.map(s => segment(s.start, s.speaker, s.text)),
  footer(stats)
]
```

#### Business Template

```
sections = [
  heading(1, "Call Summary: " + title),
  metadata_block(duration, speakers, language),
  divider(),
  heading(2, "Overview"),
  paragraph(data.call_summary),
  heading(2, "Key Information"),
  paragraph(data.key_info),
  heading(2, "Follow-up Actions"),
  list(data.follow_ups, ordered=true),
  heading(2, "CRM Notes"),
  paragraph(data.crm_notes, style="italic"),
  divider(),
  footer(stats)
]
```

### 4.5 Template Selection Logic

```typescript
function selectTemplate(payload: ExportPayload): TemplateId {
  // User explicitly chose a template
  if (payload.export_options.template) {
    return payload.export_options.template;
  }
  // Auto-select based on source module
  const autoMap: Record<SourceModule, TemplateId> = {
    "transcript-studio": "standard",
    "subtitle-studio": "standard",
    "content-studio": "standard",
    "meeting-intelligence": "meeting",
    "creator-studio": "youtube",
    "business-studio": "business",
  };
  return autoMap[payload.source_module];
}
```

---

## 5. Preview System Design

### 5.1 Preview Concept

Before downloading, users can preview what their export will look like. The preview renders an **approximate HTML representation** of the final document, allowing users to verify content, adjust options, and change formats without generating files repeatedly.

### 5.2 Preview UI Layout

```
+------------------------------------------------------------------+
| EXPORT PREVIEW                                          [X Close] |
+------------------------------------------------------------------+
| Format: [PDF v]  |  Template: [Meeting v]  |  Pages: ~3          |
+------------------------------------------------------------------+
|                                                                  |
|  [Rendered preview of the document]                              |
|                                                                  |
|  Meeting Notes - Product Roadmap Discussion                      |
|  Date: June 21, 2026 | Duration: 12:34 | Speakers: 2            |
|                                                                  |
|  ## Summary                                                      |
|  The team discussed the Q3 roadmap priorities and agreed on...   |
|                                                                  |
|  ## Action Items                                                 |
|  +-----+----------------------------+--------+----------+        |
|  | #   | Item                       | Owner  | Deadline |        |
|  +-----+----------------------------+--------+----------+        |
|  | 1   | Follow up on budget        | Rahul  | June 28  |        |
|  | 2   | Draft proposal             | Priya  | July 2   |        |
|  +-----+----------------------------+--------+----------+        |
|                                                                  |
|  ## Transcript                                                   |
|  [00:00:00] Rahul: Hello everyone, welcome to the meeting...     |
|                                                                  |
+------------------------------------------------------------------+
| [Download]  [Change Format v]  [Change Template v]  [Options...] |
+------------------------------------------------------------------+
```

### 5.3 Preview Rendering Strategy

| Format Category | Preview Method |
|---|---|
| Text formats (TXT, MD, SRT, VTT, ASS) | Raw text in monospace `<pre>` block, scrollable |
| Rich formats (DOCX, PDF) | Approximate HTML rendering (headings, paragraphs, tables) |
| Data formats (JSON, CSV) | Pretty-printed/formatted view with syntax highlighting |
| HTML | Rendered HTML in sandboxed iframe |

**Preview is NOT pixel-perfect.** It shows content structure and approximate layout. The actual downloaded file uses the full format library for precise rendering.

### 5.4 Preview Validation Warnings

The preview panel shows contextual warnings when issues are detected:

| Condition | Warning Message |
|---|---|
| Segments with confidence < 0.6 exist | "Some segments have low confidence -- output may contain errors" |
| Subtitle timing gaps > 2s detected | "Subtitle timing gaps detected -- some sections will have no captions" |
| Overlapping subtitle cues | "Subtitle timing overlaps detected -- fixing automatically" |
| No speaker information available | "No speakers detected -- speaker labels will not appear in export" |
| Document exceeds 50 pages (PDF) | "Large document (~{n} pages) -- generation may take a few seconds" |
| User-edited segments present | "Contains {n} user-edited segments (marked with original text preserved)" |

### 5.5 Preview Performance

- Preview generation target: < 500ms
- Preview uses the same `IntermediateDocument` as export (generated once, rendered twice)
- Preview does NOT run format libraries (no jsPDF, no docx.js) -- just HTML rendering
- For large documents (>100 segments): show first 50 in preview + "... and {n} more segments"

---

## 6. Privacy Workflow

### 6.1 Complete Privacy Lifecycle

```
[1] User triggers export from any module
         |
         v
[2] ExportPayload passed to Export Center (in-memory reference, client-side)
         |
         v
[3] Template + format conversion happens entirely in browser memory
    - No network calls
    - No data sent to any server
    - No telemetry on content
         |
         v
[4] Blob created in memory
    - Never touches server
    - Never written to IndexedDB/localStorage
    - Never touches disk (except browser temp during download)
         |
         v
[5] Object URL created -> download triggered
    - URL.createObjectURL(blob)
    - Hidden <a> element with download attribute clicked programmatically
         |
         v
[6] Object URL revoked immediately after download starts
    - URL.revokeObjectURL(url) called after 1-second delay
    - Blob reference released
         |
         v
[7] Blob garbage collected by browser engine
         |
         v
[8] Nothing persists. Zero trace in browser.
    - No cookies set
    - No localStorage written
    - No IndexedDB entries
    - No service worker cache
    - File exists ONLY on user's device
```

### 6.2 Privacy Guarantees

| Guarantee | Implementation |
|---|---|
| No export data sent to any server | Export Center makes zero network calls (`fetch`, `XMLHttpRequest` never invoked) |
| No export stored on any server | No server-side component exists at Stage 1 |
| No analytics on export content | No tracking pixels, no event logging of document content |
| No tracking of what was exported | Export actions not logged (only anonymous format-choice analytics if user consents) |
| File exists ONLY on user's device | `URL.createObjectURL` + `<a download>` = direct save to disk |
| Export Center is fully offline-capable | Zero network dependency; works without internet connection |
| No login required | Anonymous, immediate, one-time downloads |
| No session persistence | Refreshing the page clears all export state |

### 6.3 Stage 3 Server-side Exception

If server-side PDF generation is ever enabled (Stage 3, funded, custom branding):

- User must **explicitly opt-in** via a clearly labeled toggle
- Data sent via encrypted HTTPS to a processing endpoint
- Processing follows the same TTL model as Speech Engine:
  - Data received -> processed -> file generated -> response sent -> data deleted
  - Maximum server-side retention: 60 seconds
  - No logs of content retained
- User is clearly informed: "Your document will be processed on our server for custom branding. Data is deleted immediately after generation."
- This is the ONLY scenario where data leaves the browser

### 6.4 Privacy Audit Checklist

For every new feature added to Export Center, verify:

- [ ] Does this feature require a network call? If yes, document why and get approval.
- [ ] Does this feature write to localStorage/IndexedDB? If yes, justify and add auto-cleanup.
- [ ] Does this feature persist any user content? If yes, REJECT unless Stage 3 opt-in.
- [ ] Can this feature work entirely offline? It should.
- [ ] Does this feature introduce any third-party scripts? If yes, audit for data collection.

---

## 7. Performance Strategy

### 7.1 Target Metrics

| Operation | Target | Strategy |
|---|---|---|
| TXT/MD/SRT/VTT/JSON export | < 100ms | Native string operations, trivial concatenation |
| CSV export | < 200ms | Simple row generation, optional papaparse |
| HTML export | < 200ms | Template string rendering |
| ASS export | < 200ms | Structured text assembly |
| DOCX export (1000 segments) | < 2 seconds | docx.js in main thread; Web Worker if > 500ms |
| PDF export (1000 segments) | < 3 seconds | jsPDF + autotable; Web Worker for large docs |
| ZIP bundle (3 formats) | < 5 seconds | JSZip compression in Web Worker |
| Preview render | < 500ms | HTML-based approximate preview, no library overhead |

### 7.2 Large Document Strategy

| Document Size | Strategy |
|---|---|
| < 500 segments | Generate in main thread, no progress indicator |
| 500-2000 segments | Generate in main thread, show progress indicator |
| > 2000 segments | Generate in Web Worker, show progress indicator with percentage |
| > 5000 segments | Warn user ("This is a large document, generation may take 10+ seconds"), use Web Worker |

### 7.3 Web Worker Architecture

For heavy exports (DOCX, PDF, ZIP), processing moves to a Web Worker to prevent UI freezes:

```
Main Thread                          Web Worker
+------------------+                +--------------------+
| User clicks      |                |                    |
| "Download PDF"   |---postMessage->| Receive payload    |
|                  |                | Run jsPDF          |
| Show progress    |<--postMessage--| Report progress %  |
| [=====>     ] 40%|                |                    |
|                  |<--postMessage--| Report progress %  |
| [=========> ] 80%|                |                    |
|                  |                | Generate Blob      |
| Trigger download |<--postMessage--| Return Blob        |
| Hide progress    |                |                    |
+------------------+                +--------------------+
```

**Worker communication protocol:**

```typescript
// Main -> Worker
{ type: "generate", payload: ExportPayload, format: "pdf", options: ExportOptions }

// Worker -> Main (progress)
{ type: "progress", percent: 45, message: "Rendering page 3 of 7..." }

// Worker -> Main (complete)
{ type: "complete", blob: Blob, filename: string }

// Worker -> Main (error)
{ type: "error", message: "PDF generation failed: out of memory", recoverable: true }
```

### 7.4 Memory Management

| Concern | Strategy |
|---|---|
| Large PDFs (50+ pages) | Can consume 50-100MB in-memory; monitor via `performance.memory` (Chrome) |
| Multiple format generation | Generate sequentially, release each Blob after adding to ZIP |
| Object URLs | Revoke within 1 second of download start |
| Web Worker cleanup | Terminate worker after generation complete |
| IntermediateDocument | Release reference after all formats generated |

**Memory warning thresholds:**

```typescript
// If available memory < 100MB before PDF generation
if (performance.memory && performance.memory.usedJSHeapSize > performance.memory.jsHeapSizeLimit - 100_000_000) {
  showWarning("Your device is low on memory. Consider exporting as TXT or MD for faster results.");
}
```

### 7.5 Progress UI

```
+------------------------------------------------------------------+
| Generating PDF...                                                |
| [==========================>                    ] 55%             |
| Rendering page 4 of 7...                                        |
+------------------------------------------------------------------+
```

For batch export (ZIP):
```
+------------------------------------------------------------------+
| Generating export bundle...                                      |
| [1/3] PDF   [===========] Done                                   |
| [2/3] DOCX  [======>    ] 62%                                    |
| [3/3] TXT   [ Waiting ]                                          |
+------------------------------------------------------------------+
```

---

## 8. Error Handling Strategy

### 8.1 Error Classification

| Error Category | Detection Point | Severity | User Impact |
|---|---|---|---|
| Validation errors | Step 2 (Validate) | Blocking | Cannot proceed to export |
| Data quality issues | Step 2-3 (Validate/Template) | Warning | Export proceeds with caveats |
| Generation failures | Step 4 (Format Conversion) | Blocking | Specific format fails |
| Packaging failures | Step 5 (Packaging) | Partial | ZIP may be incomplete |
| Delivery failures | Step 6 (Delivery) | Blocking | File cannot be downloaded |

### 8.2 Error Table

| Error | Detection | User Message | Recovery Action |
|---|---|---|---|
| Missing data | ExportPayload validation fails (required fields null) | "Cannot export -- transcript data is missing. Please return to [module] and try again." | Return to source module |
| Corrupt segments | Segments have invalid timestamps or empty text | "Some data appears invalid. Export may be incomplete -- {n} segments skipped." | Export valid data; flag skipped segments |
| Invalid subtitle timing | Overlapping cues or negative duration | "Subtitle timing has errors. Fixing automatically..." | Auto-fix: trim overlaps, skip negative durations |
| Format not available | User selects SRT for non-subtitle content | Format chip is disabled/grayed out with tooltip explaining why | Show only available formats as active |
| Generation failure (OOM) | Library throws error during conversion | "Export generation failed. Try a simpler format (TXT or MD) or a shorter selection." | Suggest fallback format; offer to export partial |
| Generation failure (library) | docx.js/jsPDF throws unexpected error | "Something went wrong generating your {format} file. Trying alternative..." | Attempt regeneration; fall back to TXT |
| Session data expired | ExportPayload references data no longer in memory | "Session data has expired. Please re-upload your file to export again." | Redirect to upload page |
| Browser download blocked | Popup blocker prevents download trigger | "Download was blocked by your browser. Please allow downloads for this site." | Show manual download link; provide instructions |
| ZIP too large | Bundle exceeds 100MB | "Export bundle is very large ({size}MB). Download formats separately for better reliability." | Offer individual format downloads |
| Font not available | PDF requires script not in default font | "Loading font for {language} support..." | Load Noto Sans variant; fall back to basic Latin if unavailable |
| Worker crash | Web Worker terminates unexpectedly | "Export process interrupted. Retrying..." | Restart worker; attempt main-thread generation for smaller docs |

### 8.3 Error Handling Principles

1. **Never lose data silently.** If export partially fails, deliver what succeeded with a clear message about what failed.
2. **Always offer a fallback.** TXT export always works (pure string concatenation, no library dependency). If everything else fails, TXT is the safety net.
3. **Validate before generation.** Fail fast at Step 2; do not waste time generating a file that will fail at Step 5 or 6.
4. **Provide actionable messages.** Every error message tells the user what happened AND what they can do about it.
5. **Log errors locally.** Errors are logged to `console.error` for debugging but never sent to any server (privacy).
6. **Graceful degradation.** If a Web Worker is unavailable, fall back to main-thread generation (slower but functional).

### 8.4 Retry Logic

```typescript
async function exportWithRetry(request: ExportRequest, maxRetries: number = 2): Promise<ExportResult> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await executeExportPipeline(request);
    } catch (error) {
      if (attempt === maxRetries) {
        // Final failure: offer TXT fallback
        return offerFallback(request, error);
      }
      if (isRetryable(error)) {
        // Wait briefly, then retry (e.g., Worker crashed)
        await delay(500 * (attempt + 1));
        continue;
      }
      // Non-retryable: show error immediately
      throw error;
    }
  }
}
```

---

## 9. Accessibility Plan

### 9.1 Keyboard Navigation

| Shortcut | Action | Context |
|---|---|---|
| `Tab` | Navigate between format chips, options, buttons | Entire export panel |
| `Shift+Tab` | Navigate backwards | Entire export panel |
| `Enter` / `Space` | Select format chip, toggle option, trigger button | Focused element |
| `Escape` | Close preview modal | Preview open |
| `Ctrl+E` | Quick export (uses last-used settings) | Anywhere in app |
| `Arrow Left/Right` | Navigate between format chips in the format bar | Format selection area |
| `Arrow Up/Down` | Navigate template dropdown options | Template selector |

### 9.2 Screen Reader Support

| Element | ARIA Implementation |
|---|---|
| Format chips | `role="radiogroup"` with `aria-label="Export format selection"` |
| Individual format chip | `role="radio"` with `aria-label="Export as PDF document"` / `aria-checked` |
| Disabled format chip | `aria-disabled="true"` with `aria-describedby` pointing to explanation |
| Options checkboxes | `<input type="checkbox">` with proper `<label>` association |
| Download button | `aria-label="Download {format} file"` |
| Progress bar | `role="progressbar"` with `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"` |
| Download status | `aria-live="polite"` region announcing "Download started" / "Download complete" |
| Preview content | Semantic HTML (headings, paragraphs, tables) readable by screen reader |
| Error messages | `role="alert"` with `aria-live="assertive"` |
| Warnings | `role="status"` with `aria-live="polite"` |

### 9.3 Visual Accessibility

| Requirement | Implementation |
|---|---|
| Format chips have text labels | Always show format name text; icons are decorative (`aria-hidden="true"`) |
| Disabled state is clear | Grayed out visually + strikethrough + tooltip explaining why |
| High contrast mode | All UI elements tested with Windows High Contrast; use `forced-colors` media query |
| Focus indicators | Visible 2px focus ring on all interactive elements (`:focus-visible`) |
| Color not sole indicator | Selected format uses both color AND a checkmark icon |
| Text sizing | All text uses `rem` units; respects user font-size preferences |
| Motion reduction | Progress animations respect `prefers-reduced-motion` (show static percentage instead) |
| Touch targets | All buttons/chips minimum 44x44px tap target on mobile |

### 9.4 Accessible Export Content

The exported files themselves should be accessible where the format supports it:

| Format | Accessibility Feature |
|---|---|
| PDF | Tagged PDF structure (headings, paragraphs), language attribute set, reading order defined |
| DOCX | Proper heading hierarchy, alt-text placeholders for future images, language metadata |
| HTML | Semantic HTML5 elements, `lang` attribute, ARIA landmarks |
| VTT | Supports styling for readability (font-size, color contrast) |

---

## 10. Future Upgrade Roadmap

### 10.1 Staged Feature Rollout

| Feature | Stage | Description | Dependency | Effort |
|---|---|---|---|---|
| Core export (all P0/P1 formats) | Stage 1 | TXT, MD, SRT, VTT, JSON, DOCX, PDF, CSV | None | 3-4 weeks |
| Template system (6 templates) | Stage 1 | Standard, meeting, interview, podcast, business, youtube | Core export | 2 weeks |
| Preview system | Stage 1 | HTML-based preview before download | Template system | 1-2 weeks |
| Batch export (ZIP) | Stage 1 | Multi-format bundle download | Core export, JSZip | 1 week |
| ASS subtitle format | Stage 1-2 | Advanced subtitle styling | Core export | 1 week |
| HTML export | Stage 1-2 | Styled HTML output | Template system | 1 week |
| Custom branding | Stage 2 | User uploads logo for PDF cover page | Logo upload component | 2 weeks |
| Watermarks | Stage 2 | "Draft" / "Confidential" watermark on PDFs | jsPDF watermark layer | 1 week |
| Print optimization | Stage 2 | PDF optimized for printing (margins, page breaks) | PDF export | 1 week |
| Custom CSS for subtitles | Stage 2 | User-defined subtitle styling for ASS format | Style editor UI | 2 weeks |
| Accessibility export (HTML) | Stage 2 | Export with enhanced alt-text, ARIA in HTML | HTML export | 1 week |
| Company templates | Stage 2-3 | Upload custom DOCX/PDF template, fill with data | Template import/parse | 3 weeks |
| Advanced reports | Stage 2 | Multi-section analytics report (charts, word clouds) | Chart generation library | 3-4 weeks |
| Automated workflows | Stage 3 | "Always export as PDF + SRT after transcription" preset | Workflow engine | 4 weeks |
| Scheduled delivery | Stage 3 | Email export to specified address | Email service + auth system | 4 weeks |
| Cloud storage push | Stage 3 | Export directly to Google Drive / Dropbox | OAuth integration | 3 weeks |
| Server-side PDF | Stage 3 | Custom branded PDF with complex layouts (server rendering) | Server infra + budget | 4 weeks |

### 10.2 Library Upgrade Path

| Current | Future Upgrade | Trigger |
|---|---|---|
| jsPDF (basic) | Puppeteer/Playwright (server) | Need for complex PDF layouts, custom fonts at scale |
| docx.js (basic) | Custom OOXML generation | Need for advanced Word features (tracked changes, comments) |
| JSZip (basic) | Streaming ZIP | Files > 500MB or 100+ file bundles |
| Native CSV | papaparse | Need for complex CSV (nested quotes, unicode, BOM) |
| No charts | Chart.js / D3 (canvas) | Analytics reports with visual graphs |

### 10.3 Format Expansion Candidates

| Format | Use Case | Priority | Stage |
|---|---|---|---|
| EPUB | Long-form transcript as ebook | Low | Stage 3 |
| ODT | Open document format (LibreOffice) | Low | Stage 3 |
| RTF | Legacy compatibility | Very Low | Stage 3 |
| XML (TTML) | Broadcast subtitle standard | Medium | Stage 2 |
| Excel (XLSX) | Structured meeting data with formulas | Medium | Stage 2 |
| PowerPoint (PPTX) | Meeting highlights as slides | Low | Stage 3 |

---

## 11. Export Customization Options

### 11.1 User-Configurable Options

| Option | Values | Default | Applies To | UI Element |
|---|---|---|---|---|
| Include timestamps | Yes / No | Yes | Transcript, Meeting | Toggle switch |
| Include speakers | Yes / No | Yes | Transcript, Meeting, Business | Toggle switch |
| Include confidence scores | Yes / No | No | Transcript (JSON only) | Toggle switch |
| Mode | Compact / Detailed | Detailed | All formats | Radio buttons |
| Template | standard / meeting / interview / podcast / business / youtube | Auto-detected | All formats | Dropdown |
| Custom filename | Free text | Auto-generated | All formats | Text input |
| Page size (PDF) | A4 / Letter / Legal | A4 | PDF only | Dropdown |
| Font size | Small (10pt) / Medium (12pt) / Large (14pt) | Medium (12pt) | PDF, DOCX | Dropdown |
| Include header/footer | Yes / No | Yes | PDF, DOCX | Toggle switch |
| Timestamp format | HH:MM:SS / MM:SS / Seconds | HH:MM:SS | All with timestamps | Dropdown |
| Speaker format | Full name / First name / Initials | Full name | All with speakers | Dropdown |

### 11.2 Option Persistence

- Options are stored in `sessionStorage` (cleared on tab close)
- Last-used format and template remembered within session for "Quick Export" (`Ctrl+E`)
- No server-side preference storage (no accounts)
- Future (Stage 2): optional `localStorage` preference with explicit user consent

### 11.3 Mode Comparison

| Aspect | Compact Mode | Detailed Mode |
|---|---|---|
| Timestamps | Omitted | Included before each segment |
| Speakers | Inline (bold name) | Separate line with name and timestamp |
| Metadata header | Minimal (title + date) | Full (title, date, duration, speakers, language, quality) |
| Footer | None | Stats (word count, segments, duration) |
| Segment spacing | Single newline | Double newline with dividers |
| Table of contents | No | Yes (for Meeting/Business templates) |

---

## 12. Batch Export Design

### 12.1 Multi-Format Selection

Users can select multiple formats simultaneously via checkboxes in the format selection UI:

```
+------------------------------------------------------------------+
| SELECT EXPORT FORMATS                                            |
+------------------------------------------------------------------+
| [x] PDF    [x] DOCX    [ ] TXT    [ ] MD    [x] JSON            |
|                                                                  |
| 3 formats selected -> Will download as ZIP bundle                |
+------------------------------------------------------------------+
| Template: [Meeting v]    Mode: [Detailed v]    [Preview] [Export]|
+------------------------------------------------------------------+
```

### 12.2 Batch Processing Flow

1. User selects 2+ formats via checkboxes
2. System shows "Will download as ZIP bundle" indicator
3. On export trigger, formats are generated **sequentially** (not parallel, to manage memory)
4. Progress shows per-format completion status
5. All generated Blobs are added to a JSZip instance
6. ZIP is generated and downloaded as a single file
7. All intermediate Blobs are released after ZIP creation

### 12.3 Batch Error Handling

- If one format fails, others still complete and are delivered
- Failed format is shown with error icon and message in progress UI
- ZIP contains only successfully generated files
- Summary shown after download: "3/4 formats exported successfully. PDF failed: [reason]"

### 12.4 ZIP Structure

```
meeting_recording_june_2026_export_20260621.zip
  |-- meeting_recording_june_2026.pdf
  |-- meeting_recording_june_2026.docx
  |-- meeting_recording_june_2026.json
```

- Flat structure (no subdirectories)
- Consistent naming across all files in bundle
- ZIP filename pattern: `{title}_export_{date}.zip`

---

## 13. Mobile Export Experience

### 13.1 Responsive Design Adaptations

| Aspect | Desktop | Mobile |
|---|---|---|
| Format selection | Horizontal chip bar | Wrapped grid (2 columns) |
| Options panel | Side panel or inline | Bottom sheet (slide-up) |
| Preview | Side panel or modal | Full-screen modal |
| Progress indicator | Inline bar | Full-width fixed bar at bottom |
| Download confirmation | Toast notification | Full-width banner at top |

### 13.2 Mobile-Specific Considerations

| Consideration | Solution |
|---|---|
| Safari requires user gesture for downloads | Export button click is the user gesture; no async delays before triggering download |
| Limited memory on mobile devices | Show warning for large exports: "This may take a moment on mobile devices" |
| Slower processing | Lower threshold for "large document" warnings (1000 segments instead of 2000) |
| Small screen for preview | Preview uses full-screen modal with simplified layout |
| Touch targets | All interactive elements minimum 44x44px |
| Network interruption irrelevant | All generation is client-side; no network needed |

### 13.3 Mobile Download Flow

```
[1] User taps "Export" button (user gesture captured)
         |
         v
[2] Format selection bottom sheet slides up
    - Large touch-friendly format chips
    - Clearly labeled with format name + icon
         |
         v
[3] User selects format(s) and taps "Download"
    - Single synchronous path from tap to download trigger
    - No intermediate async that would lose user gesture context
         |
         v
[4] Progress shown as full-width bar (if needed)
         |
         v
[5] Native OS download handler takes over
    - iOS: "Downloads" notification
    - Android: Download manager notification
```

---

## 14. PDF Export System Detail

### 14.1 PDF Architecture

The PDF export uses **jsPDF** (core rendering) and **jsPDF-autotable** (table generation) for complete client-side PDF creation.

**Library budget:** ~300 KB combined (gzipped: ~100 KB)

### 14.2 PDF Document Structure

```
+------------------------------------------------------------------+
| PAGE 1: COVER (optional)                                         |
+------------------------------------------------------------------+
|                                                                  |
|              Meeting Notes                                       |
|              Product Roadmap Discussion                           |
|                                                                  |
|              Date: June 21, 2026                                  |
|              Duration: 12:34                                      |
|              Speakers: Rahul, Priya                               |
|                                                                  |
|              [Squicky logo - subtle, bottom corner]               |
|                                                                  |
+------------------------------------------------------------------+

+------------------------------------------------------------------+
| PAGE 2+: BODY                                                    |
+------------------------------------------------------------------+
| Summary                                                  [pg 2]  |
|------------------------------------------------------------------|
| The team discussed Q3 roadmap priorities...                      |
|                                                                  |
| Action Items                                                     |
| +-----+----------------------------+--------+----------+         |
| | #   | Item                       | Owner  | Deadline |         |
| +-----+----------------------------+--------+----------+         |
| | 1   | Follow up on budget        | Rahul  | June 28  |         |
| +-----+----------------------------+--------+----------+         |
|                                                                  |
| Transcript                                                       |
|------------------------------------------------------------------|
| [00:00:00] Rahul:                                                |
| Hello everyone, welcome to the meeting.                          |
|                                                                  |
| [00:00:04] Priya:                                                |
| Thank you for joining on such short notice.                      |
|                                                                  |
+------------------------------------------------------------------+
|                                                    Page 2 of 7   |
|                                         Generated by Squicky     |
+------------------------------------------------------------------+
```

### 14.3 PDF Styling Specifications

| Element | Font | Size | Style | Color |
|---|---|---|---|---|
| Document title | Noto Sans | 24pt | Bold | #1a1a1a |
| Section heading (H2) | Noto Sans | 16pt | Bold | #2c2c2c |
| Sub-heading (H3) | Noto Sans | 13pt | Bold | #3c3c3c |
| Body text | Noto Sans | 11pt | Regular | #333333 |
| Timestamp | Noto Sans Mono | 9pt | Regular | #666666 |
| Speaker name | Noto Sans | 11pt | Bold | #1a1a1a |
| Footer | Noto Sans | 8pt | Regular | #999999 |
| Table header | Noto Sans | 10pt | Bold | #ffffff (bg: #4a4a4a) |
| Table cell | Noto Sans | 10pt | Regular | #333333 |

### 14.4 PDF Font Strategy

- **Primary font:** Noto Sans (supports Latin, Devanagari, and 100+ scripts)
- **Monospace:** Noto Sans Mono (for timestamps, code blocks)
- **Font embedding:** Subset embedding to minimize file size
- **Fallback:** If Noto Sans unavailable, use Helvetica (built into jsPDF, Latin only)
- **Hindi support:** Critical for Squicky (Hindi-English platform); Noto Sans Devanagari subset loaded on demand

**Font bundling strategy (maintains "zero network calls" guarantee):**

| Font | Size (subset) | Loading | Bundled with app? |
|------|---------------|---------|-------------------|
| Noto Sans Latin | ~50KB | Always loaded (core) | Yes (in main bundle) |
| Noto Sans Devanagari | ~400KB | Lazy-loaded on first Hindi PDF export | Yes (in separate chunk, not CDN) |
| Noto Sans Mono | ~30KB | Lazy-loaded on first PDF with timestamps | Yes (in separate chunk) |

**Key decision:** All fonts are bundled within the app build (as separate lazy-loadable chunks), NOT fetched from Google Fonts CDN or any external source. This means:
- First Hindi PDF export may have a ~200ms delay loading the font chunk from the app bundle
- Subsequent exports use the cached module (instant)
- Works fully offline — no network dependency ever
- Adds ~480KB to total app deployment size (acceptable for full Hindi+English PDF support)
- If user never exports PDF with Hindi, the Devanagari font chunk is never loaded (tree-shaking)

### 14.5 PDF Layout Specifications

| Parameter | Value |
|---|---|
| Page size (default) | A4 (210mm x 297mm) |
| Margins | Top: 25mm, Bottom: 20mm, Left: 20mm, Right: 20mm |
| Line spacing | 1.4x font size |
| Paragraph spacing | 6pt after |
| Column layout | Single column |
| Header height | 15mm (page number + section title) |
| Footer height | 10mm (page number + "Generated by Squicky") |
| Max content width | 170mm (page width minus margins) |

---

## 15. DOCX Export System Detail

### 15.1 DOCX Architecture

The DOCX export uses **docx.js** to create valid `.docx` files entirely client-side. The library generates the Open XML (OOXML) structure that Microsoft Word, Google Docs, and LibreOffice can open natively.

**Library budget:** ~200 KB (gzipped: ~70 KB)

### 15.2 DOCX Document Structure

```typescript
const doc = new Document({
  creator: "Squicky Speech Intelligence Platform",
  title: metadata.title,
  description: "Exported transcript",
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 } } }, // Letter size in twips
    children: [
      // Title
      new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }),
      // Metadata
      new Paragraph({ text: `Duration: ${duration} | Speakers: ${speakers}` }),
      // Sections...
      new Paragraph({ text: "Transcript", heading: HeadingLevel.HEADING_2 }),
      // Segments
      ...segments.map(s => new Paragraph({
        children: [
          new TextRun({ text: `[${s.timestamp}] `, color: "666666", size: 18 }),
          new TextRun({ text: `${s.speaker}: `, bold: true }),
          new TextRun({ text: s.text }),
        ]
      }))
    ]
  }]
});
```

### 15.3 DOCX Heading Hierarchy

| Level | Usage | Style |
|---|---|---|
| H1 | Document title | 24pt, Bold, Space after 12pt |
| H2 | Major sections (Summary, Transcript, Action Items) | 16pt, Bold, Space after 8pt |
| H3 | Sub-sections (individual topics, speaker blocks) | 13pt, Bold, Space after 6pt |

### 15.4 DOCX Formatting Details

| Element | Format |
|---|---|
| Speaker name | Bold, followed by colon |
| Timestamp | Gray color (#666666), smaller font (9pt), before speaker name |
| Segment text | Normal weight, 11pt, black |
| Action items | Numbered list with bold task + normal owner/deadline |
| Decisions | Bulleted list |
| Tables | Bordered table with header row (bold, shaded background) |
| Metadata | Italic, gray, below title |

### 15.5 DOCX Document Properties

```typescript
{
  creator: "Squicky",
  title: metadata.title,
  subject: "Transcript Export",
  keywords: metadata.language,
  lastModifiedBy: "Squicky Export Center",
  created: new Date(),
  modified: new Date(),
  // Custom properties
  customProperties: [
    { name: "Duration", value: metadata.duration_sec },
    { name: "Speakers", value: metadata.speakers.join(", ") },
    { name: "Source Module", value: payload.source_module },
    { name: "Export Template", value: payload.export_options.template }
  ]
}
```

---

## 16. Integration Points

### 16.1 Module Communication Interface

Each source module integrates with Export Center via a standardized React hook:

```typescript
// Hook used by source modules to trigger export
function useExportCenter() {
  return {
    openExportPanel: (payload: ExportPayload) => void,
    quickExport: (payload: ExportPayload, format: FormatId) => void,
    isExporting: boolean,
    lastExportStatus: ExportStatus | null,
  };
}

// Usage in Transcript Studio:
const { openExportPanel } = useExportCenter();
const payload = buildTranscriptPayload(currentTranscript, editHistory);
openExportPanel(payload);
```

### 16.2 Export Center State Management

```typescript
interface ExportCenterState {
  isOpen: boolean;
  currentPayload: ExportPayload | null;
  selectedFormats: FormatId[];
  selectedTemplate: TemplateId;
  options: ExportOptions;
  previewMode: boolean;
  exportProgress: {
    status: "idle" | "generating" | "packaging" | "downloading" | "complete" | "error";
    percent: number;
    currentFormat: FormatId | null;
    message: string;
  };
  errors: ExportError[];
  warnings: ExportWarning[];
}
```

### 16.3 Event Flow

```
Source Module                Export Center              User
     |                           |                      |
     |---openExportPanel(payload)-->                    |
     |                           |---[show panel]------>|
     |                           |<--[select format]----|
     |                           |<--[set options]------|
     |                           |<--[click preview]----|
     |                           |---[show preview]--->|
     |                           |<--[click download]---|
     |                           |---[generate]         |
     |                           |---[progress 25%]--->|
     |                           |---[progress 75%]--->|
     |                           |---[trigger download]->|
     |                           |---[show confirm]---->|
     |                           |---[cleanup memory]   |
     |                           |                      |
```

---

## 17. Testing Strategy

### 17.1 Unit Test Coverage

| Component | Test Focus | Key Cases |
|---|---|---|
| Input Validator | Schema validation, type checking | Missing fields, wrong types, incompatible format requests |
| Template Engine | Correct section generation | Each template produces expected IntermediateDocument structure |
| Format Converters | Output correctness | TXT output matches expected string; SRT timing format correct |
| Filename Generator | Sanitization, format | Special characters, long titles, various locales |
| Packager | ZIP creation, single file | Multi-file bundle, single download, error in one format |
| Delivery | Download trigger | Blob URL creation, revocation timing, cleanup |

### 17.2 Integration Tests

| Scenario | Input | Expected Output |
|---|---|---|
| Full transcript export as PDF | StandardTranscript (100 segments) | Valid PDF blob, correct page count, all text present |
| Meeting export with all sections | Meeting payload (summary, actions, decisions) | DOCX with correct heading hierarchy, tables populated |
| Subtitle export as SRT | 50 subtitle cues | Valid SRT format, sequential numbering, correct timing |
| Batch export (3 formats) | Transcript + [PDF, DOCX, TXT] | ZIP containing 3 correctly named files |
| Invalid payload rejection | Missing required fields | Validation error returned, no generation attempted |

### 17.3 Performance Tests

| Test | Threshold | Measurement |
|---|---|---|
| TXT export (100 segments) | < 50ms | `performance.now()` delta |
| PDF export (1000 segments) | < 3000ms | `performance.now()` delta |
| DOCX export (1000 segments) | < 2000ms | `performance.now()` delta |
| ZIP bundle (3 formats, 500 segments) | < 5000ms | `performance.now()` delta |
| Memory usage (PDF, 1000 segments) | < 100MB peak | `performance.memory.usedJSHeapSize` |

---

## 18. Security Considerations

### 18.1 Input Sanitization

| Risk | Mitigation |
|---|---|
| XSS via transcript text in HTML export | Escape all user content before HTML insertion (`<`, `>`, `&`, `"`, `'`) |
| Path traversal in filename | Sanitize: remove `../`, `./`, control characters, OS-reserved names |
| Blob URL hijacking | Revoke URLs immediately; never expose URLs in DOM longer than necessary |
| Malicious content in transcript | Export renders text as-is (no code execution); PDF/DOCX treat all content as text |
| ZIP bomb (batch export) | Limit total ZIP size to 500MB; limit file count to 20 per bundle |
| Memory exhaustion (DoS) | Monitor memory; abort generation if heap exceeds safe threshold |

### 18.2 Content Security Policy Compatibility

- Export Center uses `URL.createObjectURL` (requires `blob:` in CSP)
- No `eval()` or `new Function()` used anywhere
- No external resource loading during export (all libraries bundled)
- No iframe needed except for HTML preview (sandboxed: `sandbox="allow-same-origin"`)

---

*End of Export Center Module Architecture Document*

---

> **Document version:** 1.0
> **Last updated:** 2026-06-21
> **Next review:** After Transcript Studio Module implementation begins
> **Dependent on:** Master Architecture v1.0, UI/UX Design System v1.0, Speech Engine Module v1.0, Transcript Studio Module v1.0
