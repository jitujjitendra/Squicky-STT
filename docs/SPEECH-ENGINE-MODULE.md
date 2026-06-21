# Squicky Speech Intelligence Platform (SSIP)
## Speech Engine Module -- Architecture Document

> **Status:** Module Design Phase -- No code yet.  
> **Author role:** Lead Audio Systems Architect / Chief Audio Architect.  
> **Prerequisites:** Master Architecture Document (approved), UI/UX Design System (approved).  
> **Purpose:** Complete architectural blueprint for the Speech Engine module -- the foundation that all other platform modules depend on.

---

## Table of Contents

1. [Speech Engine Architecture](#1-speech-engine-architecture)
2. [Component Breakdown](#2-component-breakdown)
3. [Processing Flow](#3-processing-flow)
4. [Transcript Schema](#4-transcript-schema)
5. [Privacy Workflow](#5-privacy-workflow)
6. [Error Handling Strategy](#6-error-handling-strategy)
7. [Scalability Plan](#7-scalability-plan)
8. [Technical Risks](#8-technical-risks)
9. [Future Upgrade Strategy](#9-future-upgrade-strategy)

---

## 1. Speech Engine Architecture

### 1.1 Module Role & Responsibility

The Speech Engine is the **CORE foundation** of the entire Squicky platform. Every module in the system depends on this engine's output. Without a functioning Speech Engine, no other module can operate.

**Responsibility chain:**

```
Audio/Video Input --> Preprocessing --> Language Understanding --> Transcription --> Structured Output --> Other Platform Modules
```

The Speech Engine owns the complete lifecycle from raw media input to a structured, normalized `StandardTranscript` object. All seven downstream modules (Transcript Studio, Subtitle Studio, Content Studio, Meeting Intelligence, Creator Studio, Business Studio, Export Center) consume this standardized output.

### 1.2 Core Objectives

| # | Objective | Rationale |
|---|-----------|-----------|
| 1 | Accept multiple input formats | Users have diverse media sources (recordings, videos, live mic) |
| 2 | Process audio efficiently | Respect user time; minimize waiting on near-zero compute budget |
| 3 | Support future engine replacement | Never be locked to one STT provider; pluggable adapter architecture |
| 4 | Maintain privacy-first posture | No permanent storage of audio or transcripts on server |
| 5 | Produce standardized output | All modules consume one schema (StandardTranscript) regardless of engine |
| 6 | Work within near-zero budget | No paid APIs at launch; leverage open-source and client-side compute |
| 7 | Scale without redesign | Architecture supports Stage 1 (CPU) through Stage 3 (GPU cluster) with zero module rewrites |

### 1.3 Input Support

#### Audio Formats (Direct Processing)

| Format | Validation Method | Max Size | Notes |
|--------|------------------|----------|-------|
| MP3 | Validate MPEG audio header (sync word `0xFFE0+`) | 200 MB | Most common user upload format |
| WAV | Validate RIFF header, PCM/float data chunks | 200 MB | Lossless; large files expected |
| M4A | Validate MP4 container with AAC audio codec | 200 MB | Apple ecosystem recordings |
| AAC | Validate ADTS/ADIF header bytes | 200 MB | Raw AAC stream |
| OGG | Validate OGG container, Vorbis/Opus codec | 200 MB | Open-source ecosystem |
| FLAC | Validate `fLaC` magic bytes, lossless encoding | 200 MB | Audiophile/archival recordings |

#### Video Formats (Audio Extraction)

| Format | Validation Method | Max Size | Extraction |
|--------|------------------|----------|------------|
| MP4 | Validate `ftyp` box presence | 500 MB | FFmpeg extracts audio track |
| MOV | Validate `moov` atom structure | 500 MB | FFmpeg extracts audio track |
| MKV | Validate EBML header bytes | 500 MB | FFmpeg extracts audio track |
| AVI | Validate RIFF/AVI container | 500 MB | FFmpeg extracts audio track |
| WEBM | Validate EBML/WebM, VP8/VP9 container | 500 MB | FFmpeg extracts audio track |

#### Live Input

| Source | Technology | Format | Notes |
|--------|-----------|--------|-------|
| Browser Microphone | MediaRecorder API | WebM/Opus or WAV chunks | Real-time capture, all modern browsers |
| Web Speech API | Chrome Speech Recognition | Live streaming, client-side | Zero server cost, Chrome-dependent |

#### Validation Rules

| Check | Rule | Error Code | User Message |
|-------|------|-----------|--------------|
| File type | Magic bytes match expected format | `INVALID_FORMAT` | "Unsupported file format" |
| File size | Max 500 MB (video), 200 MB (audio) | `FILE_TOO_LARGE` | "File too large" |
| Duration | Max 60 minutes (Stage 1 cap) | `DURATION_EXCEEDED` | "File exceeds duration limit" |
| Corruption | FFprobe validates file structure | `FILE_CORRUPT` | "File appears corrupt" |
| Audio presence | At least one audio stream detected | `NO_AUDIO` | "No audio track found" |
| Minimum duration | At least 1 second of audio | `TOO_SHORT` | "Audio too short" |

### 1.4 Architecture Diagram

```
INPUT LAYER              PREPROCESSING         ENGINE LAYER           OUTPUT LAYER
+---------------+       +----------------+    +----------------+    +----------------+
| File Upload   |--+    | Extraction     |    | Engine         |    | Standard       |
| (Audio/Video) |  |    | Normalization  |    | Interface      |    | Transcript     |
+---------------+  +-->>| VAD / Denoise  |-->>|                |-->>| Schema         |
| Live Mic      |--+    | Chunking       |    | Adapters:      |    |                |
| (MediaRecorder)|       +----------------+    | - Whisper      |    | --> Processors |
+---------------+                              | - FasterWhisp  |    | --> Modules    |
                                               | - whisper.cpp  |    +----------------+
                                               | - WASM         |
                                               | - Cloud (fut)  |
                                               +----------------+
```

**Data flow direction:** Left to right. Each layer has a single responsibility and communicates via well-defined interfaces. No layer skips another -- every input passes through preprocessing before reaching the engine.

---

## 2. Component Breakdown

### 2.1 Input Handler

**Responsibility:** Accept and validate all incoming media before any processing begins.

| Function | Description |
|----------|-------------|
| File validation | Read magic bytes, verify file integrity before accepting |
| Format detection | Determine actual format regardless of file extension |
| Upload management | Support chunked and resumable uploads for large files |
| Live stream setup | Initialize MediaRecorder or Web Speech API capture |
| Size enforcement | Reject files exceeding limits before wasting resources |

**Key design decision:** Validation happens BEFORE any temp file is fully written. Stream the upload, validate header bytes as they arrive, reject early if invalid. This prevents disk waste from invalid uploads.

### 2.2 Audio Preprocessor

**Responsibility:** Transform any valid input into the universal STT-ready format (16 kHz mono WAV) with optimal audio quality.

| Function | Tool | Purpose |
|----------|------|---------|
| Audio extraction from video | FFmpeg | Strip video track, output raw audio |
| Format normalization | FFmpeg | Convert to WAV 16 kHz mono (universal STT input) |
| Loudness normalization | FFmpeg `loudnorm` filter | Consistent volume levels across inputs |
| Silence detection & trimming | VAD (Voice Activity Detection) | Identify speech vs non-speech regions |
| Noise reduction | RNNoise (or similar) | Reduce background noise, configurable intensity |
| Echo reduction | Optional filter | For meeting recordings with echo artifacts |

#### Processing Order (Critical)

The order of preprocessing operations is deliberate and cannot be rearranged without quality degradation:

| Step | Operation | Reason for Position |
|------|-----------|-------------------|
| 1 | Extract audio (if video) | Cannot process video directly; must isolate audio track first |
| 2 | Convert to WAV 16 kHz mono | All STT models expect this specific format; normalize early |
| 3 | Loudness normalization | Must precede denoise so noise reduction operates on consistent levels |
| 4 | Noise reduction (optional, tunable) | After normalization because RNNoise expects certain input levels |
| 5 | VAD / silence detection | After denoise so silence boundaries are more accurate |
| 6 | Chunking on VAD boundaries | Final step; chunks are what get sent to the transcription engine |

### 2.3 Language Detector

**Responsibility:** Determine the language(s) present in the audio to configure the transcription engine correctly.

**Detection method:**
- Use Whisper's built-in language detection on the first 30 seconds of audio
- Whisper returns a probability distribution across all supported languages
- Confidence scoring based on the top language probability

**Fallback strategy:**
- If top language confidence < 0.7, run detection on 3-5 segments spread across the audio
- Majority-vote across segments to determine dominant language
- If still ambiguous, default to multilingual mode (safer than guessing wrong)

#### Hindi / English / Hinglish Detection Logic

```
IF hindi_probability > 0.6:
    label = "Hindi"
    mode = "hindi"

ELSE IF english_probability > 0.6:
    label = "English"
    mode = "english"

ELSE IF hindi_probability 0.3-0.6 AND english_probability 0.3-0.6:
    label = "Hinglish (code-mixed)"
    mode = "multilingual"

ELSE:
    label = "Unknown/Mixed"
    mode = "multilingual"  # safest default
```

**Failure handling:** Default to multilingual mode (auto-detect per segment) rather than guessing wrong. A wrong language setting causes catastrophic accuracy loss; multilingual mode is slightly slower but far more robust.

### 2.4 Hinglish Intelligence Layer

**Responsibility:** Handle mixed Hindi+English speech (code-switching), which is a key differentiator for the platform.

**How it works:**
- Whisper in multilingual mode processes code-mixed audio natively
- Output: Hindi segments in Devanagari script, English segments in Latin script
- Per-segment language tagging enables downstream processing

**Script conversion options:**

| Option | Output | Use Case |
|--------|--------|----------|
| Devanagari (default for Hindi) | Original Devanagari script | Native Hindi readers |
| Romanized Hindi | Transliteration via IndicXlit / indic-transliteration | Users who read Hindi in Roman script |
| User choice toggle | UI switch: "Original script" vs "Roman Hindi" | Personal preference |

**Transliteration tools (free, open-source):**
- IndicXlit (AI4Bharat) -- neural transliteration model
- indic-transliteration -- rule-based, lightweight fallback

#### Honest Limitations

| Limitation | Impact | Severity |
|-----------|--------|----------|
| Code-switch boundary detection is imperfect | Some words assigned wrong language tag | Medium |
| Romanization is not standardized | "kya" vs "kiya" ambiguity; multiple valid spellings | Medium |
| Proper nouns in Hindi often mis-transliterated | Names rendered incorrectly in Roman script | Low-Medium |
| Word-level accuracy drop | ~5-15% lower accuracy on code-mixed vs single-language audio | High |

#### Future Improvements

- Fine-tuned model specifically for Hinglish (e.g., trained on Indian podcast data)
- Custom vocabulary/hotwords for common Hindi-English mixed terms
- User correction feedback loop to improve transliteration over time
- Specialized Hinglish models (Sarvam AI, IndicWhisper variants)

### 2.5 Transcription Engine Core (Pluggable Architecture)

**Responsibility:** The actual speech-to-text conversion, abstracted behind a common interface so engines can be swapped without affecting any other component.

#### Engine Interface

```
TranscriptionEngine:
    name() -> str
    version() -> str
    capabilities() -> EngineCapabilities:
        streaming: bool
        diarization: bool
        word_timestamps: bool
        languages: str[]
        max_duration_sec: int
        compute_requirement: "cpu" | "gpu" | "wasm"
    transcribe(audio_ref, options: TranscriptionOptions) -> StandardTranscript
    stream(audio_chunks, options) -> AsyncIterator<PartialTranscript>  # for live mode
```

#### Adapter Implementations

| Adapter | Backend | Best For | Stage |
|---------|---------|----------|-------|
| `WhisperCppAdapter` | whisper.cpp compiled to WASM | Client-side, browser processing, privacy | Stage 1 |
| `FasterWhisperAdapter` | CTranslate2 optimized inference | Server-side CPU (now) / GPU (later), best speed/cost | Stage 1-2+ |
| `WebSpeechAdapter` | Browser Web Speech API | Live mode, zero server cost, Chrome-dependent | Stage 1 |
| `CloudAdapter` (disabled) | Deepgram / AssemblyAI / Google | When budget exists, highest accuracy | Stage 3 |

#### Capability Registry

All registered engines are stored in a capability registry:
- Modules query: "give me an engine that supports diarization" -> registry resolves the best match
- If no engine matches the required capability, graceful degradation (feature disabled, not crash)
- Registry is configuration-driven, not hardcoded

#### Engine Selection Logic

```
1. Check user preference
   - "Process locally" selected --> WASM/WebSpeech only
   - "Best quality" selected --> server-side preferred

2. Check audio characteristics
   - Duration > 15 min + server available --> server-side (WASM too slow)
   - Duration < 5 min --> client-side acceptable

3. Check device capabilities
   - RAM < 4 GB --> prefer server-side (WASM may OOM)
   - No GPU available + long audio --> queue for server worker

4. Check required features
   - Diarization needed --> only engines with diarization capability
   - Word timestamps needed --> filter accordingly

5. Fallback: default configured engine (FasterWhisper on server, WASM on client)
```

#### Engine Fallback Logic

```
Primary engine fails
    |
    v
Try next registered engine in priority order
    |
    v
All engines fail --> return clear error with reason
                     Suggest: retry, different input, or try later
                     NEVER silently fail or return empty results
```

### 2.6 Speaker Intelligence

**Responsibility:** Detect and label different speakers in multi-speaker audio (meetings, interviews, podcasts).

**Technology:** pyannote.audio (free, open-source, state-of-the-art diarization)

| Capability | Description |
|-----------|-------------|
| Speaker detection | Identify number of speakers and their speaking regions |
| Speaker separation | Assign each transcript segment a speaker label (Speaker 1, Speaker 2...) |
| Speaker metadata | Number of speakers detected, speaking time per speaker |

#### Diarization-Transcription Alignment (Critical Design)

Diarization runs **after** transcription (Step 9) and produces speaker time-ranges. These must be aligned with transcript segments:

**The alignment problem:** A transcript segment may contain speech from two speakers (overlapping or turn-taking within a single segment boundary). The schema rule is **one segment = one speaker ALWAYS**.

**Alignment algorithm:**
1. Diarization produces: `[(spk_001, 0.0-4.2), (spk_002, 4.0-8.5), (spk_001, 8.5-12.0), ...]`
2. For each transcript segment, check which speaker(s) overlap with it
3. **Single speaker overlap:** assign `speaker_id` directly
4. **Multiple speaker overlap within one segment:** SPLIT the segment at the speaker boundary:
   - Find the word closest to the speaker turn point (using word timestamps if available, else proportional split)
   - Create two new segments with new UUIDs, each inheriting the appropriate words
   - Recalculate `sequence_index` for all segments
5. After splitting, every segment has exactly one `speaker_id`

**Edge cases:**
- No word timestamps available: split at proportional time point (less accurate, but maintains one-speaker-per-segment rule)
- Very short segments (<1s) from splitting: merge with adjacent same-speaker segment if gap < 0.3s
- Overlapping speech (both talking): assign to the speaker with higher energy/volume in that region; accept imperfection

#### Reality Check: Stage 1 Constraints

| Aspect | Stage 1 (CPU) Reality | Future (GPU) |
|--------|----------------------|--------------|
| Speed | Real-time factor 0.5-2x on CPU (30-min file = 15-60 min) | Near real-time on GPU |
| Feasibility | Only practical for short audio (<10 min) | Practical for any length |
| Accuracy | Good for 2-4 speakers, degrades beyond | Good for 10+ speakers |

**Stage 1 strategy:**
- Diarization is **OPTIONAL** and **disabled by default**
- Enabled only for meeting audio if user explicitly selects it
- Graceful degradation: if unavailable or too slow, transcript delivers without speaker labels
- Clear UI messaging: "Speaker detection may take significant time on long recordings"
- When disabled: `speaker_id` = null for all segments; `speakers` object has count=0

### 2.7 Chunking Engine

**Responsibility:** Split long audio into optimal-length segments for transcription, then merge results back seamlessly.

**Why chunking is necessary:**
- Whisper hallucination increases significantly on segments longer than 30 seconds
- Memory usage scales with segment length
- Enables progress reporting (chunk N of M)
- Enables parallel processing at Stage 2+

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Chunk length | 30-60 seconds | Whisper optimal range; longer = more hallucination |
| Chunk boundaries | VAD silence points | Never cut mid-word or mid-sentence |
| Overlap | 1-2 seconds | Prevents word loss at boundaries |
| Merge strategy | Align overlapping text, deduplicate, correct timestamps | Seamless final output |

**Chunking algorithm:**
1. Run VAD to identify all speech/silence boundaries
2. Find silence gaps closest to 30s intervals
3. Split at those gaps with 1-2s overlap into adjacent chunks
4. If no silence gap within 25-35s range, split at lowest-energy point
5. Never split below 10s (too short for Whisper context)

#### Merge Algorithm (Critical — affects Subtitle Studio timing accuracy)

After all chunks are transcribed, results must be seamlessly merged:

```
Chunk A output: "...everyone, aaj hum discuss"     (ends at t=30.2s local)
Chunk B output: "aaj hum discuss karenge..."        (starts at t=0.0s local, offset=29.0s global)
Overlap region: ~1.2 seconds of duplicated content
```

**Merge steps:**
1. **Identify overlap zone:** last N words of chunk A vs first N words of chunk B (N ≈ overlap_duration / avg_word_duration, typically 3-8 words)
2. **Fuzzy alignment:** use Levenshtein distance / longest common subsequence on the overlap words to find the exact alignment point
3. **Deduplicate:** keep chunk A's version of all text/timestamps up to alignment point; keep chunk B's version from alignment point onward
4. **Timestamp correction:** chunk B's timestamps = raw_timestamps + chunk_B_global_offset
5. **Boundary segment handling:** if the alignment point falls mid-word, round to nearest word boundary
6. **Failure fallback:** if no alignment found (very rare — happens with heavy noise): concatenate chunks with a 0.5s gap between them and flag the boundary in `processing_flags`

**Merge quality validation:**
- Check for duplicate words within ±1s of chunk boundary (indicates bad merge)
- Check for timestamp discontinuities >2s at boundary (indicates missed content)
- If issues detected: log warning, deliver result with a `merge_artifacts` flag (downstream modules can display "timing may be imprecise at [timestamp]")

### 2.8 Output Normalizer

**Responsibility:** Take raw engine output (which varies per engine) and normalize it into the universal StandardTranscript schema.

| Engine | Raw Output Differences | Normalizer Handling |
|--------|----------------------|-------------------|
| FasterWhisper | Word timestamps, segment confidence | Map directly to schema fields |
| whisper.cpp/WASM | Segment-level only, no word timestamps | `words` array left empty/null |
| Web Speech API | Interim + final results, no timestamps | Generate approximate timestamps from timing |
| pyannote (diarization) | Speaker segments with time ranges | Merge speaker labels into transcript segments |

**Normalization rules:**
- Optional fields remain `null` when engine does not provide them
- Never fabricate data -- if engine lacks word timestamps, field is absent
- Confidence values normalized to 0.0-1.0 range regardless of engine scale
- Timestamps always in seconds (float) from audio start

---

## 3. Processing Flow

### 3.1 Batch Mode (Primary Stage 1 Path)

```
User uploads file
    |
    v
[1] INPUT VALIDATION
    |  Check file type (magic bytes), size (<=500MB), duration (<=60min)
    |  Reject with clear error if invalid
    v
[2] JOB CREATION
    |  Assign job_id (UUID v4), enqueue job, return job_id to client immediately
    |  Client starts polling / WebSocket for progress updates
    v
[3] AUDIO EXTRACTION (if video)
    |  FFmpeg: extract audio track --> WAV
    |  Progress: "Extracting audio..."
    v
[4] PREPROCESSING
    |  a) Resample to 16 kHz mono WAV
    |  b) Loudness normalization (FFmpeg loudnorm)
    |  c) Noise reduction (RNNoise, if enabled -- configurable)
    |  d) VAD detection --> identify speech segments
    |  Progress: "Preparing audio..."
    v
[5] LANGUAGE DETECTION
    |  Run on first 30s --> determine language/script mode
    |  If Hinglish detected --> set multilingual mode
    |  Progress: "Detecting language..."
    v
[6] CHUNKING
    |  Split on VAD boundaries, 30-60s chunks, 1-2s overlap
    |  Progress: "Segmenting audio..."
    v
[7] TRANSCRIPTION
    |  For each chunk: engine.transcribe(chunk, options)
    |  Sequential on Stage 1 CPU; parallel on Stage 2+ workers
    |  Progress: "Transcribing... 3/10 segments"
    v
[8] MERGE & NORMALIZE
    |  Merge chunk results, align overlaps, correct timestamps (see Merge Algorithm in 2.7)
    |  Normalize to StandardTranscript schema
    |  Progress: "Finalizing..."
    v
[8b] PUNCTUATION RESTORATION
    |  Check if engine output includes proper punctuation
    |  If not (common with some Whisper configs): run lightweight punctuation model
    |  Options: deepmultilingualpunctuation (free, CPU) or rule-based (faster, less accurate)
    |  Set processing_flags.punctuation_restored = true/false
    |  WHY: Content Studio + Meeting Intelligence NLP depends on sentence boundaries
    |  Progress: (sub-step of finalizing, no separate progress label)
    v
[9] OPTIONAL: DIARIZATION
    |  If requested + available: run speaker detection
    |  Assign speaker labels to segments
    |  Progress: "Detecting speakers..."
    v
[10] OPTIONAL: HINGLISH PROCESSING
     |  If Hinglish: apply transliteration based on user preference
     |  Generate text_display field (transliterated version)
     |  text field remains immutable original
     |  Progress: "Processing languages..."
     v
[10b] OPTIONAL: TOPIC BOUNDARY DETECTION
     |  Heuristic signals for Creator Studio chapter generation:
     |  - Long silence gaps (>2s) between segments = likely topic shift
     |  - Speaker change after silence = likely new topic
     |  - Semantic shift detection (Stage 2: NLP-based)
     |  Stores: segments[].topic_boundary_hint: true/false (optional field)
     |  Progress: (silent step, no user-visible progress)
     v
[11] DELIVERY
     |  Store StandardTranscript in short-TTL store (Redis, 15-30 min TTL)
     |  Notify client: "Ready!"
     |  Delete temp audio file immediately
     v
[12] CLEANUP (after TTL expires)
     |  Auto-delete result from store
     |  Nothing remains on server
```

**Key timing estimates (Stage 1, CPU, base model):**

| Audio Duration | Estimated Processing Time | Bottleneck |
|---------------|--------------------------|-----------|
| 5 minutes | 1-3 minutes | Transcription |
| 15 minutes | 3-8 minutes | Transcription |
| 30 minutes | 5-15 minutes | Transcription |
| 60 minutes | 10-30 minutes | Transcription + merge |

### 3.2 Live Mode

```
User clicks Record
    |
    v
[1] CAPTURE SETUP
    |  Request microphone permission (getUserMedia)
    |  Initialize MediaRecorder (WebM/Opus) OR Web Speech API
    |  Display recording indicator
    v
[2] STREAMING (Web Speech API -- Stage 1 default for live)
    |  Browser sends audio to Google Speech API (free, Chrome only)
    |  Interim results shown immediately (low confidence, visually distinct)
    |  Final results replace interim (high confidence, stable)
    |  Language: auto-detect or user-selected before recording
    v
[3] ON STOP
    |  Final transcript assembled from all final results
    |  Normalize to StandardTranscript schema (quality_score = null, no word timestamps)
    |  Audio recording saved by MediaRecorder as WebM/Opus blob in browser memory
    |  Offer: "Reprocess with full engine for better accuracy?"
    |
    |  REPROCESSING PATH (if user accepts):
    |  - WebM blob uploaded to server as a normal batch job
    |  - Full pipeline runs (preprocessing → chunking → transcription → diarization)
    |  - New high-quality StandardTranscript replaces the live one
    |  - All downstream modules get upgraded data automatically
    |
    |  REPROCESSING PATH (client-side WASM):
    |  - WebM blob fed directly to WASM engine in browser
    |  - No upload needed; full privacy preserved
    |  - Slower but higher quality than Web Speech API
    v
[4] PRIVACY NOTE
    |  Web Speech API sends audio to Google servers -- MUST be disclosed to user
    |  UI shows clear indicator: "Live audio processed by Google"
    |  Alternative (future Stage 2): WASM streaming (local, private, but slower)
    |  User choice: "Use local processing (slower, private)" vs "Use cloud (faster, not private)"
```

**Live mode limitations (be transparent):**

| Limitation | Reason | Mitigation | Downstream Impact |
|-----------|--------|-----------|-------------------|
| Chrome-only | Web Speech API is Chrome/Chromium exclusive | Browser detection + fallback message | All modules: no live if not Chrome |
| No diarization | Live mode has no speaker separation | Offer batch reprocessing after | Meeting Intelligence: single-speaker mode |
| No word timestamps | Web Speech API provides sentence-level only | Approximate from timing (LOW PRECISION) | **Subtitle Studio: cue timing will be imprecise (~2-5s accuracy vs ~0.1s for batch). Show warning: "Subtitles from live recording have approximate timing. Reprocess for precision."** |
| Privacy concern | Audio sent to Google servers | Clear disclosure + future WASM option | Privacy badge changes to "Processed by Google" |
| No Hinglish optimization | Web Speech API has limited Hindi support | Suggest batch mode for Hindi/Hinglish | Content Studio: lower quality Hinglish output |
| No confidence scores | Web Speech API doesn't return per-word confidence | quality_score = null; quality_label = "unknown" | Downstream modules skip confidence-based filtering |

**Critical guidance for downstream modules consuming live transcripts:**
- Check `transcription_meta.engine_name == "web-speech-api"` to detect live origin
- If true: disable features requiring word timestamps (precise subtitle timing, word-level highlighting)
- Offer "Reprocess with full engine" button prominently — batch reprocessing produces full-quality StandardTranscript

---

## 4. Transcript Schema

### StandardTranscript v1.0.0

The universal output schema consumed by all downstream modules. This is the **single most important contract** in the entire platform.

```json
{
  "schema_version": "1.1.0",
  "id": "uuid-v4",
  "created_at": "ISO-8601 timestamp",

  "audio_meta": {
    "duration_sec": 245.6,
    "sample_rate": 16000,
    "channels": 1,
    "format": "wav",
    "original_filename": "meeting-recording.mp4",
    "original_format": "mp4",
    "file_size_bytes": 42000000
  },

  "transcription_meta": {
    "engine_name": "faster-whisper",
    "engine_version": "1.0.0",
    "model": "base",
    "language_detected": "hi+en",
    "language_confidence": 0.87,
    "processing_time_sec": 34.2,
    "compute_type": "cpu",
    "quality_score": 0.78,
    "quality_label": "good"
  },

  "transcript": {
    "full_text": "Hello everyone, aaj hum discuss karenge...",
    "full_text_note": "PLAIN CONCATENATION of segments[].text with newlines. No speaker labels, no timestamps. For convenience/search only.",
    "language": "multilingual",
    "script": "mixed",

    "segments": [
      {
        "id": "seg_a1b2c3d4",
        "sequence_index": 0,
        "start": 0.0,
        "end": 4.5,
        "text": "Hello everyone, aaj hum discuss karenge...",
        "text_display": "Hello everyone, aaj hum discuss karenge...",
        "language": "hi+en",
        "speaker_id": "spk_001",
        "confidence": 0.92,
        "topic_boundary_hint": false,
        "words": [
          { "word": "Hello", "start": 0.0, "end": 0.4, "confidence": 0.98, "language": "en" },
          { "word": "everyone", "start": 0.5, "end": 1.1, "confidence": 0.95, "language": "en" },
          { "word": "aaj", "start": 1.3, "end": 1.5, "confidence": 0.88, "language": "hi" },
          { "word": "hum", "start": 1.6, "end": 1.8, "confidence": 0.90, "language": "hi" },
          { "word": "discuss", "start": 1.9, "end": 2.4, "confidence": 0.94, "language": "en" },
          { "word": "karenge", "start": 2.5, "end": 3.0, "confidence": 0.85, "language": "hi" }
        ]
      }
    ],

    "speakers": {
      "count": 2,
      "entries": [
        { "id": "spk_001", "label": "Speaker 1", "display_name": null },
        { "id": "spk_002", "label": "Speaker 2", "display_name": null }
      ],
      "speaking_time": {
        "spk_001": 145.2,
        "spk_002": 100.4
      }
    }
  },

  "processing_flags": {
    "diarization_applied": true,
    "noise_reduction_applied": true,
    "punctuation_restored": true,
    "is_partial": false,
    "partial_gap_segments": [],
    "hinglish_detected": true,
    "transliteration_applied": "roman",
    "topic_boundaries_detected": true,
    "merge_artifacts": false,
    "live_origin": false
  }
}
```

### Schema Rules

| Rule | Description |
|------|-------------|
| `segments` array is CORE | Every downstream module consumes this; never empty on success |
| `segments[].id` is a stable UUID string | Never sequential integers; gaps are impossible; safe for referencing across edits |
| `segments[].sequence_index` is 0-based position | Use for ordering/display; IDs are for identity, sequence_index is for order |
| `segments[].text` is immutable original | Always the raw engine output in original script; never modified by transliteration |
| `segments[].text_display` is the user-visible version | May be transliterated; downstream UI modules use this for display |
| `segments[].speaker_id` references speakers.entries[].id | Never a raw string; rename = update entry display_name, segments untouched |
| `words` array is OPTIONAL | Depends on engine capability; null/empty when unavailable |
| `words[].language` is OPTIONAL | Per-word language tag; available when Hinglish detected (Stage 2+ for accuracy) |
| `speaker_id` field is OPTIONAL | Only populated when diarization is available and enabled |
| `confidence` fields are OPTIONAL | Some engines do not provide confidence scores |
| `quality_score` in meta | Aggregate 0.0-1.0; downstream modules use to gate processing (skip NLP on "poor" input) |
| `quality_label` in meta | "excellent" (>0.9), "good" (0.7-0.9), "fair" (0.5-0.7), "poor" (<0.5) |
| `punctuation_restored` flag | Downstream NLP (Content Studio, Meeting Intelligence) checks this before processing |
| `is_partial` flag | Set to `true` when some chunks failed and gaps exist |
| `partial_gap_segments` | Lists segment IDs where transcription data is missing |
| One segment = one speaker ALWAYS | If two speakers overlap in a time range, split into two segments with overlapping timestamps |
| Schema is additive-only | New optional fields = minor version bump; never remove/rename existing fields |
| Breaking changes | Major version bump only; all modules must update simultaneously |

### Speaker Identity Architecture (Critical for Downstream Modules)

Speaker data uses an **indirection layer** so downstream modules can rename, merge, or annotate speakers without modifying segments:

```json
"speakers": {
  "count": 2,
  "entries": [
    { "id": "spk_001", "label": "Speaker 1", "display_name": null },
    { "id": "spk_002", "label": "Speaker 2", "display_name": null }
  ]
}
```

**How renaming works (Transcript Studio, Meeting Intelligence):**
1. User renames "Speaker 1" → "Rahul" in UI
2. Client updates `entries[0].display_name = "Rahul"` (local state)
3. All segments with `speaker_id: "spk_001"` automatically display "Rahul" via lookup
4. No segment-level edits needed; no data loss; undo = set display_name back to null

**How modules resolve speaker name:**
```
display_name ?? label  (show display_name if set, else fall back to label)
```

### Transliteration Architecture (Critical for Hinglish)

The schema supports **non-destructive transliteration** via dual text fields:

| Field | Content | Mutability | Used by |
|-------|---------|-----------|---------|
| `text` | Original engine output (Devanagari for Hindi, Latin for English) | IMMUTABLE — never modified after creation | Content Studio (NLP), Export (original), Search |
| `text_display` | User-facing text (may be Roman Hindi transliterated) | MUTABLE — changes with user preference toggle | Transcript Studio (UI), Subtitle Studio (display) |
| `transliteration_applied` | Which script `text_display` is in ("roman", "devanagari", null) | Updated when user toggles | UI rendering logic |

**Why dual fields matter:**
- Content Studio runs summarization on `text` (original) — NLP models work better on the script they were trained on
- Transcript Studio shows `text_display` — what the user wants to read
- Export Center lets user choose: export in original script or display script
- Undo is trivial: regenerate `text_display` from `text` with a different transliteration setting

### Quality Gate for Downstream Modules

The `quality_score` and `quality_label` fields enable downstream modules to make informed decisions:

| quality_label | quality_score | Downstream behavior |
|---------------|---------------|---------------------|
| excellent | > 0.9 | All modules process normally |
| good | 0.7 - 0.9 | All modules process normally |
| fair | 0.5 - 0.7 | Content Studio shows warning: "Output may be inaccurate"; Meeting Intelligence skips low-confidence action items |
| poor | < 0.5 | Content Studio / Meeting Intelligence show: "Audio quality too low for reliable analysis. Please review transcript manually." Modules still produce output but with prominent warning. |

**Calculation:** `quality_score = mean(segments[].confidence)` where confidence is available; if engine provides no confidence, quality_score = null (modules treat as "unknown quality, proceed with caution").

### full_text Usage Guidance

`full_text` is a **convenience field** — plain concatenation of `segments[].text` joined by newlines. It contains:
- ✅ All text content in original script
- ❌ No speaker labels
- ❌ No timestamps
- ❌ No paragraph/topic boundaries

**Downstream module rules:**
| If module needs... | Use... | NOT... |
|-------------------|--------|--------|
| Text for summarization | `segments[].text` (iterate, join with context) | `full_text` alone (no speaker context) |
| "Who said what" | `segments[].text` + `speaker_id` resolved via `speakers.entries` | `full_text` (no speaker info) |
| Full-text search | `full_text` (fast string search) | Iterating all segments (slow) |
| Export (plain text) | `full_text` (user expects simple text file) | — |
| Topic detection | `segments[]` with timestamps (topic shifts correlate with time gaps + speaker changes) | `full_text` (loses temporal structure) |

**Rule:** Modules that need speaker context, timestamps, or language info MUST iterate `segments[]` directly. `full_text` is for search and simple export only.

### Downstream Module Consumption Map

| Module | Primary Fields Used | Secondary Fields | Quality Gate |
|--------|-------------------|-----------------|--------------|
| Transcript Studio | `segments` (text_display, start, end, speaker_id → resolved name), `full_text` | confidence, words, text (for undo) | Show all results; highlight low-confidence segments |
| Subtitle Studio | `segments` (text_display, start, end), `words` (precise timing) | language, words[].language | Show all; warn if no word timestamps |
| Export Center | `full_text`, `segments` (text or text_display per user choice), `transcription_meta` | all metadata, speakers.entries | No gate — export whatever exists |
| Content Studio | `segments[].text` (ORIGINAL, not display), `full_text` | language, punctuation_restored | Skip NLP if quality_label = "poor"; warn if punctuation_restored = false |
| Meeting Intelligence | `segments` (text, speaker_id, start), `speakers.entries` | confidence, duration | Skip action-item extraction if quality_label = "poor" |
| Creator Studio | `segments` (text_display, start, end), `full_text` | words, sequence_index | No hard gate; warn on "fair" |
| Business Studio | `segments` (text, speaker_id → resolved name), `speakers.entries` | confidence, full_text | Warn on "fair"; skip extraction on "poor" |

**Critical note:** Content Studio and Meeting Intelligence use `segments[].text` (original) for NLP processing — NOT `text_display`. Transliterated Roman Hindi would confuse NLP models trained on Devanagari or English. `text_display` is for human-facing UI only.

---

## 5. Privacy Workflow

### 5.1 Complete Privacy Lifecycle

```
[A] UPLOAD
    |  File received --> stored in /tmp (or in-memory if small enough)
    |  No permanent write to disk. No user association beyond session token.
    |  Session token: short-lived, signed JWT, carries NO PII.
    v
[B] PROCESSING
    |  Temp file read by FFmpeg --> preprocessed chunks in /tmp
    |  Each chunk transcribed --> result held in memory
    |  All temp files wrapped in `finally` block --> guaranteed deletion
    |  Deletion occurs on BOTH success AND failure paths
    v
[C] RESULT DELIVERY
    |  StandardTranscript written to short-TTL store (Redis, 15-30 min TTL)
    |  Client fetches result --> result lives in browser memory only
    |  Client can download/export --> stored on user's device only
    v
[D] CLEANUP (guaranteed)
    |  Temp audio: deleted IMMEDIATELY after transcription completes
    |  Temp chunks: deleted IMMEDIATELY after merge
    |  Result in store: auto-expires after TTL (15-30 min)
    |  Sweeper cron: every 5 min, removes any orphaned /tmp files older than 10 min
    |  Sweeper handles crash recovery (process died before cleanup)
    v
[E] AFTER TTL
    |  Nothing remains on server. Zero trace.
    |  Only copy of transcript: in user's browser or downloaded file.
    |  No analytics on transcript content. No training data retention.
```

### 5.2 Privacy Guarantees by Design

| Guarantee | Implementation |
|-----------|---------------|
| No user database | No accounts, no profiles, no persistent user identity |
| No audio database | Audio never written to permanent storage |
| No transcript database | Results auto-expire; no searchable transcript store |
| Ephemeral sessions | Short-lived signed tokens; no cookies with PII |
| Minimal logging | Logs contain: job_id, duration, engine used, error status ONLY |
| No content in logs | Never log transcript text, filenames (beyond hash), or audio data |
| Crash safety | Sweeper cron ensures temp files are cleaned even after crashes |

**Cloud STT caveat:** If `CloudAdapter` is ever enabled, audio leaves our infrastructure and is sent to a third-party API. This MUST be:
- Disclosed prominently in the UI before processing begins
- Require explicit user opt-in (not default)
- Clearly state which service receives the audio

**Default posture:** Self-hosted / WASM processing = genuine zero-retention, genuine privacy.

### 5.3 Abuse Prevention (Without Login)

Since the platform operates without user accounts, abuse prevention relies on request-level controls:

| Control | Threshold | Action |
|---------|-----------|--------|
| Concurrent job limit | Max 3 per IP | Reject with "too many active jobs" |
| Hourly rate limit | Max 10 jobs per hour per IP | Reject with "rate limit exceeded" |
| Captcha trigger | After 5 jobs in 30 minutes | Cloudflare Turnstile challenge |
| Queue backpressure | Queue depth > 20 | "Service busy, try again in X minutes" |
| File size cap | 500 MB (video), 200 MB (audio) | Reject before upload completes |
| Duration cap | 60 minutes | Reject after duration check |

**Why these limits are acceptable:**
- Legitimate users rarely need more than 3 concurrent transcriptions
- 10 jobs/hour covers even heavy research use
- Captcha only appears after sustained heavy use
- All limits are configurable for self-hosted deployments

---

## 6. Error Handling Strategy

### 6.1 Error Classification & Response

| Error Type | Detection Method | User-Facing Message | Recovery Action |
|-----------|-----------------|---------------------|-----------------|
| Unsupported file format | Magic bytes do not match known formats | "This file format is not supported. Please upload MP3, WAV, M4A, MP4, or other supported formats." | Show supported formats list |
| Corrupt file | FFprobe returns error code | "This file appears to be damaged. Please try a different file." | Suggest re-download or re-export from source |
| No audio track (video) | FFprobe finds 0 audio streams | "No audio track found in this video file." | Suggest uploading a file with audio |
| Empty/silent audio | VAD detects <1s of speech | "No speech detected in this audio. The file may be silent or contain only background noise." | Suggest checking file in media player |
| Audio too short | Duration < 1 second | "Audio is too short. Please upload at least 1 second of audio." | -- |
| File too large | Size check fails | "File is too large (max 500 MB for video, 200 MB for audio)." | Suggest compression or splitting |
| Duration too long | Duration > 60 min | "File exceeds the 60-minute limit. Please trim or split your file." | Link to trimming guidance |
| Poor audio quality | Average confidence < 0.5 across segments | "Audio quality is low. Transcript may contain errors." (WARNING, not error -- still deliver result) | Show result with quality warning badge |
| Engine failure | Engine throws exception or timeout | "Processing failed. Retrying..." (auto-retry up to 3x) | After 3 retries: "Processing failed. Please try again later." |
| Timeout | Processing exceeds 5 min per chunk | "Processing is taking too long. Your file may be too complex." | Suggest shorter file or retry later |
| Queue full | Queue depth > threshold | "The service is busy. Your file is queued at position #N. Estimated wait: X minutes." | Show queue position + ETA |
| Rate limited | IP/token counter exceeded | "Too many requests. Please wait X seconds." | Show countdown timer |
| Partial failure | Some chunks succeed, some fail | "Partial transcript generated. Some sections may be missing." | Deliver partial result + flag gaps in schema |
| WASM out of memory | Browser heap exceeds limit | "Your device doesn't have enough memory for local processing." | Offer server-side fallback or suggest smaller file |

### 6.2 Error Handling Principles

1. **Never show raw errors** -- no stack traces, no engine-specific messages, no internal paths
2. **Always provide a next action** -- retry button, alternative suggestion, or wait time
3. **Partial results beat no results** -- deliver what succeeded, clearly mark gaps
4. **All errors logged server-side** -- job_id + error type + timestamp for debugging (no PII)
5. **Transient errors get auto-retried** -- timeout, engine crash, temporary failures retried 3x before user sees error
6. **Errors are categorized** -- client errors (bad input) get 4xx; server errors (our fault) get 5xx
7. **Progress survives errors** -- if step 7/10 fails, user sees progress up to step 6 and clear failure at 7

### 6.3 Retry Strategy

```
Attempt 1: Primary engine, normal timeout
    |
    | FAIL
    v
Attempt 2: Primary engine, extended timeout (2x)
    |
    | FAIL
    v
Attempt 3: Fallback engine (if available), normal timeout
    |
    | FAIL
    v
Report failure to user with clear message + suggestion
Log: job_id, all attempt details, final error classification
```

### 6.4 Circuit Breaker Pattern

When an engine fails repeatedly across multiple jobs:
- After 5 consecutive failures: mark engine as "degraded"
- After 10 consecutive failures: remove engine from rotation for 5 minutes
- After cooldown: probe with a test request before restoring
- Alert (internal): log warning when engine enters degraded state

---

## 7. Scalability Plan

### Stage 1 -- Near-Zero Budget (Launch)

| Dimension | Approach | Constraint |
|-----------|----------|-----------|
| Compute | Client-side WASM (whisper.cpp tiny/base) + Web Speech API for live | Zero server cost for client-side |
| Server compute | Single CPU worker on cheapest VPS (if available) | $5-10/month max |
| Concurrency | 1-2 concurrent jobs maximum; serial queue processing | Single worker |
| Duration cap | 60 minutes max per file | Memory/time constraint |
| Model | tiny/base (fast, modest accuracy) | ~75 MB model size |
| Diarization | Disabled by default (too slow on CPU) | Real-time factor 0.5-2x |
| Latency | 30-min file = 5-15 min processing (CPU, base model) | Acceptable for Stage 1 |
| Storage | /tmp only; Redis for job state/results (short TTL) | No permanent storage |
| Live mode | Web Speech API only (free, Chrome) | Browser-dependent |

**What works at Stage 1:**
- Short audio files (< 15 min) process in reasonable time
- Client-side WASM eliminates server cost for capable devices
- Web Speech API provides free live transcription
- Full privacy for WASM processing path

**What does not work at Stage 1:**
- Long files (30-60 min) require patience (5-15 min wait)
- No diarization (too slow on CPU)
- No GPU acceleration
- Mobile WASM may OOM on base model
- Only Chrome for live mode

### Stage 2 -- Growing Traffic

| Dimension | Approach | Investment |
|-----------|----------|-----------|
| Compute | Dedicated GPU worker (RTX 3090 or cloud GPU spot instance) | $50-200/month |
| Architecture | API server separate from worker; message queue between them | Decoupled scaling |
| Concurrency | 5-10 concurrent jobs; multiple workers possible | Queue-based |
| Duration cap | 120-180 minutes | GPU handles longer audio |
| Model | large-v3 (high accuracy, especially for Hinglish) | ~1.5 GB model |
| Diarization | Enabled (pyannote on GPU is fast enough) | Real-time factor 0.1-0.3x on GPU |
| Latency | 30-min file = 1-3 min processing (GPU, large-v3) | Major improvement |
| Storage | Object store (S3-compatible) with lifecycle auto-delete | Still privacy-first |
| Real-time | Server-side streaming via faster-whisper streaming mode | True streaming |
| Live mode | WASM streaming as private alternative to Web Speech API | Privacy option |

### Stage 3 -- Large-Scale Platform

| Dimension | Approach | Investment |
|-----------|----------|-----------|
| Compute | Autoscaled GPU worker pool (Kubernetes / cloud functions) | $500-5000+/month |
| Concurrency | 50-100+ concurrent jobs; auto-scale on queue depth | Elastic |
| Duration cap | 6+ hours (full podcast/lecture/conference) | No practical limit |
| Model | large-v3 + fine-tuned Hinglish model + multi-engine A/B testing | Custom models |
| Diarization | Real-time + accurate + speaker identification (enrollment) | Advanced features |
| Latency | 30-min file < 1 min (batched, large pool) | Near-instant |
| Storage | Object store + CDN + tiered (hot/cold) | Enterprise-grade |
| Real-time | Full WebSocket streaming with live diarization + translation | Premium features |
| Global | Multi-region deployment for latency optimization | Global scale |

### What Stays the Same Across All Stages

| Invariant | Reason |
|-----------|--------|
| `TranscriptionEngine` interface | All adapters implement the same contract |
| `StandardTranscript` schema | All modules consume the same output |
| Adapter pattern | New engines added without touching existing code |
| Privacy lifecycle | Delete-after-TTL applies regardless of scale |
| Error handling strategy | Same user experience at any scale |
| Processor integration points | Downstream modules never know which stage is running |

**What changes between stages:** compute placement, model size, concurrency configuration, infrastructure topology. All infrastructure/config, NOT code architecture.

---

## 8. Technical Risks

### Risk Registry

| # | Risk | Severity | Impact | Probability | Mitigation Strategy |
|---|------|----------|--------|-------------|-------------------|
| 1 | **Hinglish accuracy gap** | High | Code-mixed audio is 5-15% less accurate than single-language; user trust affected | High | Multilingual mode, transliteration options, user correction, custom vocab. Accept and disclose the gap honestly. |
| 2 | **CPU transcription speed** | High | 30-min file takes 5-15 min on CPU; users may abandon before result | High | Clear progress UI with ETA, queue position, duration caps. GPU at Stage 2 solves this entirely. |
| 3 | **WASM memory/performance on mobile** | High | Mobile browsers may OOM on base model (~75 MB WASM heap) | Medium | Detect device capability; fallback to Web Speech API on mobile; limit to tiny model; show device warning before processing. |
| 4 | **Chunk boundary word cuts** | Medium | Words split between chunks may be lost or duplicated in final output | Medium | 1-2s overlap between chunks + text alignment merge algorithm. Not perfect -- some artifacts will remain at boundaries. |
| 5 | **Whisper hallucination on silence/noise** | Medium | Whisper generates fake text on silent or heavily noisy segments | Medium | VAD pre-filtering removes silence before engine; noise reduction reduces noise triggers; shorter chunks (30s) reduce hallucination probability. |
| 6 | **Diarization accuracy** | Medium | Speaker labels may be wrong, especially with similar-sounding voices or overlapping speech | Medium | Present labels as "suggested"; allow user editing in Transcript Studio; only show speaker labels when confidence > threshold. |
| 7 | **Web Speech API dependency** | Medium | Live mode depends on Chrome + Google servers; privacy concern + single-browser lock-in | Medium | Disclose Google dependency clearly in UI; offer WASM alternative at Stage 2; browser detection with graceful fallback message for non-Chrome. |
| 8 | **Single-point engine failure** | Medium | If the configured engine crashes or hangs, all active jobs fail | Low | Fallback chain in engine selection; auto-retry with next engine in priority; circuit breaker removes failing engine from rotation. |
| 9 | **FFmpeg dependency** | Low | FFmpeg is a large binary (~80 MB); shared hosting or serverless may not support it | Low | Use FFmpeg.wasm for client-side preprocessing; ensure server environment includes FFmpeg; document as hard requirement. |
| 10 | **Model download size for WASM** | Medium | 40-240 MB model download required for client-side processing | Medium | Lazy download (only when user chooses local processing); Service Worker cache (download once); progressive loading (tiny first, offer base upgrade); clear download progress UX. |

### Risk Acceptance Notes

- Risks #1 and #2 are **accepted** at Stage 1 -- they are inherent to the near-zero budget constraint and will be resolved at Stage 2 with GPU investment.
- Risk #3 requires careful UX -- detecting incapable devices and steering users to server-side processing is critical for user experience.
- Risk #5 (hallucination) is a known Whisper behavior that no amount of architecture can fully eliminate. VAD + chunking + denoise is the industry-standard mitigation.

---

## 9. Future Upgrade Strategy

### 9.1 Engine Upgrades (Drop-in via Adapter Pattern)

| Upgrade | Effort | Trigger |
|---------|--------|---------|
| New Whisper version (v4, etc.) | Write new adapter, test, swap via config | Model release |
| Better Hinglish model (Sarvam, IndicWhisper) | New adapter + fine-tuning evaluation | Quality metric drop |
| Alternative engine (SeamlessM4T, Canary) | New adapter implementing same interface | Performance/quality benchmark |
| A/B testing between engines | Run two adapters in parallel, compare metrics | Quality optimization phase |

**Upgrade process:**
1. Write new adapter implementing `TranscriptionEngine` interface
2. Register in capability registry with feature flags
3. Run A/B comparison on test audio corpus
4. If quality metrics improve, promote to primary via config change
5. Keep previous adapter as fallback for 30 days
6. No downstream module changes required

### 9.2 Compute Upgrades

| From | To | Change Required |
|------|-----|----------------|
| CPU (Stage 1) | GPU (Stage 2) | Config: `device="cuda"` in FasterWhisperAdapter |
| Single worker | Worker pool | Infrastructure: add queue + workers; no code change |
| Server-side | Client WASM | UI routing: detect capability, route to appropriate path |
| Fixed capacity | Auto-scale | Infrastructure: Kubernetes HPA on queue depth metric |

**Key principle:** Compute placement is a configuration/infrastructure concern, never a code architecture change. The same adapter code runs on CPU and GPU with a config flag.

### 9.3 Feature Upgrades

| Feature | Schema Impact | Engine Requirement | Stage |
|---------|--------------|-------------------|-------|
| Word-level timestamps | Already in schema (optional) | Engine must support it | Stage 1 (FasterWhisper) |
| Real-time streaming | `stream()` method in interface | Streaming-capable adapter | Stage 2 |
| Speaker identification | Extension to speakers object | Enrollment pipeline | Stage 3 |
| Custom vocabulary/hotwords | Pass via `options` in transcribe call | Engine hotword support | Stage 2 |
| Punctuation restoration | Post-processor after engine | No engine change needed | Stage 1-2 |
| Sentiment per segment | New optional field in schema | Separate NLP model | Stage 2-3 |
| Translation | New field in schema | Translation model/API | Stage 2-3 |

### 9.4 Quality Upgrades

| Upgrade | Approach | Requirements |
|---------|----------|-------------|
| Larger models | tiny -> base -> medium -> large-v3 | More compute (GPU for large) |
| Domain fine-tuning | Train on domain-specific data (medical, legal, tech) | Training data + GPU time |
| User correction feedback | Client sends corrections -> training dataset (opt-in) | Feedback UI + data pipeline |
| Multi-pass processing | Fast pass (tiny) then accurate pass (large) on low-confidence segments | Two engines + confidence threshold logic |
| Adaptive noise reduction | Auto-tune denoise intensity based on detected noise level | Signal analysis pre-step |

### 9.5 Integration Upgrades

| Integration | Description | Stage |
|-------------|-------------|-------|
| Webhooks | Notify external systems when transcript is ready | Stage 2 |
| Developer API | Expose Speech Engine as standalone REST/gRPC API | Stage 2-3 |
| Batch processing | Upload multiple files, process in queue, deliver all results | Stage 1-2 |
| Calendar integration | Auto-process meeting recordings from calendar links | Stage 3 |
| Storage connectors | Pull from Google Drive, Dropbox, OneDrive | Stage 2-3 |

### 9.6 Versioning Strategy

| Change Type | Version Bump | Backward Compatible | Module Action Required |
|-------------|-------------|--------------------|-----------------------|
| New optional field in schema | Minor (1.0 -> 1.1) | Yes | None (ignore unknown fields) |
| New adapter added | None | Yes | None |
| Engine config change | None | Yes | None |
| Schema field renamed/removed | Major (1.x -> 2.0) | No | All modules update |
| Interface method signature change | Major | No | All adapters update |

**Commitment:** Major version bumps will be extremely rare. The architecture is designed so that nearly all upgrades are additive (minor version or config-only changes). Breaking changes require platform-wide coordination and migration path.

---

## Appendix: Decision Log

| Decision | Rationale | Alternatives Considered |
|----------|-----------|----------------------|
| Pluggable adapter pattern | Future-proofs against engine lock-in; enables gradual upgrades | Direct Whisper integration (rejected: too coupled) |
| 16 kHz mono WAV as internal format | Universal STT input; all engines accept it; simple | Keep original format (rejected: engines have different requirements) |
| 30-60s chunk size | Whisper quality sweet spot; reduces hallucination | Longer chunks (rejected: hallucination); shorter (rejected: lost context) |
| StandardTranscript as universal schema | Single contract for all modules; decouples engine from consumers | Per-module schemas (rejected: duplication, drift) |
| Privacy-by-default (no storage) | Core platform value; differentiator; user trust | Optional storage (rejected: data breach risk, GDPR complexity) |
| Web Speech API for Stage 1 live mode | Zero cost, works immediately, good accuracy | WASM streaming (rejected for Stage 1: too slow, complex) |
| Diarization disabled by default | Too slow on CPU at Stage 1; optional value | Always-on (rejected: unacceptable latency) |
| Redis with TTL for results | Simple, fast, auto-expiring; privacy-friendly | Database (rejected: permanent storage violates privacy); filesystem (rejected: no auto-expire) |

---

*End of Speech Engine Module Architecture Document.*
*Next document: Transcript Studio Module Architecture.*
