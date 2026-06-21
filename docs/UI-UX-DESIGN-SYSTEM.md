# Squicky Speech Intelligence Platform (SSIP)
## Complete UI/UX Design System Blueprint

> **Status:** Design Phase -- No code yet.  
> **Author role:** Lead UI/UX Architect / Senior Product Designer.  
> **Prerequisite:** Master Architecture Document (approved).  
> **Purpose:** A professional UI/UX blueprint for developers to implement.

---

## Table of Contents

1. [Complete Dashboard Layout](#1-complete-dashboard-layout)
2. [Complete Navigation System](#2-complete-navigation-system)
3. [Complete User Flow](#3-complete-user-flow)
4. [Mobile UI Strategy](#4-mobile-ui-strategy)
5. [Design System](#5-design-system)
6. [Component Library Structure](#6-component-library-structure)
7. [Accessibility Plan](#7-accessibility-plan)
8. [Future Expansion Strategy](#8-future-expansion-strategy)

---

## 1. Complete Dashboard Layout

### 1.1 Layout Anatomy (Desktop 1440px+)

The application shell uses a fixed-position frame with a fluid content area. All panels
are independently scrollable to prevent full-page scroll conflicts.

```
+------------------------------------------------------------------+
|                        HEADER (56px, fixed)                       |
| [Logo]  [____Search____]  [Privacy]  [Theme]  [Session]          |
+--------+-------------------------------------------------+-------+
|        |                                                 |       |
| SIDE   |              MAIN WORKSPACE                     | RIGHT |
| BAR    |              (fluid width)                      | PANEL |
| 240px  |                                                 | 320px |
| collap |         Scrollable content area                 | collap|
| sible  |         Tab bar at top                          | sible |
| to     |         Module-specific UI below                |       |
| 64px   |                                                 |       |
|        |                                                 |       |
|        |                                                 |       |
+--------+-------------------------------------------------+-------+
|                        FOOTER (40px, subtle)                     |
| [Privacy Policy]  [Version]                    [Processing Jobs] |
+------------------------------------------------------------------+
```

### 1.2 Layout Behavior Rules

| Region         | Position | Height/Width       | Scroll      | Collapse           |
|----------------|----------|--------------------|-------------|--------------------|
| Header         | Fixed    | 56px               | None        | No                 |
| Sidebar        | Fixed    | Full height - 56px | Internal    | 240px to 64px      |
| Main Workspace | Relative | Fluid              | Internal    | No                 |
| Right Panel    | Fixed    | Full height - 56px | Internal    | 320px to 0px       |
| Footer         | Fixed    | 40px               | None        | No                 |

### 1.3 Navigation Logic

Navigation is hierarchical with three levels:

- **Primary (Sidebar):** Module-level navigation. One module active at a time. Each module corresponds to a top-level route (e.g., `/transcript`, `/subtitles`, `/export`).
- **Secondary (Tabs):** Within the main workspace, each module may define internal tabs (e.g., Content Studio has Summary, Blog, FAQ, Social tabs). Tabs map to sub-routes (e.g., `/content/summary`).
- **Tertiary (Toolbar):** Action buttons within the current view. These do not change the route. They trigger modals, dropdowns, or inline UI changes.

**Routing:** All navigation is URL-driven. Deep links work. Browser back/forward navigate between modules and tabs. State is preserved per module when switching.

---

## 2. Complete Navigation System

### 2.1 Sidebar Design

#### Module Grouping

The sidebar organizes modules into logical groups with collapsible section headers:

```
+----------------------------+
| [S] SQUICKY                |  <- Logo, links to home/upload
+----------------------------+
|                            |
| CORE                       |  <- Group label (muted, uppercase, 11px)
| [mic]    Speech Engine     |
| [doc]    Transcript Studio |
| [export] Export Center     |
|                            |
| STUDIOS                    |
| [sub]    Subtitle Studio   |
| [pen]    Content Studio    |
| [users]  Meeting Intel     |
| [video]  Creator Studio    |
| [brief]  Business Studio   |
|                            |
+----------------------------+
| [gear]   Settings          |  <- Bottom-pinned
+----------------------------+
```

#### Icon Descriptions

| Module               | Icon Type                | Description                      |
|----------------------|--------------------------|----------------------------------|
| Speech Engine        | Microphone               | Audio input representation       |
| Transcript Studio    | Document with lines      | Text document                    |
| Export Center        | Download/share arrow     | Export action                    |
| Subtitle Studio      | Text with timing marks   | Captioned content                |
| Content Studio       | Pen/quill                | Content creation                 |
| Meeting Intelligence | People/group             | Collaborative meeting            |
| Creator Studio       | Video/play button        | Creator/media content            |
| Business Studio      | Briefcase                | Professional/business context    |

#### Collapsed State (64px)

When collapsed, the sidebar shows only icons centered in the 64px column. Module names are hidden. On hover, a tooltip appears to the right showing the module name. The group labels disappear. A small expand arrow button at the bottom allows re-expansion.

#### Future Expansion (20+ Modules)

- Groups are collapsible (click group header to collapse/expand)
- Scrollable sidebar with overflow hidden and internal scroll
- "Pinned" modules float to top regardless of group (user preference, stored locally)
- Module search filter at top of sidebar (appears when 10+ modules exist)
- "More" overflow section for rarely-used modules
- New modules are added to existing groups or new groups are defined in config

### 2.2 Header Design

```
+------------------------------------------------------------------+
| [Logo]  [________Search transcripts & modules________]           |
|                                   [Shield Private] [Sun] [Anon]  |
+------------------------------------------------------------------+
```

| Element            | Position     | Behavior                                           |
|--------------------|--------------|----------------------------------------------------|
| Logo               | Left         | Squicky wordmark/icon. Clicking navigates to home. |
| Search Bar         | Center-left  | Searches transcripts by content + module names.    |
| Privacy Indicator  | Center-right | Green shield icon + "Private" text. Always visible.|
| Theme Toggle       | Right        | Sun icon (light) / Moon icon (dark). Click toggles.|
| Session Info       | Far right    | Text: "Anonymous session". No avatar, no login.    |

**Deliberately absent:** Notifications bell, user avatar, login/signup button, account dropdown. The platform has no user accounts -- all sessions are anonymous and local.

---

## 3. Complete User Flow

### 3.1 Upload Experience (Homepage)

The upload zone IS the homepage. When no transcript is loaded, the entire main workspace area displays the upload interface.

```
+--------------------------------------------------+
|                                                  |
|       +----------------------------------+       |
|       |          (dashed border)         |       |
|       |                                  |       |
|       |         [Upload Icon]            |       |
|       |                                  |       |
|       |   Drag & drop audio file here    |       |
|       |          or                      |       |
|       |   [Browse Files]  [Record]       |       |
|       |                                  |       |
|       |   MP3, WAV, FLAC, OGG, M4A      |       |
|       |   Max duration: 60 minutes       |       |
|       +----------------------------------+       |
|                                                  |
|   All processing happens locally in your         |
|   browser. No files are uploaded to any server.  |
|                                                  |
+--------------------------------------------------+
```

#### Upload States

| State        | Visual                                              | Behavior                                    |
|--------------|-----------------------------------------------------|---------------------------------------------|
| Idle         | Dashed border, muted colors, upload icon             | Waiting for user interaction                |
| Drag Hover   | Border becomes solid accent, background tints        | File is hovering over drop zone             |
| Uploading    | Progress bar (0-100%), filename shown                | File being read into browser memory         |
| Processing   | Animated waveform, stage labels rotate               | Converting -> Transcribing -> Generating    |
| Success      | Green checkmark, "Transcript ready"                  | Auto-navigates to Transcript Studio (1.5s)  |
| Error        | Red border, error message, [Retry] button            | File format invalid or processing failed    |
| Rate Limited | Yellow border, "Processing busy, please wait"        | Local engine is occupied with another file   |

### 3.2 Transcript Studio UI

#### Layout Structure

```
+------------------------------------------------------------------+
| TOOLBAR                                                          |
| [Play] [1x] [Timestamps] [Find] [Replace] [Speakers] [Lang] [Export]|
+---------------------------------------------+--------------------+
|                                             |                    |
|  TRANSCRIPT EDITOR                          |  INFO PANEL        |
|  (left, ~65% width)                         |  (right, ~35%)     |
|                                             |                    |
|  [00:00] Speaker 1:                         |  Duration: 4:32    |
|  Lorem ipsum dolor sit amet,               |  Language: English  |
|  consectetur adipiscing elit.               |  Speakers: 2       |
|                                             |  Words: 1,247      |
|  [00:15] Speaker 2:                         |  Confidence: 94%   |
|  Sed do eiusmod tempor                      |                    |
|  incididunt ut labore.                      |  OUTPUTS AVAILABLE  |
|                                             |  [x] Subtitles     |
|  (scrollable, editable)                     |  [x] Summary       |
|                                             |  [ ] Meeting Notes |
+---------------------------------------------+--------------------+
| AUDIO PLAYER BAR (fixed bottom)                                  |
| [<<] [Play] [>>]  ====|====waveform====  03:21 / 04:32  [Vol]  |
+------------------------------------------------------------------+
```

#### Workflow

- **Bidirectional sync:** Clicking a word in the transcript seeks audio to that timestamp. Playing audio highlights the current word/segment.
- **Inline editing:** Click any text segment to edit. Changes are saved in local state. Original transcript preserved for diff.
- **Find/Replace:** Opens inline bar below toolbar. Highlights all matches in transcript. Replace one or replace all.
- **Speaker labels:** Editable. Click speaker name to rename all instances.

### 3.3 Subtitle Studio UI

#### Layout Structure

```
+------------------------------------------------------------------+
| TOOLBAR                                                          |
| [Format: SRT v] [Max chars: 42] [Lines: 2]         [Export]     |
+-----------------------------+------------------------------------+
|                             |                                    |
|  CUE LIST                   |  PREVIEW                           |
|  (left, scrollable)         |  (right)                           |
|                             |                                    |
|  #1  00:00 - 00:03          |  +----------------------------+   |
|  "Hello and welcome"        |  |                            |   |
|  [Edit] [Split] [Merge]    |  |     (waveform visual)      |   |
|                             |  |                            |   |
|  #2  00:03 - 00:06          |  |    "Hello and welcome"     |   |
|  "to the presentation"      |  |                            |   |
|  [Edit] [Split] [Merge]    |  +----------------------------+   |
|                             |                                    |
+-----------------------------+------------------------------------+
| TIMELINE (draggable)                                             |
| |====[1]====|====[2]====|====[3]====|====[4]====|              |
| 00:00       00:03       00:06       00:09                       |
+------------------------------------------------------------------+
```

#### Workflow

- **Auto-segment:** Subtitle cues are auto-generated from the transcript using natural pause detection.
- **Timeline editing:** Drag cue edges on the timeline to adjust start/end times visually.
- **Split/Merge:** Split a long cue into two at cursor position. Merge adjacent cues into one.
- **Format compliance:** Real-time validation against max characters per line and lines per cue.
- **One-click export:** Download as SRT, VTT, or ASS format.

### 3.4 Content Studio UI

#### Layout Structure

```
+------------------------------------------------------------------+
| TABS: [Summary] [Blog] [FAQ] [Social]              [Regenerate]  |
+-----------------------------+------------------------------------+
|                             |                                    |
|  SOURCE TRANSCRIPT          |  GENERATED OUTPUT                  |
|  (left, collapsible)        |  (right, editable)                 |
|  (read-only)                |                                    |
|                             |  ## Summary                        |
|  Highlighted sections       |                                    |
|  show which parts were      |  The meeting covered three main   |
|  used to generate the       |  topics: product launch timeline, |
|  current output.            |  budget allocation, and team      |
|                             |  assignments for Q2...            |
|                             |                                    |
|                             |  [Copy] [Export as DOCX]          |
+-----------------------------+------------------------------------+
```

#### Tab Outputs

| Tab     | Output Format                                    |
|---------|--------------------------------------------------|
| Summary | Concise paragraph summary with key points listed |
| Blog    | Structured blog post with headings and sections  |
| FAQ     | Question-answer pairs extracted from content     |
| Social  | Platform-sized snippets (tweet, LinkedIn post)   |

Each tab has a [Regenerate] button and [Copy] / [Export] buttons.

> **Note on "Regenerate":** At Stage 1 (extractive mode), "Regenerate" re-runs the extraction algorithm with slightly varied parameters (different sentence weighting, length target) to produce an alternative output. It does NOT imply generative AI. When a generative provider is available (Stage 2+), it triggers a full re-generation.

### 3.5 Meeting Intelligence UI

#### Default Overview

```
+------------------------------------------------------------------+
| TABS: [Overview] [Action Items] [Decisions] [Transcript]         |
+------------------------------------------------------------------+
|                                                                  |
|  +----------+  +----------+  +----------+                       |
|  | ACTION   |  | DECISIONS|  | TOPICS   |                       |
|  | ITEMS    |  |          |  |          |                       |
|  |    7     |  |    3     |  |    5     |                       |
|  +----------+  +----------+  +----------+                       |
|                                                                  |
|  MEETING SUMMARY                                                 |
|  The team discussed the Q2 roadmap focusing on three             |
|  initiatives: mobile app launch, API v2 release, and             |
|  enterprise onboarding improvements...                           |
|                                                                  |
|                              [Export Meeting Minutes]             |
+------------------------------------------------------------------+
```

#### Tab Details

- **Action Items:** Table with columns: Task, Assignee, Due Date, Status (open/done). Editable.
- **Decisions:** List with context quote, speaker attribution, and timestamp link.
- **Transcript:** Full transcript with inline markers (colored badges) at points where action items and decisions were extracted.
- **Export:** Generates formatted meeting minutes document (Markdown or DOCX).

### 3.6 Creator Studio UI

#### Layout Structure

```
+------------------------------------------------------------------+
| TABS: [Chapters] [Description] [Tags] [Highlights]              |
+------------------------------------------------------------------+
|                                                                  |
|  CHAPTERS                                                        |
|                                                                  |
|  00:00  Introduction                          [Edit] [Remove]   |
|  02:15  Main Topic: API Design                [Edit] [Remove]   |
|  08:42  Demo Walkthrough                      [Edit] [Remove]   |
|  15:30  Q&A Session                           [Edit] [Remove]   |
|  22:01  Closing Remarks                       [Edit] [Remove]   |
|                                                                  |
|  [+ Add Chapter]                                                |
|                                                                  |
|  PREVIEW (YouTube format):                                       |
|  ----------------------------------------                       |
|  0:00 Introduction                                              |
|  2:15 Main Topic: API Design                                    |
|  8:42 Demo Walkthrough                                          |
|  15:30 Q&A Session                                              |
|  22:01 Closing Remarks                                          |
|  ----------------------------------------                       |
|                                        [Copy to Clipboard]       |
+------------------------------------------------------------------+
```

#### Tab Details

- **Chapters:** Timestamp + title pairs. Editable, reorderable. Preview formatted for YouTube description copy-paste.
- **Description:** Auto-generated video description with summary, chapters, and tags. Editable.
- **Tags:** Extracted keywords displayed as # prefixed tags. Add/remove/edit. Copy all as comma-separated or hashtag format.
- **Highlights:** Key moments with timestamp + quote. Useful for social media clips or show notes.
- **One-click copy:** Each tab has a copy button that formats output for the target platform.

### 3.7 Business Studio UI

#### Layout Structure

```
+------------------------------------------------------------------+
|                                                                  |
|  CALL SUMMARY                                                    |
|  +------------------------------------------------------------+ |
|  | Type: Sales Discovery Call  |  Duration: 23:41             | |
|  | Speakers: 2 (Rep + Client) |  Outcome: Follow-up needed   | |
|  +------------------------------------------------------------+ |
|                                                                  |
|  KEY INFORMATION                                                 |
|  +------------------------------------------------------------+ |
|  | Customer: Jane Smith       | Company: Acme Corp            | |
|  | Pain Points:               | Objections:                   | |
|  |  - Slow onboarding         |  - Price concern              | |
|  |  - Missing integrations    |  - Timeline uncertainty       | |
|  | Interests:                 |                               | |
|  |  - API access              |                               | |
|  |  - Custom branding         |                               | |
|  +------------------------------------------------------------+ |
|                                                                  |
|  FOLLOW-UP ACTIONS                                               |
|  [ ] Send pricing proposal by Friday                            |
|  [ ] Schedule technical demo with engineering                    |
|  [ ] Share API documentation link                               |
|                                                                  |
|  CRM NOTES (copy-ready)                                          |
|  +------------------------------------------------------------+ |
|  | Discovery call with Jane Smith (Acme Corp). Interested in  | |
|  | API access and custom branding. Main objection: pricing.   | |
|  | Next step: send proposal by EOW.                           | |
|  +------------------------------------------------------------+ |
|  [Copy Notes] [Export]                                           |
|                                                                  |
+------------------------------------------------------------------+
```

All fields are editable before export. The platform extracts initial values from the transcript but the user can correct or add information.

### 3.8 Export Center UI

#### Step-by-Step Export Flow

```
+------------------------------------------------------------------+
|  EXPORT CENTER                                                   |
+------------------------------------------------------------------+
|                                                                  |
|  STEP 1: Select What to Export                                   |
|  [x] Transcript    [x] Subtitles    [ ] Summary                |
|  [ ] Meeting Notes [ ] All Outputs                              |
|                                                                  |
|  STEP 2: Select Format                                           |
|  [TXT] [MD] [DOCX] [PDF] [SRT] [VTT] [CSV] [JSON]             |
|   (active chips highlighted; unavailable ones grayed out)        |
|                                                                  |
|  STEP 3: Options                                                 |
|  [x] Include timestamps                                        |
|  [x] Include speaker labels                                    |
|  [ ] Include confidence scores                                  |
|                                                                  |
|  +-------------------------------+                               |
|  |    [Download Selected]        |  [Copy to Clipboard]         |
|  +-------------------------------+                               |
|                                                                  |
+------------------------------------------------------------------+
```

- Format chips are contextually enabled (SRT/VTT only available when subtitles are selected).
- "All Outputs" checkbox selects everything with a bundled ZIP download.
- Quick export shortcut is available from every module toolbar via an [Export] button that opens a pre-filled Export Center with the current module's output selected.

#### Export Format Availability Matrix

| Output selected | TXT | MD | DOCX | PDF | SRT | VTT | CSV | JSON |
|-----------------|-----|----|------|-----|-----|-----|-----|------|
| Transcript      | ✓   | ✓  | ✓    | ✓   | ✗   | ✗   | ✗   | ✓    |
| Subtitles       | ✗   | ✗  | ✗    | ✗   | ✓   | ✓   | ✗   | ✓    |
| Summary         | ✓   | ✓  | ✓    | ✓   | ✗   | ✗   | ✗   | ✓    |
| Meeting Notes   | ✓   | ✓  | ✓    | ✓   | ✗   | ✗   | ✓   | ✓    |
| Action Items    | ✓   | ✓  | ✓    | ✗   | ✗   | ✗   | ✓   | ✓    |
| All Outputs     | ZIP bundle containing all available formats                    |

### 3.9 Module Degraded & Error States

When a module cannot fully function (e.g. engine lacks diarization, text-intelligence fails, or capability is unavailable at Stage 1), the UI must handle this gracefully instead of showing a broken or empty view.

#### Degraded State Design

```
+------------------------------------------------------------------+
|                                                                  |
|  [Info icon]  Limited functionality available                    |
|                                                                  |
|  [Explanation of what's limited and why]                         |
|  "Speaker detection is not available with the current engine.    |
|   Meeting notes will show content without speaker attribution."  |
|                                                                  |
|  [Continue anyway]              [Learn more]                     |
|                                                                  |
+------------------------------------------------------------------+
```

#### Per-Module Degraded States

| Module | Degraded condition | UI behavior |
|--------|-------------------|-------------|
| Meeting Intelligence | Diarization unavailable | Show all content as single speaker; info banner: "Speaker detection unavailable — all content shown as one participant" |
| Meeting Intelligence | Text-intelligence failed | Show raw transcript segments; skip action-items/decisions extraction; offer manual entry |
| Content Studio | Extractive algo produces low-quality output | Show output with a "Quality: Basic" badge; suggest uploading clearer audio |
| Content Studio | Text-intelligence provider unavailable | Show transcript with manual copy; disable Summary/Blog/FAQ tabs with tooltip: "This feature requires a text-processing engine" |
| Creator Studio | No clear topic boundaries detected | Show single chapter "Full Recording"; allow manual chapter creation |
| Business Studio | Cannot extract structured info | Show raw transcript + empty editable fields for user to fill manually |
| Subtitle Studio | No word-level timestamps from engine | Generate subtitles at segment-level (less precise); info banner: "Timing is approximate" |

#### Error State Design (processing failure)

```
+------------------------------------------------------------------+
|                                                                  |
|  [Warning icon - red]                                            |
|                                                                  |
|  Processing failed for this module                               |
|                                                                  |
|  "Summary generation encountered an error. Your transcript       |
|   is still available in Transcript Studio."                      |
|                                                                  |
|  [Retry]   [Go to Transcript]   [Report issue]                  |
|                                                                  |
+------------------------------------------------------------------+
```

**Rules:**
- Never show a completely blank/broken screen. Always provide context + next action.
- Transcript (core output) is always available even if downstream modules fail.
- "Retry" attempts the processor again. "Go to Transcript" navigates to the reliable fallback.

### 3.10 Keyboard Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `Space` | Play / Pause audio | Transcript Studio, Subtitle Studio |
| `Ctrl/Cmd + F` | Open Find | Transcript Studio |
| `Ctrl/Cmd + H` | Open Find & Replace | Transcript Studio |
| `Ctrl/Cmd + E` | Quick Export (current module output) | Any module |
| `Ctrl/Cmd + S` | Download/Save current output | Any module |
| `Ctrl/Cmd + 1-8` | Switch to module 1-8 | Global |
| `[` / `]` | Previous / Next subtitle cue | Subtitle Studio |
| `Escape` | Close overlay / exit edit mode | Global |
| `Ctrl/Cmd + Shift + D` | Toggle dark/light theme | Global |

Shortcuts are displayed in tooltips and in a "Keyboard shortcuts" help modal (accessible via `?` key).

---

## 4. Mobile UI Strategy

### 4.1 Responsive Breakpoints

| Breakpoint   | Range          | Layout Mode                                  |
|--------------|----------------|----------------------------------------------|
| Mobile       | < 768px        | Single column, hamburger nav, bottom tabs     |
| Tablet       | 768px - 1024px | Sidebar overlay, single panel workspace       |
| Desktop      | 1024px+        | Full layout with sidebar + right panel        |

### 4.2 Mobile Navigation

- **Sidebar:** Transforms into a hamburger menu (top-left icon). Opens as a slide-in overlay from the left with backdrop dimming.
- **Bottom Tab Bar:** Persistent bottom bar with the top 5 modules for quick access: Speech Engine, Transcript, Subtitles, Content, Export. Icons + short labels.
- **Switching modules:** Bottom tab for frequent modules; hamburger for all modules and settings.

```
MOBILE LAYOUT:
+---------------------------+
| [=] SQUICKY    [Private]  |  <- Simplified header
+---------------------------+
|                           |
|     MAIN CONTENT          |
|     (full width)          |
|     (scrollable)          |
|                           |
|                           |
+---------------------------+
| [Mic] [Doc] [Sub] [Pen] [DL]|  <- Bottom tab bar (56px)
+---------------------------+
```

### 4.3 Mobile Upload

- Upload zone fills the full screen width with generous padding.
- Larger touch targets for buttons (minimum 48px height).
- [Record] button is prominently sized since mobile recording is a primary use case.
- Simplified processing states (no multi-stage labels, just a progress indicator).
- File picker uses the native OS file selector.

### 4.4 Mobile Editor (Transcript Studio)

- Single-column layout. Info panel becomes a slide-up bottom sheet (triggered by an info icon in toolbar).
- Audio player bar remains fixed at the bottom, above the tab bar.
- Transcript is the full-width scrollable content.
- Toolbar actions overflow into a "more" menu (three dots) since horizontal space is limited.
- Edit mode: tapping a segment enters inline edit. Keyboard pushes content up.

### 4.5 Touch Optimizations

| Requirement            | Specification                                           |
|------------------------|---------------------------------------------------------|
| Minimum tap target     | 44px x 44px (WCAG 2.5.5 enhanced)                      |
| Swipe gestures         | Swipe right = back/navigate. Swipe down = dismiss.      |
| Pull-to-refresh        | On job status screens, pull down to check progress.     |
| Long press             | Context menu on transcript segments (copy, edit, mark). |
| Pinch zoom             | Disabled on transcript (text scales via font settings). |

### 4.6 Mobile Limitations Disclosure

- Web Speech API works on mobile Chrome and Safari with streaming results.
- WASM-based STT models are significantly heavier on mobile devices (memory and CPU). The UI should display a note: "Processing may be slower on mobile devices."
- Large files (60+ minutes) may exceed mobile browser memory limits. Display a warning for files over 30 minutes on mobile.

---

## 5. Design System

### 5.1 Color Palette

#### Primary Colors

| Token              | Value   | Usage                                       |
|--------------------|---------|---------------------------------------------|
| `--color-primary`  | #1a1a2e | Deep navy. Main backgrounds (dark), text.    |
| `--color-accent`   | #00d4aa | Vibrant teal. CTAs, active states, links.    |
| `--color-accent-hover` | #00b894 | Darker teal for hover states.           |

#### Neutral Scale

| Token                  | Value   | Usage                              |
|------------------------|---------|------------------------------------|
| `--neutral-50`         | #f8f9fa | Lightest background                |
| `--neutral-100`        | #f1f3f5 | Card backgrounds (light mode)      |
| `--neutral-200`        | #e9ecef | Borders, dividers                  |
| `--neutral-300`        | #dee2e6 | Disabled backgrounds               |
| `--neutral-400`        | #adb5bd | Placeholder text                   |
| `--neutral-500`        | #6c757d | Secondary text                     |
| `--neutral-600`        | #495057 | Body text (light mode)             |
| `--neutral-700`        | #343a40 | Headings (light mode)              |
| `--neutral-800`        | #212529 | High emphasis text                 |
| `--neutral-900`        | #1a1a2e | Darkest, matches primary           |

#### Semantic Colors

| Token                | Value   | Usage                                    |
|----------------------|---------|------------------------------------------|
| `--color-success`    | #22c55e | Success states, completion indicators    |
| `--color-warning`    | #f59e0b | Warnings, rate limiting, caution         |
| `--color-error`      | #ef4444 | Errors, destructive actions, validation  |
| `--color-info`       | #3b82f6 | Informational badges, tips               |
| `--color-privacy`    | #10b981 | Privacy indicator specific green         |

#### Dark Mode Strategy

- Backgrounds invert: `--neutral-50` becomes `#0f0f1a`, surfaces become `#1a1a2e`
- Text inverts: `--neutral-800` becomes `#e9ecef`
- Accent is slightly muted in dark mode: `#00d4aa` to `#00c49a` (less eye strain)
- Semantic colors remain unchanged (already designed for both modes)
- Borders become lighter opacity against dark backgrounds: `rgba(255,255,255,0.1)`

### 5.2 Typography

#### Font Stack

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
```

#### Type Scale

| Token        | Size  | Weight | Line Height | Usage                        |
|--------------|-------|--------|-------------|------------------------------|
| `--text-xs`  | 12px  | 400    | 1.5         | Captions, timestamps, badges |
| `--text-sm`  | 14px  | 400    | 1.5         | Secondary text, labels       |
| `--text-base`| 16px  | 400    | 1.5         | Body text, paragraphs        |
| `--text-lg`  | 18px  | 500    | 1.4         | Subtitles, emphasis          |
| `--text-xl`  | 24px  | 600    | 1.2         | Section headings (h3)        |
| `--text-2xl` | 32px  | 700    | 1.2         | Page headings (h2)           |
| `--text-3xl` | 40px  | 700    | 1.1         | Hero headings (h1)           |

#### Font Weights

| Weight | Name      | Usage                                |
|--------|-----------|--------------------------------------|
| 400    | Regular   | Body text, descriptions              |
| 500    | Medium    | Labels, nav items, subtle emphasis   |
| 600    | Semibold  | Subheadings, button text, active nav |
| 700    | Bold      | Page titles, strong emphasis         |

#### Monospace Usage

JetBrains Mono is used for: timestamps (`[00:00:15]`), confidence scores, JSON export previews, and code-like interface elements.

### 5.3 Buttons

#### Variants

| Variant   | Background     | Border         | Text Color    | Use Case                |
|-----------|----------------|----------------|---------------|-------------------------|
| Primary   | `--color-accent` | None          | White         | Main CTAs, submit       |
| Secondary | Transparent    | `--neutral-300`| `--neutral-700`| Secondary actions      |
| Ghost     | Transparent    | None           | `--neutral-600`| Tertiary, toolbar      |
| Danger    | `--color-error`| None           | White         | Delete, destructive     |

#### Sizes

| Size | Height | Padding (h)  | Font Size | Border Radius |
|------|--------|--------------|-----------|---------------|
| sm   | 32px   | 12px         | 13px      | 6px           |
| md   | 40px   | 16px         | 14px      | 8px           |
| lg   | 48px   | 24px         | 16px      | 8px           |

#### States

| State    | Visual Change                                     |
|----------|---------------------------------------------------|
| Default  | Base appearance                                   |
| Hover    | Background darkens 10%, subtle shadow             |
| Active   | Background darkens 15%, scale(0.98)               |
| Disabled | Opacity 0.5, cursor not-allowed                   |
| Loading  | Spinner icon replaces text, width preserved        |

### 5.4 Inputs

- **Border radius:** 8px (rounded-lg), matching button radius.
- **Border:** 1px solid `--neutral-300`. On focus: 2px solid `--color-accent` with a subtle box-shadow ring.
- **Label:** Positioned above the input, 14px medium weight.
- **Helper text:** Below input, 12px, `--neutral-500` color.
- **Error state:** Border becomes `--color-error`, helper text turns red and shows error message.
- **Sizes:** Match button sizes (sm: 32px, md: 40px, lg: 48px height).

### 5.5 Cards

| Property      | Value                                              |
|---------------|----------------------------------------------------|
| Border radius | 12-16px (rounded-xl)                              |
| Shadow (light)| `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)` |
| Shadow (dark) | `0 1px 3px rgba(0,0,0,0.3)`                       |
| Background    | White (light) / `#1e1e32` (dark)                   |
| Padding       | 16px (compact) or 24px (standard)                  |
| Hover (interactive) | Shadow increases, translateY(-1px)           |

Cards support optional header (with title + action), body, and footer sections. Used for: stat cards, module summaries, upload results, settings groups.

### 5.6 Tables

- Container has rounded-xl corners with overflow hidden.
- Header row has a slightly darker background (`--neutral-100` light / `--neutral-800` dark).
- Body rows alternate with subtle background difference for readability.
- Header is sticky on vertical scroll.
- On horizontal overflow (mobile): container scrolls horizontally with a fade indicator on the edge.

### 5.7 Alerts and Toasts

#### Alerts (Inline)

```
+------------------------------------------------------------------+
| [color bar] [icon]  Alert message text here.        [Action] [X] |
+------------------------------------------------------------------+
```

- Left color bar (4px) uses semantic color.
- Rounded-lg container, subtle background tint matching semantic color at 10% opacity.
- Optional action button (text button) and dismiss X.

#### Toasts (Floating)

- Position: top-right corner, stacked vertically.
- Slide-in animation from right.
- Auto-dismiss after 5 seconds (configurable).
- Manual dismiss via X button.
- Max 3 visible at once; older ones are queued.

### 5.8 Empty States

Each module has a custom empty state displayed when no content is available:

| Module              | Icon/Illustration | Headline                    | Action Button      |
|---------------------|-------------------|-----------------------------|-------------------|
| Transcript Studio   | Document + ?      | "No transcript yet"         | Upload Audio       |
| Subtitle Studio     | Text + clock      | "No subtitles generated"    | Go to Transcript   |
| Content Studio      | Pen + sparkle     | "No content generated"      | Generate from...   |
| Meeting Intelligence| People + clipboard| "No meeting analyzed"       | Upload Recording   |
| Creator Studio      | Video + chapters  | "No creator content"        | Start from Audio   |
| Business Studio     | Briefcase + notes | "No call analyzed"          | Upload Call        |

Design: Centered vertically and horizontally. Icon (48px, muted), headline (18px, medium), description (14px, secondary text), primary action button below.

### 5.9 Loading States

| Context              | Loading Pattern                                    |
|----------------------|----------------------------------------------------|
| Page/module load     | Skeleton screens (gray pulsing blocks)             |
| Button action        | Inline spinner replaces button text                |
| File upload          | Linear progress bar with percentage                |
| Audio processing     | Animated waveform (bars rising and falling)        |
| Data fetching        | Skeleton matching the expected content shape       |
| Transcript streaming | Text appearing word-by-word with cursor blink      |

Skeleton screens mimic the final layout shape so the transition to loaded content feels seamless.

### 5.10 Animation & Transition Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-instant` | 100ms | Tooltips, focus rings |
| `--duration-fast` | 150ms | Button state changes, toggles |
| `--duration-normal` | 250ms | Panel collapse/expand, tab switch |
| `--duration-slow` | 350ms | Page transitions, drawer open/close |
| `--easing-default` | `cubic-bezier(0.4, 0, 0.2, 1)` | General purpose |
| `--easing-enter` | `cubic-bezier(0, 0, 0.2, 1)` | Elements entering (slide-in) |
| `--easing-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Elements leaving (slide-out) |

**Rules:**
- All transitions use these tokens — no hardcoded durations in component CSS.
- When `prefers-reduced-motion` is active, all durations become `0ms` (instant).
- Sidebar collapse: `--duration-normal` + `--easing-default`.
- Card hover lift: `--duration-fast` + `--easing-default`.
- Toast slide-in: `--duration-normal` + `--easing-enter`.
- Modal backdrop fade: `--duration-slow` + `--easing-default`.

### 5.11 Dark Mode Component Specifics

| Component | Light mode | Dark mode |
|-----------|-----------|-----------|
| Sidebar | `--neutral-50` bg, `--neutral-700` text | `#12121f` bg, `--neutral-200` text |
| Cards | White bg, light shadow | `#1e1e32` bg, darker shadow (rgba(0,0,0,0.3)) |
| Inputs | White bg, `--neutral-300` border | `#1a1a2e` bg, `rgba(255,255,255,0.15)` border |
| Header | White bg, bottom border `--neutral-200` | `#0f0f1a` bg, bottom border `rgba(255,255,255,0.08)` |
| Toolbar | `--neutral-50` bg | `#16162a` bg |
| Upload zone | Dashed `--neutral-300` border, `--neutral-50` bg | Dashed `rgba(255,255,255,0.15)` border, `#12121f` bg |
| Active nav item | `--color-accent` at 10% opacity bg | `--color-accent` at 15% opacity bg |
| Code/timestamp | `--neutral-100` bg, monospace | `#1a1a2e` bg, monospace |

**Theme transition:** switching themes applies a `--duration-slow` full-page transition to prevent jarring flashes.

---

## 6. Component Library Structure

### 6.1 Directory Organization

```
shared/components/
├── layout/
│   ├── AppShell          # Root layout wrapper (header + sidebar + content + footer)
│   ├── Sidebar           # Collapsible sidebar with module groups
│   ├── Header            # Fixed header with search, privacy, theme
│   ├── Footer            # Minimal footer with status info
│   └── Panel             # Collapsible right panel (contextual)
│
├── navigation/
│   ├── NavItem           # Single navigation item (icon + label + badge)
│   ├── NavGroup          # Collapsible group of NavItems with header
│   ├── Breadcrumb        # Breadcrumb trail for deep navigation
│   └── Tabs              # Horizontal tab bar with active indicator
│
├── feedback/
│   ├── Alert             # Inline alert with semantic colors
│   ├── Toast             # Floating notification (auto-dismiss)
│   ├── Progress          # Linear and circular progress indicators
│   ├── Skeleton          # Placeholder loading shapes
│   ├── Spinner           # Inline spinning indicator
│   └── EmptyState        # Centered empty state with CTA
│
├── forms/
│   ├── Input             # Text input with label, helper, error
│   ├── Select            # Dropdown select with search
│   ├── Checkbox          # Checkbox with label
│   ├── Toggle            # On/off toggle switch
│   ├── FileUpload        # Drag-and-drop file upload zone
│   └── SearchBar         # Search input with icon and clear button
│
├── data-display/
│   ├── Card              # Container card with header/body/footer
│   ├── Table             # Data table with sorting and scroll
│   ├── Badge             # Small status badge (colored dot + text)
│   ├── Tag               # Removable tag/chip element
│   ├── Stat              # Stat card (number + label + trend)
│   └── Timeline          # Vertical timeline (processing steps)
│
├── media/
│   ├── AudioPlayer       # Full audio player with controls
│   ├── Waveform          # Audio waveform visualization
│   └── VideoPreview      # Video thumbnail with play overlay
│
├── overlay/
│   ├── Modal             # Centered modal with backdrop
│   ├── Drawer            # Slide-in panel (left/right)
│   ├── BottomSheet       # Mobile bottom sheet (draggable)
│   ├── Tooltip           # Hover/focus tooltip
│   └── Dropdown          # Positioned dropdown menu
│
├── typography/
│   ├── Heading           # h1-h6 with consistent styling
│   ├── Text              # Body text with size/weight variants
│   ├── Code              # Inline and block code display
│   └── Timestamp         # Formatted timestamp display (monospace)
│
└── brand/
    ├── Logo              # Squicky logo (full and icon variants)
    ├── PrivacyBadge      # Green shield + "Private" indicator
    └── ThemeToggle       # Light/dark mode switch with icons
```

### 6.2 Component Design Principles

| Principle         | Implementation                                            |
|-------------------|-----------------------------------------------------------|
| Self-contained    | Each component owns its styles and logic. No global CSS leakage. |
| Prop-driven       | Behavior and appearance controlled via props/attributes.  |
| Theme-aware       | Components read from CSS custom properties. Theme changes propagate automatically. |
| Accessible        | ARIA attributes, keyboard handling, and focus management built-in. |
| Composable        | Small primitives compose into larger patterns. Avoid monolithic components. |
| Responsive        | Components adapt to container width. No fixed-width assumptions. |

### 6.3 Storybook Readiness

Each component should be structured to support future Storybook documentation:

- Default story showing standard usage
- Variants story showing all visual options
- States story showing interactive states (hover, focus, disabled, loading)
- Responsive story showing behavior at different container widths
- Accessibility story demonstrating keyboard and screen reader interaction

---

## 7. Accessibility Plan

### 7.1 Keyboard Navigation

| Requirement           | Implementation                                          |
|-----------------------|---------------------------------------------------------|
| All interactive elements focusable | Use native HTML elements or tabindex="0"   |
| Logical tab order     | DOM order matches visual order. No tabindex > 0.        |
| Visible focus ring    | 2px outline in `--color-accent`, 2px offset. Never hidden.|
| Escape to close       | All overlays (modals, dropdowns, drawers) close on Escape.|
| Arrow keys in lists   | Sidebar items, dropdown options, table rows navigable.  |
| Enter/Space to activate | Buttons, links, toggles respond to both keys.         |
| Skip links            | "Skip to main content" link visible on first Tab.       |

### 7.2 Screen Reader Support

| Requirement              | Implementation                                      |
|--------------------------|-----------------------------------------------------|
| Semantic HTML            | Use `<nav>`, `<main>`, `<aside>`, `<header>`, `<footer>` landmarks. |
| Heading hierarchy        | Single h1 per page, logical h2-h6 nesting.          |
| ARIA labels              | All icon-only buttons have `aria-label`.             |
| Live regions             | Processing status updates use `aria-live="polite"`.  |
| Toast announcements      | Toasts inject into an `aria-live="assertive"` region.|
| Alt text                 | All meaningful images/icons have descriptive alt text.|
| Form labels              | Every input has an associated `<label>` or `aria-labelledby`.|
| Table structure          | Tables use `<th>` with scope, `<caption>` where appropriate.|

### 7.3 Visual Accessibility

| Standard              | Target                                               |
|-----------------------|------------------------------------------------------|
| Text contrast (normal)| 4.5:1 minimum (WCAG AA)                             |
| Text contrast (large) | 3:1 minimum (WCAG AA)                               |
| Non-text contrast     | 3:1 for UI components and graphical objects          |
| Color not sole indicator | Always pair color with icon, text, or pattern     |
| Large text mode       | Use rem/em units. Test at browser 200% zoom.         |
| High contrast mode    | Respect `prefers-contrast` media query.              |

### 7.4 Motion and Animation

- Respect `prefers-reduced-motion` media query globally.
- When reduced motion is preferred: disable all non-essential animations, transitions become instant, loading spinners become static indicators, waveform animations become static bars.
- Essential motion (e.g., progress bar filling) is preserved but simplified.

### 7.5 Testing Strategy

| Method                | Frequency        | Tool/Approach                       |
|-----------------------|------------------|-------------------------------------|
| Automated audit       | Every CI build   | axe-core integrated in test suite   |
| Keyboard-only testing | Per module launch | Manual QA: complete each flow by keyboard only |
| Screen reader testing | Per major release | NVDA (Windows), VoiceOver (macOS/iOS) |
| Color contrast check  | Per design change | Contrast checker plugin in dev tools |
| Zoom testing          | Per layout change | Test at 100%, 150%, 200% browser zoom |

---

## 8. Future Expansion Strategy

### 8.1 Adding New Modules

Adding a new module to the platform follows a standardized process:

1. **Sidebar entry:** Add a new NavItem to the appropriate group (CORE, STUDIOS, or a new group). Define icon, label, and route.
2. **Route registration:** Register a new top-level route (e.g., `/new-module`) in the router config.
3. **Component composition:** Build the module UI using existing shared components (Card, Table, Tabs, etc.). No new primitives should be needed for most modules.
4. **Right panel content:** Define what contextual information appears in the right panel for this module (via a slot/provider pattern).
5. **Empty state:** Design a module-specific empty state with an appropriate icon, message, and call-to-action.
6. **Export integration:** Register the module's output types with the Export Center.

### 8.2 Sidebar Scaling (20+ Modules)

| Mechanism           | Trigger                    | Behavior                              |
|---------------------|----------------------------|---------------------------------------|
| Group collapse      | Click group header         | Hides all items in group, shows count |
| Scroll              | Content exceeds viewport   | Internal scroll with subtle scrollbar |
| Pin to top          | User right-click "Pin"     | Module floats above groups            |
| Search filter       | 10+ modules installed      | Filter input appears at sidebar top   |
| "More" section      | 15+ modules visible        | Less-used modules collapse into More  |
| Module reordering   | User drag-and-drop         | Custom order persisted in localStorage|

### 8.3 Design Token Architecture

All visual values are defined as CSS custom properties (design tokens). This enables:

```css
/* Example token structure */
:root {
  /* Color tokens */
  --color-primary: #1a1a2e;
  --color-accent: #00d4aa;
  
  /* Spacing tokens */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  
  /* Radius tokens */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  
  /* Shadow tokens */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
}

/* Dark mode override */
[data-theme="dark"] {
  --color-primary: #0f0f1a;
  --color-accent: #00c49a;
  /* ... */
}
```

**One change propagates everywhere.** Updating a token value updates every component that references it.

### 8.4 Component Library Independence

The component library is module-agnostic by design:

- Components do not import from or reference any specific module.
- Modules compose their UI entirely from shared primitives.
- If a module needs a unique component, it lives in the module's own directory (not in shared).
- Shared components are promoted from module-specific ones only when reuse is identified.

### 8.5 Right Panel Extensibility

The right panel is a contextual container. Each module defines its own panel content:

- Transcript Studio: file info, stats, available outputs
- Subtitle Studio: format settings, export options
- Content Studio: source mapping, generation settings
- Meeting Intelligence: participant list, topic timeline
- New modules: register a panel component via a provider/slot pattern

When a module does not define panel content, the right panel is hidden (collapsed to 0px).

**Right Panel auto-show/hide rules:**

| Trigger | Panel behavior |
|---------|----------------|
| Transcript ready (first time) | Auto-opens to show file info + available outputs |
| User manually collapses | Stays collapsed (state saved to localStorage) |
| Switch to a module with panel content | Opens if not manually collapsed |
| Switch to a module without panel content | Hides (0px) |
| Mobile / tablet breakpoint | Never auto-opens; available via swipe-left or info icon |
| Export Center active | Hides (Export Center is full-width workflow) |

### 8.6 Theme Extensibility

Adding a new theme variant (e.g., high-contrast, brand-specific):

1. Define a new set of token overrides in a `[data-theme="new-theme"]` selector.
2. Add the option to the ThemeToggle component.
3. All components adapt automatically through token references.

Adding a new brand color:

1. Add one token (e.g., `--color-brand-new: #value`).
2. Reference it where needed. No component changes required.

### 8.7 Module UI Starter Template

New modules should launch with a consistent structure:

```
modules/[module-name]/
├── index.ts              # Module route registration
├── ModulePage.tsx        # Root page component
├── components/           # Module-specific components
│   ├── ModuleToolbar.tsx # Standard toolbar layout
│   └── ModuleContent.tsx # Main content area
├── hooks/                # Module-specific state/logic
└── types.ts              # Module-specific type definitions
```

Every new module page includes:
- A toolbar (using shared Tabs + Button components)
- A main content area (using shared Card + Table components)
- An empty state (using shared EmptyState component)
- Right panel content definition
- Export Center integration hook

---

## Document Summary

This design system provides the complete visual and interaction blueprint for the Squicky Speech Intelligence Platform. It covers:

- **Layout:** Fixed-frame architecture with collapsible panels
- **Navigation:** Hierarchical sidebar with group-based scaling
- **User Flows:** Detailed state machines for every module interaction
- **Mobile:** Progressive adaptation from 1440px desktop to 320px mobile
- **Design Tokens:** Comprehensive color, typography, spacing, and component specs
- **Components:** 35+ shared primitives organized by category
- **Accessibility:** WCAG AA compliance with automated and manual testing
- **Expansion:** Systematic patterns for growing from 8 to 20+ modules

All specifications are implementation-ready. Developers should reference this document alongside the Master Architecture Document when building the platform frontend.

---

*End of UI/UX Design System Blueprint*
