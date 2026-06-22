# Squicky Speech Intelligence Platform (SSIP)
## Subtitle Studio Module -- Architecture Document

> **Status:** Module Design Phase -- No code yet.
> **Author role:** Lead Video Accessibility Architect / Chief Subtitle Systems Architect.
> **Prerequisites:** Master Architecture (approved), UI/UX Design System (approved), Speech Engine Module (approved), Transcript Studio Module (approved), Export Center Module (approved).
> **Purpose:** Complete architectural blueprint for the Subtitle Studio module -- transforms transcripts into professional subtitle files with visual editing, timing control, and multi-format export.

---

## Table of Contents

1. [Subtitle Studio Architecture](#1-subtitle-studio-architecture)
2. [Subtitle Generation Pipeline](#2-subtitle-generation-pipeline)
3. [Timing Engine Design](#3-timing-engine-design)
4. [Subtitle Editor Design](#4-subtitle-editor-design)
5. [Timeline System Design](#5-timeline-system-design)
6. [Validation System](#6-validation-system)
7. [Export Integration Strategy](#7-export-integration-strategy)
8. [Privacy Workflow](#8-privacy-workflow)
9. [Performance Strategy](#9-performance-strategy)
10. [Future Upgrade Roadmap](#10-future-upgrade-roadmap)

---

## Critical Context from Approved Modules

### Speech Engine StandardTranscript (v1.1.0) Provides:

- `segments[].id` -- stable UUIDs
- `segments[].start` / `segments[].end` -- precise float seconds
- `segments[].text` (immutable engine output) + `segments[].text_display` (user-facing, may be transliterated)
- `segments[].words[]` -- OPTIONAL word-level timestamps (critical for precise subtitle timing). If null, subtitle timing is segment-level only (less precise).
- `segments[].speaker_id` -> resolved via `speakers.entries[{id, label, display_name}]`
- `segments[].confidence` -- may be null
- `processing_flags.live_origin` -- if true, NO word timestamps, approximate timing. Show warning: "Subtitles from live recording have approximate timing."

### Transcript Studio Merged Output Adds:

- `user_edited` flag per segment (human-verified = higher trust for subtitle text)
- User may have split/merged segments (new UUIDs, recalculated sequence_index)

### Export Center Expects:

- `ExportPayload` with `payload_type: "subtitles"`
- `data`: subtitle cues `[{id, start, end, text, style?}]`
- Supports SRT, VTT, ASS formats

---

## 1. Subtitle Studio Architecture

### 1.1 Module Role

- Transforms transcript segments into properly timed, formatted subtitle cues
- Provides visual timeline editor for precise timing adjustments
- Offers real-time preview of how subtitles appear over audio/video
- Integrates with Export Center for SRT/VTT/ASS output
- Handles the unique challenges: reading speed, line length limits, sentence boundaries, speaker attribution

### 1.2 Data Flow

```
Speech Engine (StandardTranscript)
        |
        v
Transcript Studio (optional edits, user_edited flag)
        |
        v
SUBTITLE STUDIO
  [1] Auto-Segmentation Engine
      - Splits transcript segments into subtitle-sized cues
      - Respects max chars/line, max lines, reading speed
  [2] Timing Engine
      - Assigns precise start/end from word timestamps (if available)
      - Falls back to proportional timing (if no word timestamps)
  [3] Validation Engine
      - Checks all cues against subtitle rules
      - Auto-fixes or warns
  [4] Editor + Timeline
      - User adjusts text, timing, splits, merges
  [5] Preview
      - Real-time subtitle overlay on waveform/video
        |
        v
Export Center (ExportPayload with subtitle cues)
        -> SRT / VTT / ASS download
```

### 1.3 Subtitle Cue Schema (Internal)

```json
{
  "id": "cue_uuid_001",
  "sequence_index": 0,
  "start": 0.0,
  "end": 4.2,
  "text": "Hello everyone, welcome\nto the meeting.",
  "speaker_id": "spk_001",
  "speaker_name": "Rahul",
  "style": {
    "position": "bottom-center",
    "color": null,
    "bold": false,
    "italic": false
  },
  "source_segment_ids": ["seg_abc"],
  "validation": {
    "reading_speed_ok": true,
    "length_ok": true,
    "timing_ok": true,
    "warnings": []
  },
  "user_edited": false
}
```

### 1.4 Input Handling

- **From Speech Engine directly:** raw StandardTranscript (user skipped Transcript Studio)
- **From Transcript Studio:** merged output with edits (preferred path -- human-verified text)
- **Detection:** if `user_edited == true` on segment, trust text more for subtitle content

---

## 2. Subtitle Generation Pipeline

### 6-Stage Pipeline

```
TRANSCRIPT SEGMENTS
        |
        v
[Stage 1] TEXT SEGMENTATION
    - Split long segments into subtitle-sized chunks
    - Rules: max 42 chars/line, max 2 lines, split at sentence/clause boundaries
        |
        v
[Stage 2] TIMING ASSIGNMENT
    - If words[] available: precise per-word timing for cue boundaries
    - If words[] NOT available: proportional timing (chars/total_chars * segment_duration)
    - Minimum cue duration: 1.0 second
    - Maximum cue duration: 7.0 seconds
        |
        v
[Stage 3] GAP & OVERLAP RESOLUTION
    - Minimum gap between cues: 0.08 seconds (2 frames at 25fps)
    - Detect overlaps -> trim end of earlier cue
    - Detect excessive gaps (>3s silence) -> mark as intentional pause
        |
        v
[Stage 4] READING SPEED VALIDATION
    - Calculate characters per second (CPS) for each cue
    - Target: 15-20 CPS (comfortable reading)
    - Warning if CPS > 25 (too fast)
    - Auto-split if CPS > 30 (unreadable)
        |
        v
[Stage 5] SPEAKER ATTRIBUTION
    - If diarization available: assign speaker_id to each cue
    - On speaker change: optionally prepend speaker name to cue text
    - Speaker-colored subtitles (for ASS format)
        |
        v
[Stage 6] QUALITY VALIDATION
    - Run all validation rules (Section 6)
    - Flag issues, auto-fix where safe
    - Mark cues with warnings for user review
```

### Segmentation Rules (Critical for Readability)

| Rule | Value | Rationale |
|------|-------|-----------|
| Max characters per line | 42 | Standard for broadcast subtitles; fits 16:9 video |
| Max lines per cue | 2 | More than 2 lines obscures too much video |
| Minimum cue duration | 1.0 seconds | Shorter cues are unreadable |
| Maximum cue duration | 7.0 seconds | Longer cues make viewer think it is stuck |
| Min gap between cues | 80ms (2 frames @25fps) | Human eye needs a flash to register new cue |
| Reading speed target | 15-20 CPS | Comfortable for average reader |
| Reading speed warning | > 25 CPS | Fast readers only |
| Reading speed auto-split | > 30 CPS | Unreadable for anyone |
| Split preference | Sentence end > clause boundary > word boundary | Natural reading flow |

### Splitting Algorithm (for Long Segments)

1. If text fits in 2 lines x 42 chars: single cue, done
2. If too long: find best split point:
   a. Prefer period/question mark/exclamation (sentence end)
   b. Else prefer comma/semicolon/dash (clause boundary)
   c. Else prefer space nearest to midpoint (word boundary)
3. Create two cues; recurse if either half still exceeds limits
4. Assign timing proportionally based on character count of each half

---

## 3. Timing Engine Design

### 3.1 Timing Sources (Priority Order)

| Source | Precision | When Available |
|--------|-----------|---------------|
| Word-level timestamps (`words[]`) | ~0.1s | Batch processing with FasterWhisper/Whisper |
| Segment-level timestamps | ~1-3s | Always (every segment has start/end) |
| Proportional estimation | ~2-5s | When segment is split but no word timestamps |

### 3.2 Timing Assignment Algorithm

```
FOR EACH generated subtitle cue:
  IF source segment has words[]:
    cue.start = first_word_in_cue.start
    cue.end = last_word_in_cue.end
    (precise, ~0.1s accuracy)
  ELSE:
    ratio = chars_before_cue / total_segment_chars
    cue.start = segment.start + (segment.duration * ratio)
    cue.end = calculated from cue char count / total chars * duration
    Mark cue: timing_approximate = true
    (approximate, ~2-5s accuracy)
```

### 3.3 Duration Validation Rules

| Check | Rule | Auto-fix |
|-------|------|----------|
| Cue too short | duration < 1.0s | Extend end to start + 1.0s (if no overlap with next) |
| Cue too long | duration > 7.0s | Split cue at midpoint |
| Overlap with next | cue.end > next_cue.start | Trim cue.end to next_cue.start - 0.08s |
| Gap too small | gap < 0.08s but > 0 | Extend gap to 0.08s by trimming earlier cue end |
| Negative duration | end < start | Swap start/end; flag for review |

### 3.4 live_origin Handling

- If `processing_flags.live_origin == true`: NO word timestamps exist
- All timing is segment-level proportional (approximate)
- Show persistent banner: "Subtitles have approximate timing. For precise subtitles, reprocess the recording with the full engine."
- Offer "Reprocess for precision" button

---

## 4. Subtitle Editor Design

### 4.1 Editor Layout (Desktop)

```
+------------------------------------------------------------------+
| TOOLBAR                                                          |
| [Format: SRT v] [Max chars: 42] [Lines: 2] [CPS: 20]           |
| [Speaker labels: On v] [Auto-fix] [Validate All] [Export]        |
+------------------------------------------------------------------+
| CUE LIST (left ~45%)              | PREVIEW (right ~55%)         |
|                                   |                              |
| #1  00:00:00.000 -> 00:00:04.200  | +------------------------+  |
| "Hello everyone, welcome"         | |                        |  |
| "to the meeting."                 | |  [waveform/video area] |  |
| Speaker: Rahul | CPS: 17 OK       | |                        |  |
| [Edit] [Split] [Merge] [Delete]  | | "Hello everyone,       |  |
|                                   | |  welcome to the        |  |
| #2  00:00:04.400 -> 00:00:08.100  | |  meeting."             |  |
| "Thank you for joining on"        | +------------------------+  |
| "such short notice."              |                              |
| Speaker: Priya | CPS: 19 OK       |                              |
| [Edit] [Split] [Merge] [Delete]  |                              |
|                                   |                              |
+-----------------------------------+------------------------------+
| TIMELINE (bottom, full width)                                    |
| |==[1]==|==[2]==|===[3]===|==[4]==|=====[5]=====|==[6]==|       |
| 0:00    0:04    0:08      0:12    0:16           0:24    0:30   |
| [Drag edges to adjust timing]  [Zoom: + -]  [Fit all]           |
+------------------------------------------------------------------+
```

### 4.2 Cue Editing Operations

| Operation | How | Effect |
|-----------|-----|--------|
| Edit text | Click cue text -> inline edit | Changes subtitle text content |
| Edit timing | Drag edges on timeline OR double-click time in cue list | Adjusts start/end time |
| Split cue | Click "Split" or place cursor + Enter | Splits one cue into two at cursor/midpoint |
| Merge cues | Select adjacent cues + "Merge" | Combines text, extends time range |
| Delete cue | Click "Delete" (with confirm if text > 5 chars) | Removes cue, gap left in timeline |
| Insert cue | Click gap in timeline + "Add cue" | Creates empty cue at clicked position |
| Reorder | Drag cue in list (edge case only) | Changes sequence (rarely needed) |
| Undo/Redo | Ctrl+Z / Ctrl+Shift+Z | Full edit history |

### 4.3 Inline Edit Behavior

- Click text -> contenteditable mode
- Live character counter shows remaining chars per line
- Live CPS indicator updates as you type
- Red highlight if exceeding limits (too long, too fast)
- Enter = new line within cue (max 2 lines enforced)
- Tab = move to next cue text
- Escape = exit edit mode

---

## 5. Timeline System Design

### 5.1 Timeline Visualization

```
TIMELINE
+------------------------------------------------------------------+
| [Zoom -] [Zoom +] [Fit All] [Snap: On]         Time: 00:03:21   |
+------------------------------------------------------------------+
|                                                                  |
| Rahul  |===[1]===|    |===[3]===|         |======[5]======|     |
| Priya       |==[2]==|       |==[4]==|                  |=[6]=|  |
|                                                                  |
| AUDIO  ______________________________________________________    |
|        ^ playhead                                                |
+------------------------------------------------------------------+
| 0:00        0:05        0:10        0:15        0:20        0:25|
+------------------------------------------------------------------+
```

### 5.2 Timeline Features

| Feature | Behavior |
|---------|----------|
| Cue blocks | Colored rectangles per speaker; width = duration; position = start time |
| Drag edges | Drag left/right edge of a cue block to adjust start/end time |
| Drag whole cue | Drag center of cue block to move entire cue (shift start+end together) |
| Playhead | Vertical line showing current audio position; moves during playback |
| Waveform | Audio waveform rendered below cue tracks; helps identify speech regions |
| Zoom | Zoom in (see detail) / zoom out (see overview); mouse wheel on timeline |
| Snap | When enabled, cue edges snap to word boundaries (if words[] available) |
| Multi-track | One track per speaker (colored); overlapping speakers visible |
| Selection | Click cue = select; Shift+click = multi-select; selected cues highlighted |
| Context menu | Right-click cue -> Split, Merge, Delete, Edit timing, Change speaker |

### 5.3 Zoom Levels

| Level | Time per Screen Width | Use Case |
|-------|----------------------|----------|
| Overview (fit all) | Entire audio duration | See all cues, spot gaps |
| Normal (default) | ~30 seconds | General editing |
| Detail | ~10 seconds | Fine-tune timing |
| Micro | ~3 seconds | Frame-accurate adjustments |

### 5.4 Keyboard Controls in Timeline

| Key | Action |
|-----|--------|
| Left/Right | Move playhead by 1 second |
| Shift+Left/Right | Move playhead by 0.1 second (frame-accurate) |
| Space | Play/Pause |
| [ / ] | Select previous/next cue |
| Home / End | Jump to start/end of timeline |
| +/- | Zoom in/out |
| Delete | Delete selected cue(s) |

---

## 6. Validation System

### 6.1 Validation Rules

| Rule ID | Check | Severity | Auto-fixable |
|---------|-------|----------|-------------|
| V001 | Line too long (>42 chars) | Error | Yes -- wrap at nearest word |
| V002 | Too many lines (>2) | Error | Yes -- split into two cues |
| V003 | Reading speed too fast (>25 CPS) | Warning | No -- user decides to split or accept |
| V004 | Reading speed unreadable (>30 CPS) | Error | Yes -- auto-split |
| V005 | Cue too short (<1.0s) | Warning | Yes -- extend if no overlap |
| V006 | Cue too long (>7.0s) | Warning | Yes -- split at midpoint |
| V007 | Overlap with adjacent cue | Error | Yes -- trim earlier cue end |
| V008 | Gap too small (<80ms) | Warning | Yes -- extend gap by trimming |
| V009 | Empty cue (no text) | Error | Yes -- delete cue |
| V010 | Missing timing (start or end null) | Error | No -- flag for manual fix |
| V011 | Negative duration | Error | Yes -- swap start/end |
| V012 | Non-sequential timing | Error | Yes -- sort cues by start time |

### 6.2 Validation UI

```
VALIDATION RESULTS
+------------------------------------------------------------------+
| 48/52 cues pass all checks                                       |
| 3 warnings  | 1 error                                            |
+------------------------------------------------------------------+
| [Auto-fix all]  [Show errors only]  [Show warnings only]         |
+------------------------------------------------------------------+
| ERROR Cue #12: Overlap with cue #13 (0.3s overlap)   [Fix] [Skip]|
| WARN  Cue #7: Reading speed 26 CPS (recommended: <=20) [Split][OK]|
| WARN  Cue #23: Duration 7.4s (recommended: <=7.0s)  [Split] [OK] |
| WARN  Cue #41: Line 1 has 44 chars (max: 42)        [Wrap] [OK]  |
+------------------------------------------------------------------+
```

### 6.3 Validation Workflow

1. Auto-validation runs on every cue change (debounced 500ms)
2. Results shown in validation panel (expandable at bottom of editor)
3. Clicking an issue jumps to that cue in the editor + timeline
4. "Auto-fix all" applies safe fixes (all "Yes -- auto-fixable" rules)
5. Before export: full validation runs; errors block export with message; warnings allow export with confirmation

---

## 7. Export Integration Strategy

### 7.1 ExportPayload for Subtitle Studio

```json
{
  "source_module": "subtitle-studio",
  "payload_version": "1.0",
  "payload_type": "subtitles",
  "data": {
    "cues": [
      {
        "id": "cue_uuid_001",
        "sequence_index": 0,
        "start": 0.0,
        "end": 4.2,
        "text": "Hello everyone, welcome\nto the meeting.",
        "speaker_name": "Rahul",
        "style": { "position": "bottom-center" }
      }
    ],
    "format_hints": {
      "target_format": "srt",
      "include_speaker_names": true,
      "max_chars_per_line": 42,
      "max_lines": 2
    }
  },
  "metadata": {
    "title": "Meeting Recording Subtitles",
    "duration_sec": 745,
    "language": "hi+en",
    "speakers": { "count": 2, "entries": ["..."] },
    "created_at": "...",
    "quality_label": "good",
    "cue_count": 52,
    "validation_passed": true
  },
  "export_options": {
    "include_timestamps": true,
    "include_speakers": true,
    "mode": "detailed",
    "template": "standard"
  }
}
```

### 7.2 Format-Specific Export Rules

| Format | Numbering | Timestamps | Styling | Speaker Support |
|--------|-----------|-----------|---------|-----------------|
| SRT | Sequential integer (1, 2, 3...) | Comma milliseconds (00:00:01,000) | None (plain text only) | Prefix mode: "[Name] text" |
| VTT | Optional cue ID | Dot milliseconds (00:00:01.000) | Cue settings (position, align) | Prefix mode or \<v Name\> tag |
| ASS | Dialogue lines | Centiseconds (0:00:01.00) | Full styling (font, color, position, effects) | Per-style speaker colors + positioning |

### 7.3 Quick Export from Subtitle Studio Toolbar

- "Export" button -> opens Export Center pre-configured with payload_type=subtitles + SRT selected
- Ctrl+Shift+E -> direct download in last-used format (no Export Center UI)

---

## 8. Privacy Workflow

### 8.1 Core Privacy Principles

- **All subtitle generation happens CLIENT-SIDE** (text manipulation + timing assignment = no heavy compute needed)
- No audio/video sent to server for subtitle generation
- Subtitle cues stored in `sessionStorage` (cleared on tab close)
- Edit history in `localStorage` (24h auto-cleanup, same as Transcript Studio)
- Export generates Blob in memory -> download -> revoke URL -> zero trace
- Privacy model identical to Transcript Studio

### 8.2 Data Lifecycle

```
[Input: StandardTranscript in memory]
        |
        v
[Generate subtitle cues] -- pure text manipulation, client-side
        |
        v
[Store cues in sessionStorage] -- cleared on tab close
        |
        v
[User edits in editor] -- changes stay in sessionStorage
        |
        v
[Edit history in localStorage] -- 24h TTL, auto-purge
        |
        v
[Export] -- Blob in memory -> download trigger -> URL.revokeObjectURL()
        |
        v
[Tab close] -- sessionStorage cleared, all subtitle data gone
```

### 8.3 What Never Leaves the Browser

- Original audio/video data
- Transcript text content
- Generated subtitle cues
- User timing adjustments
- Speaker attribution data
- Edit history

---

## 9. Performance Strategy

### 9.1 Target Metrics

| Operation | Target | Strategy |
|-----------|--------|----------|
| Auto-generate subtitles from 1000 segments | <500ms | Pure text segmentation + timing (no heavy compute) |
| Timeline render (500 cues) | <100ms | Canvas/SVG rendering, virtualized cue list |
| Drag timing adjustment | <16ms (60fps) | Direct DOM manipulation during drag |
| Validation run (500 cues) | <100ms | Rule engine iterates once per cue |
| Preview subtitle update | <16ms | CSS position + text update only |

### 9.2 Long Video Handling (2+ Hours, 1000+ Cues)

- Cue list virtualized (only visible cues rendered in DOM)
- Timeline uses canvas rendering (not DOM nodes per cue)
- Zoom levels prevent rendering too many cues at once
- Edit operations only affect local cues (no full-list re-render)
- Validation runs incrementally (only re-validate changed cues + neighbors)

### 9.3 Memory Budget

| Component | Budget | Notes |
|-----------|--------|-------|
| Cue data (1000 cues) | ~500KB | JSON objects in memory |
| Timeline canvas | ~2MB | Single canvas element |
| Waveform data | ~5MB | Pre-computed peaks array |
| Edit history (50 undo steps) | ~2MB | Snapshot-based undo |
| Total working set | <10MB | Well within browser limits |

### 9.4 Rendering Strategy

- **Cue list:** Virtual scroll (react-window or equivalent); only 15-20 visible cues rendered
- **Timeline:** HTML Canvas for cue blocks + waveform; DOM overlay for playhead + drag handles
- **Preview:** Single DOM element with CSS transforms for positioning; text-only updates
- **Validation indicators:** CSS class toggles (no re-render needed)

---

## 10. Future Upgrade Roadmap

| Feature | Stage | Description | Dependency |
|---------|-------|-------------|-----------|
| Auto translation | Stage 2 | Translate subtitles to other languages | Translation API/model |
| AI subtitle correction | Stage 2 | Fix grammar, improve readability automatically | TextIntelligenceProvider |
| Smart formatting | Stage 2 | Auto-detect questions, emphasis, whispers -> style appropriately | NLP model |
| Burned-in caption generation | Stage 3 | Render subtitles directly onto video file (hardcoded) | FFmpeg server-side |
| Social media presets | Stage 2 | Instagram (1:1, large text), TikTok (9:16), YouTube (16:9) | Preset configurations |
| YouTube optimization | Stage 2 | Generate YouTube-compatible VTT with positioning | YouTube API format spec |
| Karaoke mode | Stage 3 | Word-by-word highlight timing for music/lyrics | Word-level timestamps required |
| Multi-language tracks | Stage 3 | Side-by-side subtitle tracks (original + translated) | Translation + UI for multi-track |
| Real-time subtitle streaming | Stage 3 | Live subtitles during recording | Streaming STT engine |
| Custom font upload | Stage 2 | User uploads .ttf/.otf for ASS styling | Font parsing library |

---

## 11. Video/Audio Preview System

### 11.1 Preview Modes

| Mode | Condition | Display |
|------|-----------|---------|
| Video preview | User uploaded video file | Video frame with subtitle text overlaid (bottom-center) |
| Audio preview | Audio available, no video | Waveform with subtitle overlay text below at correct timing |
| No-media preview | Editor opened without media | Text shown at timeline position without playback |

### 11.2 Playback Controls

- Play/Pause toggle
- Playback speed: 0.5x, 0.75x, 1.0x, 1.25x, 1.5x, 2.0x
- Loop current cue (plays only the active cue, repeating)
- Skip to next/previous cue
- Global offset adjustment (shift all subtitles by +/- seconds)

### 11.3 Preview Styling

- Shows subtitle with current style settings (font, color, position)
- Updates in real-time as user changes style options
- Safe area guides shown in video preview (10% margin from edges)
- Background opacity adjustable for readability testing

### 11.4 No-Audio Fallback

- Editor fully functional without audio/video
- Preview panel shows text at timeline position without playback
- Manual timing adjustments still possible via timeline drag
- Useful for editing imported subtitle files (no source media)

---

## 12. Speaker-Aware Subtitles

### 12.1 Speaker Detection

- If diarization available: each cue has `speaker_id` from StandardTranscript
- Speaker resolved via `speakers.entries[{id, label, display_name}]`
- If no diarization: all cues unattributed; speaker controls hidden in UI

### 12.2 Display Options

| Mode | Format | Best For |
|------|--------|----------|
| Prefix mode | "[Rahul] Hello everyone..." | SRT/VTT (no styling support) |
| Color mode | Different color per speaker | ASS format (full styling) |
| Position mode | Speaker 1 at bottom-left, Speaker 2 at bottom-right | ASS format (multi-speaker scenes) |
| Off | No speaker indication | Single-speaker content |

### 12.3 Speaker Change Handling

- On speaker change between adjacent cues: ensure minimum gap (80ms) for visual separation
- Optional: insert speaker label cue before first line of new speaker
- Color assignment: automatic from a predefined palette (up to 8 distinct speaker colors)
- User can reassign speaker colors in settings

---

## 13. Multilingual Support

### 13.1 Script Toggle

- Same mechanism as Transcript Studio: Original / Roman Hindi / Devanagari
- Subtitle text uses `text_display` (transliterated version if user chose Roman script)
- Toggle applies to all cues simultaneously

### 13.2 Character Width Considerations

| Script | Max Chars/Line | Rationale |
|--------|---------------|-----------|
| Latin (English) | 42 | Standard broadcast recommendation |
| Devanagari (Hindi) | 35 | Wider glyphs, fewer fit per line |
| Mixed (Hindi + English) | 38 | Weighted average for code-mixed content |

### 13.3 CPS Adjustment for Script

- Latin script: standard 15-20 CPS target
- Devanagari: 12-16 CPS target (syllabic script, different reading speed)
- Auto-detection: if cue contains >50% Devanagari characters, use Devanagari limits

### 13.4 Future: Bilingual Subtitles (Stage 3)

- Side-by-side or stacked bilingual display
- Original language (top line) + translation (bottom line)
- Requires translation API integration (not available in Stage 1)

---

## 14. Subtitle Styling System

### 14.1 Style Presets

| Preset | Background | Text Color | Font | Use Case |
|--------|-----------|------------|------|----------|
| Default | Semi-transparent black (#000000CC) | White (#FFFFFF) | Sans-serif | General purpose |
| High Contrast | Solid black (#000000) | Yellow (#FFFF00) | Sans-serif bold | Accessibility, bright videos |
| Minimal | None (text shadow only) | White (#FFFFFF) | Sans-serif | Clean aesthetic, dark videos |
| Netflix-style | Dark gradient | White (#FFFFFF) | Helvetica/Arial | Professional streaming look |

### 14.2 Custom Style Options

| Property | Options | Applies To |
|----------|---------|-----------|
| Font family | Arial, Helvetica, Roboto, Noto Sans (web-safe) | All formats (visual preview); ASS (export) |
| Font size | Small (18px), Medium (22px), Large (28px) | ASS export; preview only for SRT/VTT |
| Position | Top, Middle, Bottom (left/center/right) | VTT (partial), ASS (full) |
| Text color | Color picker or hex input | ASS only |
| Background color | Color picker with opacity slider | ASS only |
| Bold / Italic | Toggle | ASS only; VTT (partial \<b\>/\<i\> tags) |
| Outline | None, Thin (1px), Medium (2px), Thick (3px) | ASS only |

### 14.3 Format Limitations

- **SRT:** No styling whatsoever; all style options are preview-only
- **VTT:** Position, alignment, and basic \<b\>/\<i\> tags; limited styling
- **ASS:** Full styling support (font, color, position, effects, outline, shadow)
- UI clearly indicates which styles will appear in exported file vs. preview-only

---

## 15. Mobile Experience

### 15.1 Layout (Single Column)

```
+----------------------------------+
| COMPACT PREVIEW BAR              |
| "Hello everyone, welcome..."     |
+----------------------------------+
| CUE LIST (full width, scrollable)|
|                                  |
| #1 00:00.0-00:04.2  Rahul       |
| Hello everyone, welcome          |
| to the meeting.         CPS: 17  |
| [Edit] [Split] [More...]        |
|                                  |
| #2 00:04.4-00:08.1  Priya       |
| Thank you for joining on         |
| such short notice.      CPS: 19  |
| [Edit] [Split] [More...]        |
|                                  |
+----------------------------------+
| TIMELINE (full width, scrollable)|
| |=[1]=|=[2]=|==[3]==|=[4]=|     |
| 0:00  0:04  0:08    0:12  0:16  |
+----------------------------------+
| [Play] [Validate] [Export]       |
+----------------------------------+
```

### 15.2 Mobile Interactions

| Action | Gesture |
|--------|---------|
| Edit cue | Tap cue -> edit sheet slides up from bottom |
| Adjust timing | Tap cue edge in timeline -> +/- 0.1s buttons appear |
| Fine timing | Long-press cue edge -> finer 0.05s control |
| Zoom timeline | Pinch-to-zoom on timeline area |
| Scroll timeline | Horizontal swipe on timeline |
| Navigate cues | Vertical scroll in cue list |
| Preview | Compact bar at top shows current cue text |

### 15.3 Mobile Limitations

- No multi-track timeline (single track, speaker indicated by color)
- No drag-to-resize (tap + buttons instead)
- Simplified validation panel (list only, no inline indicators)
- Preview: text-only (no full video preview on mobile)

---

## 16. Error Handling

### 16.1 Error Scenarios

| Error | Detection | UI Response | Recovery |
|-------|-----------|-------------|----------|
| No transcript data | Subtitle Studio opened without StandardTranscript | "No transcript available. Upload audio first." | Redirect to upload |
| No word timestamps | words[] null on all segments | "Word-level timing not available. Subtitles will have approximate timing." | Continue with proportional timing; show accuracy warning |
| Timing corrupted | Cues have NaN or Infinity timestamps | "Subtitle timing data is corrupted." | Auto-fix: recalculate from segment timestamps |
| Audio sync lost | Playhead position does not match expected cue | "Audio may be out of sync with subtitles." | Offer global offset adjustment (+/- seconds) |
| Export validation fails | Errors found during pre-export check | "X issues found. Fix before export?" | Show validation panel; block export until errors fixed |
| Memory limit (very long video) | Cue count > 5000 | "This is a very long subtitle file. Editor may be slower." | Enable aggressive virtualization |

### 16.2 Graceful Degradation

| Missing Feature | Fallback Behavior |
|----------------|-------------------|
| No words[] timestamps | Proportional timing (less precise but functional) |
| No diarization | All cues unattributed; speaker features hidden |
| No audio/video | Editor works without preview playback |
| Very old browser | Disable canvas timeline; use simplified DOM layout |
| Low memory device | Reduce undo history to 20 steps; more aggressive virtualization |

### 16.3 User Notifications

- **Info (blue):** Informational messages (e.g., "Approximate timing mode active")
- **Warning (amber):** Non-blocking issues (e.g., "3 cues exceed recommended reading speed")
- **Error (red):** Blocking issues (e.g., "Cannot export: 2 cues have invalid timing")
- **Success (green):** Confirmation (e.g., "Subtitles exported successfully")

---

## 17. Integration Points Summary

### 17.1 Upstream Dependencies

| Module | What Subtitle Studio Receives | Required/Optional |
|--------|------------------------------|-------------------|
| Speech Engine | StandardTranscript v1.1.0 (segments, words, speakers) | Required |
| Transcript Studio | Edited transcript with user_edited flags | Optional (recommended) |

### 17.2 Downstream Consumers

| Module | What Subtitle Studio Provides | Format |
|--------|------------------------------|--------|
| Export Center | ExportPayload (payload_type: "subtitles") | JSON with cue array |
| Preview System | Active cue at current timestamp | Real-time event |

### 17.3 Shared Infrastructure

| Component | Shared With | Purpose |
|-----------|-------------|---------|
| sessionStorage | Transcript Studio (same pattern) | Temporary cue storage |
| localStorage | Transcript Studio (same TTL pattern) | Edit history persistence |
| Undo/Redo system | All editor modules | Consistent UX across platform |
| Export Center API | All modules that export | Standardized ExportPayload format |
| Speaker identity | Speech Engine, Transcript Studio | Consistent speaker labels/colors |

---

## Appendix A: Subtitle Format Quick Reference

### SRT Format Example

```
1
00:00:00,000 --> 00:00:04,200
[Rahul] Hello everyone, welcome
to the meeting.

2
00:00:04,400 --> 00:00:08,100
[Priya] Thank you for joining on
such short notice.
```

### VTT Format Example

```
WEBVTT

1
00:00:00.000 --> 00:00:04.200 position:50% align:center
<v Rahul>Hello everyone, welcome
to the meeting.

2
00:00:04.400 --> 00:00:08.100 position:50% align:center
<v Priya>Thank you for joining on
such short notice.
```

### ASS Format Example

```
[Script Info]
Title: Meeting Recording Subtitles
ScriptType: v4.00+

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, ...
Style: Rahul,Arial,22,&H00FFFFFF,&H000000FF,...
Style: Priya,Arial,22,&H0000FFFF,&H000000FF,...

[Events]
Format: Layer, Start, End, Style, Name, Text
Dialogue: 0,0:00:00.00,0:00:04.20,Rahul,,Hello everyone, welcome\Nto the meeting.
Dialogue: 0,0:00:04.40,0:00:08.10,Priya,,Thank you for joining on\Nsuch short notice.
```

---

## Appendix B: Configuration Defaults

```json
{
  "subtitle_studio_config": {
    "segmentation": {
      "max_chars_per_line": 42,
      "max_lines_per_cue": 2,
      "min_cue_duration_sec": 1.0,
      "max_cue_duration_sec": 7.0,
      "min_gap_between_cues_sec": 0.08,
      "reading_speed_target_cps": 20,
      "reading_speed_warning_cps": 25,
      "reading_speed_auto_split_cps": 30
    },
    "editor": {
      "default_format": "srt",
      "show_speaker_labels": true,
      "auto_validate": true,
      "validation_debounce_ms": 500,
      "undo_history_max_steps": 50
    },
    "timeline": {
      "default_zoom": "normal",
      "snap_to_words": true,
      "show_waveform": true,
      "multi_track_speakers": true
    },
    "preview": {
      "default_style": "default",
      "playback_speed": 1.0,
      "show_safe_area": false
    },
    "privacy": {
      "storage": "sessionStorage",
      "history_storage": "localStorage",
      "history_ttl_hours": 24,
      "zero_server_storage": true
    }
  }
}
```

---

*End of Subtitle Studio Module Architecture Document*
