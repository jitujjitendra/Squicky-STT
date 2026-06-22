# Squicky Speech Intelligence Platform (SSIP)

## Transcript Studio Module — Architecture Document

> **Status:** Module Design Phase — No code yet.
> **Author role:** Lead Product Architect / Chief Experience Architect.
> **Prerequisites:** Master Architecture (approved), UI/UX Design System (approved), Speech Engine Module (approved).
> **Purpose:** Complete architectural blueprint for the Transcript Studio module — the central workspace that users interact with after transcription.

---

## Table of Contents

1. [Transcript Studio Architecture](#1-transcript-studio-architecture)
2. [UI Layout](#2-ui-layout)
3. [Editing Workflow](#3-editing-workflow)
4. [Speaker Management System](#4-speaker-management-system)
5. [Timestamp System](#5-timestamp-system)
6. [Search & Navigation System](#6-search--navigation-system)
7. [Playback Integration Strategy](#7-playback-integration-strategy)
8. [Session Management Strategy](#8-session-management-strategy)
9. [Accessibility Plan](#9-accessibility-plan)
10. [Future Upgrade Roadmap](#10-future-upgrade-roadmap)

---

## Critical Context from Approved Speech Engine Module

The Speech Engine produces a `StandardTranscript` with these key design decisions that Transcript Studio MUST respect:

1. **Segment IDs are stable UUIDs** (e.g. `"seg_a1b2c3d4"`), NOT sequential integers. Use for referencing.
2. **`sequence_index`** (0-based) is for ordering/display.
3. **Dual text fields:** `text` (immutable original from engine) and `text_display` (user-facing, may be transliterated). Transcript Studio shows `text_display` but preserves `text` for undo/NLP.
4. **Speaker identity via indirection:** segments have `speaker_id` referencing `speakers.entries[{id, label, display_name}]`. Rename = update `display_name` in entries, segments untouched. Resolve: `display_name ?? label`.
5. **Optional fields:** `words[]` (word-level timestamps), `speaker_id`, `confidence` — may be null. UI must handle gracefully.
6. **`quality_score`/`quality_label`** in transcription_meta — if "poor", show warning prominently.
7. **`is_partial` flag** — some segments may be missing (show gaps).
8. **`punctuation_restored` flag** — if false, text may lack proper punctuation.
9. **`topic_boundary_hint`** on segments — can be used for visual separation.
10. **`live_origin` flag** — if true, no word timestamps, approximate timing, offer "Reprocess for better quality".

---

## 1. Transcript Studio Architecture

### 1.1 Module Role

- Central workspace of the entire platform
- First thing user sees after transcription completes
- Hub that connects to ALL other modules (Export, Subtitle, Content, Meeting, Creator, Business)
- Where users spend most time — must be fast, professional, intuitive

### 1.2 Data Flow

```
Speech Engine --> StandardTranscript (JSON) --> Transcript Studio (loads into local state)
                                                        |
                                              User edits (local state only)
                                                        |
                                              Export / Send to other modules
```

- Studio receives the StandardTranscript from the short-TTL store (via job_id polling)
- All edits happen in LOCAL browser state (no server round-trips for editing)
- Edited transcript can be sent to other modules or exported
- Original `text` field preserved for undo; edits modify `text_display` and a local `user_edits` layer

### 1.3 State Architecture

- **Source layer:** original StandardTranscript (immutable, from engine)
- **Edit layer:** user modifications (overlaid on source, stored in browser state)
- **Display layer:** what user sees (edit layer merged with source; respects transliteration preference)
- Undo/Redo operates on the edit layer only
- "Reset to original" = discard edit layer

### 1.4 Integration Points

| Destination Module | What's Sent | Trigger |
|---|---|---|
| Export Center | Full edited transcript (source + edits merged) | User clicks Export |
| Subtitle Studio | Segments with timestamps + words (edited version) | User clicks "Generate Subtitles" |
| Content Studio | Segments text (edited, original script for NLP) | User clicks "Generate Content" |
| Meeting Intelligence | Segments + speaker_ids + speakers.entries | User clicks "Analyze Meeting" |
| Creator Studio | Segments + timestamps + full_text | User clicks "Creator Tools" |
| Business Studio | Segments + speakers + full_text | User clicks "Business Analysis" |

### 1.5 Merged Output Schema (What Other Modules Receive)

When Transcript Studio sends data to another module, it produces a **Merged StandardTranscript** — a valid StandardTranscript with user edits applied:

```json
{
  "schema_version": "1.1.0",
  "id": "new-uuid-for-merged-doc",
  "created_at": "...",
  "editing_meta": {
    "edited_at": "ISO-8601",
    "source_transcript_id": "original-engine-output-id",
    "segments_modified": 5,
    "segments_split": 2,
    "segments_merged": 1,
    "segments_deleted": 0
  },
  "transcript": {
    "segments": [
      {
        "id": "seg_abc",
        "sequence_index": 0,
        "text": "user's final edited text (what they see)",
        "text_original": "immutable engine output (Devanagari/original script)",
        "text_display": "same as text (user's version IS the display now)",
        "user_edited": true,
        "speaker_id": "spk_001",
        "...": "all other fields preserved"
      }
    ]
  }
}
```

**Key rules:**
- The merged output IS a valid StandardTranscript (same `schema_version`)
- New top-level `id` (UUID) generated for the merged document
- `editing_meta` added (new optional block — additive, non-breaking)
- Split segments get new UUIDs; merged segments use first segment's ID
- `sequence_index` recalculated 0-based
- `transcription_meta` preserved from original (engine info unchanged)

**Field resolution in merged output:**

| Field | Value in merged output | Rationale |
|-------|----------------------|-----------|
| `text` | User's edited version (their final corrected text) | This is the user-verified, authoritative content |
| `text_original` | Immutable engine output (never changes) | For NLP reference, original script access, undo reference |
| `text_display` | Same as `text` in merged output | After merge, user's edit IS the display |
| `user_edited` | `true` if user modified this segment, `false` if untouched | Downstream modules know which segments are human-verified |
| `speaker_id` | May differ from original (if user reassigned) | User corrections override engine diarization |

**How each module uses these fields:**

| Module | Uses `text` (user-edited) | Uses `text_original` (engine) | Uses `user_edited` flag |
|--------|--------------------------|-------------------------------|------------------------|
| Export Center | ✅ Exports user's version | Optional (include original as comparison) | ❌ |
| Subtitle Studio | ✅ Subtitle text from user's version | ❌ | ✅ Trust user-edited timing more |
| Content Studio | For user-edited segments: ✅ (trusted) | For unedited segments: ✅ (NLP on original script) | ✅ Decides which text to use for NLP |
| Meeting Intelligence | ✅ Action items from user's version | ❌ | ✅ Higher confidence on edited segments |
| Creator Studio | ✅ Chapter titles from user's version | ❌ | ❌ |
| Business Studio | ✅ CRM notes from user's version | ❌ | ❌ |

**Content Studio special logic:** For NLP tasks (summarization, extraction), Content Studio checks per segment: if `user_edited == true`, use `text` (user verified it — higher trust). If `user_edited == false`, use `text_original` (engine output in original script — better for NLP models trained on Devanagari/English). This gives the best quality: human corrections where available, engine's native script where not.

---

## 2. UI Layout

### 2.1 Desktop Layout

```
+------------------------------------------------------------------+
| TOOLBAR                                                          |
| [Play/Pause] [Speed] [Timestamps] [Speakers] [Find] [Replace]   |
| [Language/Script] [Quality badge] [Export] [Send to... v]        |
+------------------------------------------------------------------+
| TRANSCRIPT EDITOR (left ~65%)         | INFO PANEL (right ~35%)  |
|                                       |                          |
| [topic boundary marker]               | FILE INFO                |
| -----------------------------------   | Duration: 12:34          |
| [00:00:15] Speaker 1 (Rahul)         | Language: Hi+En          |
| Hello everyone, aaj hum discuss      | Speakers: 2              |
| karenge product roadmap ke           | Words: 2,847             |
| baare mein.                          | Segments: 42             |
|                                       | Confidence: 87%          |
| [00:00:32] Speaker 2 (Priya)         | Quality: Good *          |
| Thanks Rahul. Main pehle            |                          |
| budget pe baat karti hu.             | ------------------------ |
|                                       | SPEAKERS                 |
| [confidence highlight on "karti"]    | * Rahul (Speaker 1)     |
|                                       |   Speaking: 8:20         |
| (scrollable, editable)               | * Priya (Speaker 2)      |
|                                       |   Speaking: 4:14         |
|                                       |                          |
|                                       | ------------------------ |
|                                       | ACTIONS                  |
|                                       | [Subtitles]             |
|                                       | [Summary]               |
|                                       | [Meeting Notes]         |
|                                       | [Export]                |
+---------------------------------------+--------------------------+
| AUDIO PLAYER BAR (fixed bottom)                                  |
| [<<] [>] [>>] [1x v] ====|===waveform=====  03:21/12:34 [Vol]  |
+------------------------------------------------------------------+
```

### 2.2 Layout Regions

| Region | Content | Behavior |
|--------|---------|----------|
| Toolbar | Playback controls, view toggles, actions | Fixed top, always visible |
| Transcript Editor | Segments with timestamps + speakers + editable text | Scrollable, takes ~65% width |
| Info Panel | Statistics, speaker list, module actions | Collapsible right panel (~35%), scrollable |
| Audio Player | Waveform, playhead, time, speed, volume | Fixed bottom bar, always visible when audio available |

### 2.3 Visual Design (from Approved Design System)

- Segments displayed as cards/blocks with subtle separator
- Speaker name + color dot before each segment
- Timestamps in monospace (JetBrains Mono), muted color
- Editable text in body font (Inter, 16px)
- Low-confidence words: subtle underline or background tint (not aggressive)
- Topic boundaries: thin horizontal rule + optional auto-generated label
- Rounded cards, subtle shadows per design system
- Active (playing) segment: left accent border highlight

### 2.4 Responsive Behavior

| Viewport | Layout Adaptation |
|----------|-------------------|
| Desktop (>1200px) | Full layout as shown above |
| Tablet (768-1200px) | Info panel collapses to bottom sheet; transcript takes full width |
| Mobile (<768px) | Single column; toolbar becomes compact hamburger menu; player bar simplified |

### 2.5 Mobile Layout

```
+----------------------------------+
| TOOLBAR (compact)                |
| [>] [1x] [Find] [Menu v]        |
+----------------------------------+
| TRANSCRIPT (full width)          |
|                                  |
| [00:15] Rahul                    |
| Hello everyone, aaj hum         |
| discuss karenge product          |
| roadmap ke baare mein.          |
|                                  |
| [00:32] Priya                    |
| Thanks Rahul. Main pehle        |
| budget pe baat karti hu.        |
|                                  |
| (scrollable, editable)           |
+----------------------------------+
| PLAYER BAR (simplified)          |
| [>] ====*===== 03:21/12:34      |
+----------------------------------+
```

- Info panel accessible via swipe-up bottom sheet or menu icon
- Speaker colors still shown (compact dots)
- Timestamps shortened to `[MM:SS]` always on mobile
- Edit mode: keyboard appears, segment expands to full width
- Toolbar items overflow into hamburger menu

### 2.6 Tablet Layout Adjustments

- Info panel moves below transcript as a collapsible bottom panel
- Two-column mode available: transcript left, speakers right (without full info panel)
- Player bar remains fixed at bottom
- Touch-friendly: larger tap targets for timestamps and speaker names (minimum 44x44px)

### 2.7 Theme Support

| Theme | Description |
|-------|-------------|
| Light (default) | White background, dark text, subtle card borders |
| Dark | Dark background (#1a1a2e), light text, reduced contrast accents |
| Auto | Follows system preference via `prefers-color-scheme` |

- Theme selection stored in localStorage
- All color tokens defined as CSS custom properties for easy theme switching
- Confidence highlights and speaker colors adapt per theme (maintain contrast)

---

## 3. Editing Workflow

### 3.1 Editing Model

- **Click-to-edit:** Click any text segment to enter inline edit mode (contenteditable or controlled input)
- **Edit granularity:** paragraph-level (one segment = one editable block)
- **Changes tracked:** each edit stored as a diff against original `text_display`
- **Auto-save:** edits auto-saved to browser localStorage every 5 seconds (session-scoped)

### 3.2 Edit Operations

| Operation | How It Works | Shortcut |
|-----------|-------------|----------|
| Inline edit | Click text, cursor appears, type | Click or Enter on focused segment |
| Paragraph edit | Select segment, edit text freely | -- |
| Segment split | Place cursor, press Enter to split at cursor position | Enter (in edit mode) |
| Segment merge | Select two adjacent segments, merge into one | Ctrl+Shift+M |
| Bulk edit (find/replace) | Find text, replace one/all across entire transcript | Ctrl+H |
| Undo | Revert last edit action | Ctrl+Z |
| Redo | Re-apply undone action | Ctrl+Shift+Z |
| Copy | Copy selected text (plain text or with timestamps) | Ctrl+C |
| Paste | Paste text into a segment | Ctrl+V |
| Delete segment | Remove entire segment (with confirmation if >10 words) | Delete key on selected segment |
| Restore segment | Undo deletion or "Reset to original" per segment | Right-click, Restore original |
| Reset all | Discard ALL user edits, revert to original engine output | Menu, Reset to original (with confirmation) |

### 3.3 Edit Layer Architecture

```json
{
  "session_id": "...",
  "source_transcript_id": "...",
  "edits": [
    {
      "type": "text_change",
      "segment_id": "seg_abc",
      "original": "...",
      "edited": "...",
      "timestamp": "..."
    },
    {
      "type": "segment_split",
      "segment_id": "seg_def",
      "at_char_index": 45,
      "timestamp": "..."
    },
    {
      "type": "segment_merge",
      "segment_ids": ["seg_ghi", "seg_jkl"],
      "timestamp": "..."
    },
    {
      "type": "speaker_rename",
      "speaker_id": "spk_001",
      "new_display_name": "Rahul",
      "timestamp": "..."
    },
    {
      "type": "segment_delete",
      "segment_id": "seg_mno",
      "timestamp": "..."
    }
  ],
  "undo_stack": [],
  "redo_stack": []
}
```

- All edits are reversible
- Edit layer stored in localStorage (browser)
- On export: source + edits merged into final output
- "Reset to original" = clear edits array for that segment

**Edit baseline rule:** The `original` field in a `text_change` diff always refers to the value of `text_display` *immediately before that edit was made*. This may be the engine's transliterated output (for first edit) or the result of a previous edit (for subsequent edits). Undo restores to this `original` value. The immutable `text` field (engine raw output) is only accessible via "Reset to original" which discards ALL edits for that segment and regenerates `text_display` from `text` using current transliteration preference.

### 3.4 Segment Split & Merge

**Split:**

- User places cursor inside a segment's text, presses Enter
- System creates two new segments:
  - `seg_new_1`: text before cursor, inherits original start time
  - `seg_new_2`: text after cursor, inherits original end time
  - Both inherit `speaker_id` from parent
- New segment IDs generated as UUIDs (maintaining the `seg_` prefix convention)
- `sequence_index` values recalculated for all subsequent segments

**Split timestamp calculation:**

| Condition | Method | Precision |
|-----------|--------|-----------|
| Word timestamps available | Use `end` time of last word before cursor as split point | High (~0.1s) |
| No word timestamps (live_origin, etc.) | Proportional: `split_time = start + (end - start) * (chars_before_cursor / total_chars)` | Low (~1-3s) |

- When proportional (approximate) split is used: display a subtle "⏱ approximate" indicator on the new timestamp
- The indicator tells downstream modules (especially Subtitle Studio) that this timing is estimated, not precise

**Merge:**

- User selects two adjacent segments (same or different speaker), merges:
  - Merged segment: text concatenated with space separator, start = first.start, end = second.end
  - If speakers differ: user prompted to pick which speaker to assign
  - Words arrays concatenated (if both have word-level data)
  - If only one segment has words[]: merged segment loses word-level data (with warning)
- Merged segment retains the ID of the first segment; second segment ID marked as deleted
- `sequence_index` values recalculated for all subsequent segments

### 3.5 Conflict Resolution

| Scenario | Resolution |
|----------|-----------|
| Edit + Split same segment | Split applies first, edit applied to appropriate half |
| Merge + Edit one segment | Edit preserved in merged text |
| Delete + Undo after further edits | Deletion restored at original position; subsequent edits on other segments preserved |
| Split segment with active word highlight | Word highlight paused during split; resumes on resulting segments |

### 3.6 Copy/Paste Behavior

- **Copy within editor:** copies plain text by default
- **Copy with metadata (Ctrl+Shift+C):** copies text with timestamps and speaker names as formatted text
- **Paste from external:** strips formatting, inserts as plain text into current segment
- **Paste multiline:** each line becomes a separate segment (with confirmation if >3 lines)
- Clipboard format for metadata copy:
  ```
  [00:00:15] Rahul: Hello everyone, aaj hum discuss karenge...
  [00:00:32] Priya: Thanks Rahul. Main pehle budget pe baat karti hu.
  ```

---

## 4. Speaker Management System

### 4.1 Speaker Display

- Each speaker gets a color from a predefined palette (8 distinct colors, cycle if more)
- Color shown as a dot/pill before speaker name on each segment
- Speaker name resolved: `display_name ?? label` from `speakers.entries`

### 4.2 Speaker Operations

| Operation | How | Effect |
|-----------|-----|--------|
| Rename | Click speaker name inline OR via speaker panel | Updates `display_name` in entries; all segments reflect immediately |
| Assign color | Via speaker panel color picker (preset palette) | Visual only, stored in local edit layer |
| Reassign segment | Right-click segment, "Change speaker", pick from list | Updates segment's `speaker_id` in edit layer |
| Merge speakers | In speaker panel, drag one onto another | All segments of merged speaker reassigned to target |
| Filter by speaker | Click speaker in panel, only their segments visible | Filter mode, toggle on/off |
| Speaker timeline | Minimap showing who speaks when (color-coded bar) | Visual overview in info panel |

### 4.3 Speaker Panel UI

```
SPEAKERS
--------------------------
* Rahul (Speaker 1)        [Edit] [Color]
  Speaking: 8:20 (65%)
  Segments: 28

* Priya (Speaker 2)        [Edit] [Color]
  Speaking: 4:14 (35%)
  Segments: 14

--------------------------
[Show speaker timeline]
```

### 4.4 No-Diarization Fallback

- If `speakers.count == 0` (no diarization): hide speaker panel, hide speaker labels
- Show info note: "Speaker detection was not available for this transcript"
- Offer: "Reprocess with speaker detection" (if server engine available with diarization)

### 4.5 Speaker Color Palette

| Index | Color Name | Hex Value | Usage |
|-------|-----------|-----------|-------|
| 1 | Blue | #3B82F6 | Speaker 1 (default) |
| 2 | Emerald | #10B981 | Speaker 2 |
| 3 | Amber | #F59E0B | Speaker 3 |
| 4 | Rose | #F43F5E | Speaker 4 |
| 5 | Purple | #8B5CF6 | Speaker 5 |
| 6 | Cyan | #06B6D4 | Speaker 6 |
| 7 | Orange | #F97316 | Speaker 7 |
| 8 | Pink | #EC4899 | Speaker 8 |

- Colors cycle for speakers beyond 8
- User can override per speaker via color picker
- All colors meet WCAG AA contrast against both light and dark backgrounds
- Color assignments stored in local edit layer

### 4.6 Speaker Timeline Visualization

```
SPEAKER TIMELINE
|====RAHUL====|   |==RAHUL==|      |===RAHUL===|
         |===PRIYA===|    |==PRIYA==|
0:00                  6:00                  12:34
```

- Horizontal bar chart showing speaking duration per speaker
- Color-coded to match speaker palette
- Clickable: clicking a region seeks audio to that point
- Shown in info panel when "Show speaker timeline" toggled on
- Gaps (silence or unattributed audio) shown as empty space

---

## 5. Timestamp System

### 5.1 Timestamp Display

- Format: `[HH:MM:SS]` for audio >1hr, `[MM:SS]` for shorter
- Shown at the start of each segment in monospace font, muted color
- Toggle visibility via toolbar button (some users prefer clean text-only view)
- Word-level timestamps: not shown by default, but used for playback sync and subtitle precision

### 5.2 Timestamp Interactions

| Action | Trigger | Result |
|--------|---------|--------|
| Jump to time | Click any timestamp | Audio seeks to that position |
| Edit timestamp | Double-click timestamp (advanced mode) | Adjusts segment start time (useful for subtitle prep) |
| Show word timing | Hover over word (if word timestamps available) | Tooltip shows exact time |
| Sync scroll | During playback, transcript auto-scrolls to current segment | Active segment stays in viewport |
| Time range select | Shift+click two timestamps | Selects all segments in that time range |

### 5.3 Timestamp Editing Rules

- Segments must remain in chronological order (cannot set start > previous segment's end)
- Editing a timestamp shifts that segment only; adjacent segments unchanged (gaps allowed)
- Warning shown if edit creates a time overlap or gap >2s
- Timestamp precision: stored as seconds with millisecond precision (float), displayed as HH:MM:SS or MM:SS
- Edge case: if segment has word-level timestamps, editing segment start adjusts first word's start time proportionally

### 5.4 Timestamp Format Examples

| Audio Duration | Format | Example |
|---------------|--------|---------|
| < 1 hour | MM:SS | 03:21 |
| >= 1 hour | HH:MM:SS | 1:03:21 |
| With word hover | MM:SS.ms | 03:21.450 |

### 5.5 Time-based Selection

- Shift+click two timestamps selects all segments in that time range
- Selected segments can be:
  - Bulk deleted (with confirmation)
  - Bulk reassigned to a different speaker
  - Copied as formatted text
  - Exported as a clip (subset of transcript)

---

## 6. Search & Navigation System

### 6.1 Search Features

| Feature | Description |
|---------|-------------|
| Text search | Find any text across all segments (case-insensitive, supports regex optional) |
| Speaker filter | Show only segments from selected speaker(s) |
| Keyword highlight | Persistent highlights for user-defined keywords |
| Jump between matches | Up/Down arrows in search bar to cycle matches |
| Match count | "3 of 17 matches" indicator |
| Replace | Replace current match or replace all |

### 6.2 Search UI

```
+------------------------------------------------------------------+
| [Search transcript...              ] [Up] [Dn] [3/17] [Replace:] |
| [x] Case sensitive  [x] Whole word  [ ] Regex       [Replace All]|
+------------------------------------------------------------------+
```

- Search bar slides down below toolbar on Ctrl+F
- Matches highlighted in transcript (yellow background)
- Current match has stronger highlight (orange)
- Search works on `text_display` (what user sees)

### 6.3 Navigation for Long Transcripts

- **Segment minimap:** slim vertical bar on right edge showing segment density + current position (like code editor minimap)
- **Topic boundary markers:** if `topic_boundary_hint = true`, show clickable chapter markers in minimap
- **Go to time:** Ctrl+G to enter timestamp and jump to that segment
- **Go to speaker:** filter by speaker for quick navigation
- **Keyboard navigation:** Up/Down arrows move between segments; Tab moves to next segment

---

## 7. Playback Integration Strategy

### 7.1 Audio Player Bar

```
+------------------------------------------------------------------+
| [<<] [> Play] [>>] [1.0x v]  ===*===waveform========  03:21/12:34|
|                              [Vol] [Loop segment]                 |
+------------------------------------------------------------------+
```

### 7.2 Sync Behavior

| Feature | Behavior |
|---------|----------|
| Play follows transcript | Active segment highlighted (left accent border); transcript auto-scrolls to keep active segment in view |
| Click segment seeks audio | Clicking a segment's timestamp or using "play from here" seeks audio to segment.start |
| Word highlighting (if available) | During playback, current word gets subtle background highlight (karaoke-style) |
| Speed control | 0.5x, 0.75x, 1.0x, 1.25x, 1.5x, 2.0x for review/correction workflow |
| Loop segment | Toggle: repeat current segment continuously (useful for correcting hard-to-hear sections) |
| Pause on edit | When user clicks to edit a segment, audio pauses automatically (prevents desync) |

### 7.3 Waveform

- WaveSurfer.js (or similar) for waveform visualization
- Clickable: click anywhere on waveform to seek
- Current position shown as playhead line
- Segment boundaries shown as subtle markers on waveform
- Mini-waveform in player bar; optionally full-width waveform above transcript (toggle)

### 7.4 No-Audio Fallback

- If audio file expired (TTL) or was processed client-side and blob released: player shows "Audio no longer available"
- Transcript remains fully functional for editing/export without audio
- Timestamp navigation still works (visual only, no playback)

### 7.5 Playback State Machine

```
[Idle] --play--> [Playing] --pause--> [Paused]
  ^                  |                    |
  |                  v                    v
  +----stop---[Ended]       [Playing] <--resume--
                                |
                            --edit--> [Paused] (auto-pause on edit)
```

- State transitions emit events for UI sync
- "Ended" state: playhead at end; next Play restarts from beginning unless loop mode active
- Segment loop: overrides normal end behavior; seeks back to segment.start on reaching segment.end

### 7.6 Speed Control Details

| Speed | Use Case |
|-------|----------|
| 0.5x | Difficult audio, heavy accents, technical jargon |
| 0.75x | Careful review, transcription correction |
| 1.0x | Normal listening |
| 1.25x | Quick review of familiar content |
| 1.5x | Skimming long recordings |
| 2.0x | Fast scan, searching for specific section |

- Speed preserved across play/pause cycles
- Speed resets to 1.0x on new transcript load
- Keyboard shortcut: `[` to decrease speed, `]` to increase speed (0.25x increments)

**Shortcut scope rule:** All playback shortcuts (Space, `[`, `]`, Up/Down arrows for segment nav) are DISABLED when user is in text edit mode (cursor active inside a segment). Only Escape (exit edit mode), Ctrl+key combinations, and text input keys are active in edit mode. Exiting edit mode (Escape or clicking outside) re-enables all shortcuts.

---

## 8. Session Management Strategy

### 8.1 Principles (No-Login Architecture)

- No server-side user state
- All session data lives in browser (localStorage + sessionStorage)
- Session = one browser tab's interaction with one transcript

### 8.2 Session Data Storage

| Data | Storage | Lifetime | Approx Size |
|------|---------|----------|-------------|
| StandardTranscript (from engine) | sessionStorage | Until tab closed or TTL | 200KB-1MB |
| User edits (edit layer) | localStorage (keyed by transcript ID) | 24 hours (auto-cleanup) | 10-100KB |
| UI preferences (theme, timestamps visible, etc.) | localStorage | Permanent until cleared | <1KB |
| Audio blob (if live recording) | IndexedDB | Session only | 10-200MB |

**localStorage budget management (5-10MB limit):**
- On startup: check `navigator.storage.estimate()` and existing localStorage usage
- Maximum 3 transcript edit layers stored simultaneously
- When a 4th transcript arrives: prompt user to export oldest session or auto-discard oldest (>24h)
- If localStorage nears 80% capacity: show non-blocking warning "Storage is getting full. Export your older sessions."
- Each edit layer includes a `size_bytes` estimate; large layers (>500KB) trigger earlier cleanup prompts
- Transcripts themselves stay in sessionStorage (per-tab, cleared on close) — does not compete with localStorage budget

### 8.3 Session Protection

| Scenario | Protection |
|----------|-----------|
| User closes tab with unsaved edits | `beforeunload` event shows browser warning: "You haven't exported your transcript yet. Edits are saved locally but will be cleared after 24 hours." |
| User navigates away in-app | Confirm dialog: "You have edits that haven't been exported. Leave anyway?" |
| Session expires (server TTL for result) | Transcript already in sessionStorage; user keeps working. Only audio playback affected. |
| Browser crash | localStorage edit layer survives; on re-open, offer "Restore previous session?" |
| 24-hour auto-cleanup | After 24h with no interaction, localStorage data cleared for privacy |

### 8.4 Download Reminder

- After 10 minutes of editing, a subtle non-blocking reminder: "Remember to export your work -- it's stored locally and will be cleared after 24 hours."
- After 30 minutes: slightly more visible reminder
- Never block workflow; always dismissible

---

## 9. Accessibility Plan

### 9.1 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Space | Play/Pause audio |
| Ctrl+F | Open search |
| Ctrl+H | Open find & replace |
| Ctrl+Z | Undo |
| Ctrl+Shift+Z | Redo |
| Ctrl+E | Quick export |
| Ctrl+G | Go to time |
| Ctrl+Shift+M | Merge selected segments |
| Enter (in edit mode) | Split segment at cursor |
| Escape | Exit edit mode / close search |
| Up/Down arrows | Navigate between segments |
| Tab | Move to next segment |
| Ctrl+1-6 | Send to module (1=Export, 2=Subtitles, 3=Content, 4=Meeting, 5=Creator, 6=Business) |
| Alt+S | Toggle speaker panel |
| Alt+T | Toggle timestamps |
| ? | Open shortcuts help modal |

### 9.2 Screen Reader Support

- Each segment is an ARIA article with `role="article"` and `aria-label` including speaker name + timestamp
- Live region announces current playback position periodically
- Search results announced via `aria-live="polite"`
- Edit mode changes announced
- Segment navigation via `aria-activedescendant`

### 9.3 Visual Accessibility

- All confidence highlights maintain WCAG AA contrast ratios
- Speaker colors have minimum 3:1 contrast against background
- Timestamps and labels readable at 200% zoom
- Focus rings visible on all interactive elements
- High contrast mode: removes subtle background tints, uses strong borders instead
- Reduced motion: disables auto-scroll animation, word highlight animation, waveform animation

### 9.4 Motor Accessibility

- All actions reachable via keyboard (no mouse-only interactions)
- Touch targets minimum 44x44px on mobile
- No time-limited interactions (edit mode does not timeout)
- Drag-and-drop operations (speaker merge) have keyboard alternative (select + action menu)
- Long-press alternatives for right-click context menus on touch devices

### 9.5 Cognitive Accessibility

- Consistent layout: elements never move unexpectedly
- Clear labeling: all icons have text labels (hideable via compact mode preference)
- Confirmation dialogs for destructive actions (delete, reset all)
- Progress indicators for any operation taking >500ms
- Error messages include actionable recovery steps (never just "Error occurred")
- Tooltips on hover/focus for abbreviated or icon-only controls

---

## 10. Future Upgrade Roadmap

| Feature | Stage | Description | Dependency |
|---------|-------|-------------|-----------|
| AI-assisted correction | Stage 2 | Suggest corrections for low-confidence words; accept/reject per suggestion | TextIntelligenceProvider |
| Smart grammar correction | Stage 2 | Auto-fix common grammar issues in transcribed text | NLP model (local or API) |
| Smart formatting | Stage 2 | Auto-paragraphing, capitalization, numbered list detection | Rule-based + NLP |
| Speaker intelligence | Stage 2-3 | Auto-identify speakers by voice; remember across sessions (opt-in) | Speaker enrollment pipeline |
| Collaborative editing | Stage 3 | Multiple users edit same transcript (shared session via WebSocket) | Server-side session state, CRDT/OT |
| Domain-specific editing packs | Stage 2+ | Medical, legal, tech terminology highlighting + auto-correct; custom dictionaries | Domain vocabulary databases |
| Version history | Stage 2 | See previous edits, compare versions, restore any version | Edit layer versioning |
| Comments/annotations | Stage 2 | Add notes to specific segments without modifying transcript | Annotation layer in edit state |
| Batch processing view | Stage 2 | Upload multiple files, view transcripts in a list, bulk export | Queue system extension |
| Offline mode | Stage 3 | Full transcript editing works offline (Service Worker + IndexedDB) | PWA architecture |

---

## Transcript Quality Review

### Low-Confidence Detection

- Segments/words with confidence < 0.7 get visual indicator (subtle underline + muted background)
- Threshold configurable per user in preferences (default: 0.7)

### Review Workflow

- "Review mode" toggle in toolbar: only low-confidence segments shown, others collapsed
- Sequential review: Next/Previous buttons jump between flagged segments
- Manual correction: click underlined word, original shown in tooltip, user edits in-place
- Batch accept: "Accept all suggestions" button in review mode (if AI suggestions available at Stage 2)

### Quality Indicator

- Info panel shows: overall confidence % + count of flagged segments
- Color-coded badge (aligned with Speech Engine quality_label):
  - Green: "Excellent" (>90%) or "Good" (70-90%)
  - Yellow: "Fair" (50-70%)
  - Red: "Poor" (<50%) -- with prominent warning banner in editor area
- If `quality_label` from engine is "poor": show warning banner at top of transcript: "This transcript has low confidence. Review highlighted sections for accuracy."
- Transcript Studio ALWAYS uses Speech Engine's `quality_label` value — never calculates its own. The thresholds are authoritative from the engine.

---

## Multi-Language Support

### Script Toggle

- Toolbar button to switch between display modes:
  - "Original" (as-transcribed)
  - "Roman Hindi" (romanized Devanagari)
  - "Devanagari" (native script)
- Toggle affects `text_display` field; `text` remains unchanged

### Per-Segment Language Tags

- Subtle badge on each segment indicating detected language (EN, HI, HI+EN)
- Based on `language_tag` from Speech Engine output (segment-level or word-level)

### Text Direction and Font

- Always LTR (Hindi in Devanagari is LTR)
- Font: Inter supports Devanagari; no font switch needed
- Mixed content: English segments unchanged; only Hindi/Hinglish segments affected by script toggle

### Script Switching Behavior

- When toggling script: `text_display` regenerated from `text` with new transliteration preference
- Default script preference stored in localStorage

**Script toggle + editing conflict resolution (CRITICAL):**

| Scenario | Behavior |
|----------|----------|
| No edits made yet | Script toggle works freely; `text_display` regenerated from `text` |
| User has made edits | **Script toggle is LOCKED.** Show message: "Script cannot be changed after editing. Export your work, then re-upload to use a different script." |
| User wants to unlock | "Reset all edits" unlocks script toggle (discards all edits, confirms with user) |

**Rationale for locking (Stage 1 simplicity):**
- Edits are stored as diffs against `text_display` in the current script
- Re-transliterating would invalidate all diffs (character positions change, text content changes)
- Reverse-transliteration is lossy and unreliable
- Locking prevents silent data loss

**Future upgrade (Stage 2):** Allow script switch after edit by storing edits at word-level with language tags, enabling re-transliteration of only unedited segments. Complex but possible with word-level language data from Speech Engine.

---

## Error Handling

| Error | Detection | UI Response | Recovery |
|-------|-----------|-------------|----------|
| Missing transcript | No data in sessionStorage for job_id | "Transcript not found. It may have expired." | Offer re-upload |
| Corrupt data | JSON parse fails or required fields missing | "Transcript data appears damaged." | Offer re-upload |
| Audio sync error | Audio duration != transcript duration_sec (>5% mismatch) | "Audio and transcript may be out of sync." | Still allow editing; disable precise word-sync |
| Playback error | Audio decode fails | "Audio playback unavailable." | Hide player bar; editing still works |
| Session expiration | Server returns 404 for job_id when polling | "Session expired." (if transcript not yet loaded) | Already-loaded transcript unaffected |
| localStorage full | QuotaExceededError on save | "Storage full. Please export your work." | Prioritize current transcript; suggest clearing old sessions |
| Network timeout | Polling for transcript exceeds 60s | "Taking longer than expected. Please wait or retry." | Retry button with exponential backoff |
| Unsupported browser | Feature detection fails (no localStorage, no Web Audio) | "Your browser doesn't support all features." | Graceful degradation; editing works, playback may not |

---

## Transcript Statistics Display

Shown in the Info Panel (right side), always visible:

```
FILE INFO
--------------------------
Duration:     12:34
Words:        2,847
Characters:   14,230
Segments:     42
Speakers:     2
Language:     Hindi + English
Quality:      Good (87%) *
Engine:       faster-whisper base
Processed:    2 min 34 sec ago
--------------------------
```

### Statistics Details

- **Duration:** from `transcription_meta.duration_sec`, formatted as MM:SS or HH:MM:SS
- **Words:** count of all words across all segments (from `words[]` if available, else split on spaces)
- **Characters:** total character count of `text_display` across segments
- **Segments:** count of segments in transcript
- **Speakers:** from `speakers.count`; "Unknown" if 0
- **Language:** from `transcription_meta.language_code`, human-readable
- **Quality:** from `quality_score` + `quality_label`, color-coded badge
- **Engine:** from `transcription_meta.engine` + `model_id`
- **Processed:** relative time since `transcription_meta.completed_at`

### Partial Transcript Indicator

- If `is_partial` flag is true on any segments: show warning in info panel
- Display: "Partial -- X segments missing" with warning icon
- Missing segments shown as placeholder blocks in transcript: "[Gap -- segment unavailable]"

---

## Performance Considerations

### Target Metrics

| Metric | Target | Strategy |
|--------|--------|----------|
| Initial load (transcript render) | <500ms for 1000 segments | Virtualized list rendering |
| Edit response | <16ms (60fps) | Direct DOM manipulation in edit mode |
| Search across transcript | <100ms for 5000 segments | Pre-built search index on load |
| Auto-save to localStorage | <50ms | Debounced, delta-only writes |
| Audio seek accuracy | <100ms | Pre-computed segment time index |

### Virtualization Strategy

- Only render segments visible in viewport + buffer of 10 above/below
- Use intersection observer for visibility detection
- Maintain scroll position accuracy with fixed-height placeholders
- Disable virtualization for transcripts under 100 segments (overhead not worthwhile)

### Memory Management

- Large transcripts (>2000 segments): lazy-load word-level data on demand
- Audio waveform: generate at reduced resolution for overview, full resolution only for visible portion
- Edit history: cap undo stack at 100 operations; oldest operations archived to localStorage

---

## Security and Privacy

### Data Handling Principles

- No transcript data sent to any server after initial load (all processing client-side)
- localStorage data not accessible cross-origin (browser security model)
- No analytics or tracking on transcript content
- Audio blob never uploaded back to server

### Auto-Cleanup

- Session data cleared after 24 hours of inactivity
- User can manually clear all data via Settings
- On explicit "Delete session" action: immediate cleanup of all localStorage + sessionStorage + IndexedDB entries for that transcript

### Export Security

- Exported files generated entirely client-side (no server round-trip)
- No watermarking or tracking embedded in exported files
- User owns their data completely

---

*End of Transcript Studio Module Architecture Document*
