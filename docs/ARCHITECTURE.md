# Squicky Speech Intelligence Platform (SSIP)
## Master Architecture Document

> **Status:** Foundation / Architecture Phase — No code yet.
> **Author role:** Lead Solution Architect, Product Architect, UI Architect, Security Architect, Technical Project Lead.
> **Audience:** Founders, contributors, future engineers.
> **Golden rule of this document:** Every recommendation is constrained by a *near-zero budget*. Where a "better" option exists but costs money, it is listed as a **future upgrade path**, not a launch requirement.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision](#2-product-vision)
3. [System Architecture](#3-system-architecture)
4. [Module Architecture](#4-module-architecture)
5. [Folder Structure](#5-folder-structure)
6. [Data Flow Diagram](#6-data-flow-diagram)
7. [Processing Flow](#7-processing-flow)
8. [Privacy Model](#8-privacy-model)
9. [Scalability Roadmap](#9-scalability-roadmap)
10. [Technical Stack](#10-technical-stack)
11. [Risk Analysis](#11-risk-analysis)
12. [Future Upgrade Strategy](#12-future-upgrade-strategy)
13. [Development Roadmap](#13-development-roadmap)

---

## 1. Executive Summary

Squicky is **not** a transcription website. It is a **Speech Intelligence Platform (SSIP)** designed around one promise:

> **Audio/Video → Understanding → Intelligence → Export**

A user drops in a recording and walks away with *useful outputs* — clean transcripts, subtitles, summaries, action items, content drafts — without creating an account and without their data being stored permanently.

This document defines the **foundation**: how the platform is structured so it can start on near-zero infrastructure (even Hostinger shared hosting), survive engine changes (Whisper today, something better tomorrow), and grow from 8 modules to 20+ without a rewrite.

**The three architectural bets that everything else hangs on:**

1. **Pluggable Speech Engine.** The platform never calls a transcription model directly. It calls an *interface*. Engines are swappable adapters. If OpenAI kills Whisper tomorrow, we change one adapter, not the platform.
2. **Modular "one upload → many outputs" pipeline.** Transcription is just the first processor. Every other module (subtitles, summaries, content) is a downstream processor that consumes a *standard transcript schema*. Adding a module = adding a processor, not redesigning the system.
3. **Privacy by architecture, not by policy.** No-login and no-permanent-storage are enforced by *how data flows* (ephemeral processing, hard TTL deletion, client-owned results), not by a promise in a privacy page.

**The honest tradeoff up front:** With near-zero budget and no GPU, Squicky cannot win on raw accuracy, real-time low-latency streaming, or long-audio speed against Google/Deepgram/AssemblyAI. It competes on **privacy, zero-friction (no login), Hinglish/Indian-language handling, and "one upload → many outputs" productivity** — for short-to-medium audio. Everything in this document is designed to make that narrow position excellent and the future expansion cheap.

---

## 2. Product Vision

### 2.1 What Squicky is

Squicky turns recordings into **understanding and intelligence**, not just text.

| Layer | What the user gets |
|-------|--------------------|
| **Audio/Video** | They upload or record. |
| **Understanding** | Accurate transcript, speakers, timestamps, language handling (incl. Hinglish). |
| **Intelligence** | Summaries, action items, chapters, key points, content drafts, subtitles. |
| **Export** | Clean, portable outputs (TXT, SRT, VTT, DOCX, MD, JSON) they fully own. |

### 2.2 Core Product Principles (and how architecture enforces each)

| # | Principle | How the architecture guarantees it |
|---|-----------|-------------------------------------|
| 1 | No Login Required | Anonymous sessions (signed, short-lived tokens). No user table. |
| 2 | No Permanent User Data Storage | Ephemeral temp files + hard TTL deletion + results returned to client. |
| 3 | Privacy First | Self-hostable engines; client-side processing where possible; zero-retention defaults. |
| 4 | User Owns Their Data | Outputs delivered to the browser; server keeps nothing after TTL. |
| 5 | One Upload → Multiple Outputs | Single transcript schema fans out to many independent processors. |
| 6 | Modular Architecture | Module = self-contained feature + registered processor(s). |
| 7 | Future-Proof Design | Adapter pattern for engines; processor registry for features. |
| 8 | Mobile + Desktop | Responsive dashboard, client-side capture via standard web APIs. |
| 9 | Fast & Easy UX | Async jobs + progress UI; simple flow over a complex backend. |
| 10 | Minimal Operational Cost | CPU/open-source-first; client-side compute where feasible; scale only when forced. |

### 2.3 What Squicky deliberately is NOT (scope guardrails)

- Not a TTS / voice-cloning product (that's a different domain).
- Not an enterprise compliance suite (SSO, on-prem, SLAs) at launch.
- Not a real-time low-latency streaming competitor at launch.
- Not a "train our own model" project — we use off-the-shelf open models.

---

## 3. System Architecture

### 3.1 Architectural style

A **modular monolith with a pluggable processing core**, deployed as a thin client + light backend + swappable compute. This is deliberate: microservices at near-zero budget are an ops tax we cannot afford. We keep clean *internal* module boundaries so we can later peel off services *only where resource needs diverge* (e.g. GPU transcription).

### 3.2 High-level layers

```
                          ┌─────────────────────────────────────────────┐
                          │                 CLIENT (SPA)                  │
                          │  React + TS dashboard                         │
                          │  - Upload / Record (MediaRecorder)            │
                          │  - Waveform, progress, editor, export UI      │
                          │  - OPTIONAL client-side STT (WASM) fallback   │
                          └───────────────┬───────────────────────────────┘
                                          │ HTTPS / WebSocket
                          ┌───────────────▼───────────────────────────────┐
                          │              API / GATEWAY LAYER               │
                          │  - Anonymous session + signed token           │
                          │  - Rate limiting / abuse guard                 │
                          │  - Job orchestration (enqueue, status)         │
                          │  - Pre-processing trigger (FFmpeg)             │
                          └───────────────┬───────────────────────────────┘
                                          │
              ┌───────────────────────────┼───────────────────────────────┐
              │                           │                               │
  ┌───────────▼──────────┐   ┌────────────▼───────────┐   ┌───────────────▼────────────┐
  │   QUEUE LAYER        │   │   PROCESSING CORE       │   │   EPHEMERAL STORAGE        │
  │  (jobs + status)     │   │  - Speech Engine        │   │  - temp audio (/tmp)       │
  │  Redis / DB-backed   │   │    (pluggable adapters) │   │  - short-TTL results       │
  │                      │   │  - Processor Registry   │   │  - NO permanent user data  │
  └──────────────────────┘   │    (subtitles, summary, │   └────────────────────────────┘
                             │     content, etc.)      │
                             └─────────────────────────┘
```

### 3.3 The three pillars

**Pillar A — Speech Engine Abstraction (Section 4.3).** Everything that produces a transcript goes through one interface. Engines are interchangeable.

**Pillar B — Processor Registry (Section 4.4).** Everything that *consumes* a transcript (subtitles, summaries, content) is a registered processor with a uniform contract. Modules plug in here.

**Pillar C — Privacy & Session Layer (Section 8).** Anonymous sessions, ephemeral data, hard deletion — built into the request lifecycle, not bolted on.

### 3.4 Why "thin client + light backend + swappable compute"

At Stage 1 (Hostinger / near-zero budget), the backend may be too weak to run heavy ML. So the architecture supports **two compute placements behind the same engine interface**:

- **Client-side compute** — browser Web Speech API or `whisper.cpp`/`transformers.js` (WASM). Zero server cost, automatic privacy (audio never leaves device).
- **Server-side compute** — CPU `faster-whisper`/`whisper.cpp` on a small box; later a GPU worker.

Because both sit behind the same `TranscriptionEngine` interface, *where* transcription happens is a configuration choice, not an architectural one.

**Compute placement decision logic (auto-resolved at runtime):**

| Condition | Compute placement | Rationale |
|-----------|-------------------|-----------|
| No server worker available (Hostinger/static only) | Client-side (WASM or Web Speech) | Only option |
| User's device is low-end (mobile, <4GB RAM) | Server-side (if available) | WASM would be too slow/crash |
| User explicitly chooses "Process locally" | Client-side | Privacy preference respected |
| File > 15 min and server worker exists | Server-side | CPU WASM too slow for long audio |
| Live mic recording | Client-side (Web Speech API) | Lowest latency, zero server cost |

The platform detects device capabilities (RAM via `navigator.deviceMemory`, connection type) and server availability at init, then auto-selects the best path. A manual toggle ("Process on device / Process on server") is always visible for user override.

---

## 4. Module Architecture

### 4.1 Module philosophy

A **module** is a self-contained product surface that:
- has its own route(s) and UI,
- reuses shared UI components and shared services,
- registers one or more **processors** into the processing core,
- consumes the **standard transcript schema** and never talks to a raw engine.

This means a new module is *additive*: new route + new UI + new processor registration. The platform core is untouched.

### 4.2 The 8 launch modules

| # | Module | Consumes | Produces | Stage-1 feasible on near-zero budget? |
|---|--------|----------|----------|----------------------------------------|
| 1 | **Speech Engine** | audio/video | standard transcript (text, segments, timestamps, speakers?) | Yes (CPU/WASM, short audio) |
| 2 | **Transcript Studio** | transcript | edited transcript, search, find/replace, speaker labels | Yes (client-side editing) |
| 3 | **Export Center** | transcript / outputs | TXT, MD, DOCX, PDF, SRT, VTT, CSV, JSON | Yes (mostly client-side) |
| 4 | **Subtitle Studio** | transcript + timestamps | SRT, VTT, styled captions, segment timing | Yes |
| 5 | **Content Studio** | transcript | summaries, key points, blog/social drafts | Partial — needs a text model (see 4.6) |
| 6 | **Meeting Intelligence** | transcript + speakers | action items, decisions, topics, minutes | Partial — needs diarization + text model |
| 7 | **Creator Studio** | transcript + timestamps | chapters, titles, descriptions, highlight clips metadata | Partial |
| 8 | **Business Studio** | transcript | structured notes, templated docs, exportable reports | Partial |

> **Honesty note:** Modules 5–8 depend on a *text understanding* step (summarization, extraction). With no paid AI APIs and no GPU, Stage 1 uses **small local instruct models** (e.g. quantized models via `llama.cpp`/`Ollama` on CPU) or **extractive, non-AI techniques** (keyword/TF-IDF/heuristic summarization). Quality will be modest. Better generative quality is a funded upgrade path (Section 12).

### 4.3 Pluggable Speech Engine (Pillar A)

**The contract.** Every engine implements one interface:

```
TranscriptionEngine
  capabilities() -> { streaming, diarization, word_timestamps, languages[], max_duration }
  transcribe(audioRef, options) -> StandardTranscript
```

**StandardTranscript (the common output schema)** — every engine normalizes to this, so the rest of the platform never sees engine-specific output:

```
StandardTranscript {
  language: string | "auto-detected",
  duration_sec: number,
  segments: [
    {
      id, start, end, text,
      words?: [{ word, start, end, confidence? }],
      speaker?: string
    }
  ],
  meta: { engine_name, engine_version, model, generated_at }
}
```

**Adapters (initial set):**
- `WhisperCppAdapter` — CPU/offline, also compilable to WASM for client-side.
- `FasterWhisperAdapter` — CPU now, GPU later, best speed/cost balance.
- `WebSpeechAdapter` — browser-native live mic (Chrome). Zero server cost.
- `CloudAdapter` (disabled by default) — Deepgram/AssemblyAI slot for when budget exists.

**Capability detection.** Modules ask the engine `capabilities()` before using a feature. If the active engine lacks `diarization`, Meeting Intelligence degrades gracefully (single-speaker mode) instead of breaking. This is how the platform "keeps working even if an engine is replaced."

**Engine replacement strategy.**
1. Write a new adapter implementing the interface + normalization to `StandardTranscript`.
2. Register it; select via config (env/DB) — no code changes elsewhere.
3. Run both engines in parallel (A/B) on a sample set to compare before switching default.
4. Flip the default in config. Rollback = flip back.

**Known limitation of the abstraction.** The common schema risks becoming a *lowest common denominator* (e.g. one engine has no word timestamps). We handle this with **optional fields + capability flags** rather than forcing every engine to fake data. Engine-specific tuning (prompts, beam size) is contained inside the adapter via an `options` bag so it doesn't leak into the platform.

### 4.4 Processor Registry (Pillar B)

A **processor** consumes a `StandardTranscript` (+ optional config) and returns a structured result:

```
Processor
  id, name, requires: { diarization?, word_timestamps?, language? }
  run(transcript, options) -> ProcessorResult
```

The pipeline orchestrator: after transcription, it publishes a "transcript ready" event; registered processors that the user requested run against it (sequentially on Stage 1 CPU; in parallel workers later). Subtitle Studio, Content Studio, etc. are all processors. **Adding module N+1 = registering a new processor.**

### 4.5 Shared services (used by all modules)

- **Session service** — anonymous token issue/verify.
- **Job service** — enqueue, status, progress, result retrieval (short TTL).
- **Media service** — FFmpeg conversion/normalization (16kHz mono), audio extraction from video.
- **Engine service** — engine selection + capability lookup.
- **Storage service** — temp file lifecycle + guaranteed deletion.
- **Rate-limit/abuse service** — IP + token counters, captcha threshold, size/duration caps.
- **Export service** — transcript/outputs → file formats.

### 4.6 Text-intelligence sub-strategy (for modules 5–8)

| Approach | Cost | Quality | When |
|----------|------|---------|------|
| Extractive (TF-IDF, TextRank, heuristics) | Free, CPU-cheap | Basic | Stage 1 default |
| Small local instruct model (quantized, CPU) | Free, CPU-heavy/slow | Moderate | Stage 1 optional / Stage 2 |
| Hosted open model on a GPU worker | $ | Good | Stage 2–3 |
| Paid LLM API | $$ | Best | Funded upgrade |

Same abstraction discipline applies: a `TextIntelligenceProvider` interface so the summarizer/extractor is swappable just like the speech engine.

**TextIntelligenceProvider contract:**

```
TextIntelligenceProvider
  capabilities() -> { summarization, extraction, generation, max_input_tokens?, languages[] }
  process(transcript_text: string, task: TaskType, options?) -> IntelligenceResult

TaskType: "summarize" | "extract_actions" | "extract_faq" | "generate_blog" | "generate_social" | ...

IntelligenceResult {
  task: TaskType,
  output: string | StructuredOutput,
  confidence?: number,
  meta: { provider_name, model?, generated_at }
}
```

**Adapters (initial set):**
- `ExtractiveProvider` — TF-IDF/TextRank, zero-cost, CPU-cheap. Stage 1 default.
- `LocalModelProvider` — quantized instruct model via `llama.cpp`/`Ollama`. CPU-heavy but free. Stage 1 optional.
- `CloudLLMProvider` (disabled by default) — OpenAI/Anthropic/open-router slot for when budget exists.

**Capability detection.** Modules check `capabilities()` before requesting a task. If the active provider lacks `generation`, Content Studio falls back to extractive summaries instead of blog drafts. Same graceful-degradation pattern as the Speech Engine.

### 4.7 Processor dependency and execution ordering

Processors may depend on each other or on engine capabilities. The pipeline orchestrator resolves execution order:

```
Processor
  id, name,
  requires: { diarization?, word_timestamps?, language? },
  depends_on?: [processor_id],        # other processors that must run first
  run(transcript, context, options) -> ProcessorResult
```

**Execution rules:**
1. Processors declare `depends_on` (e.g. Meeting Intelligence depends on diarization output).
2. The orchestrator builds a DAG (directed acyclic graph) of requested processors and runs them in topological order.
3. If a dependency is unavailable (engine lacks capability or upstream processor failed), the processor either degrades gracefully or skips with a clear status message.
4. At Stage 1 (single CPU), execution is sequential in DAG order. At Stage 2+, independent branches run in parallel.

**Partial failure handling:** If chunk 15/20 of a transcription fails, the worker retries *only that chunk* (up to 3 attempts). If retries exhaust, partial results (chunks 1–14, 16–20) are delivered with a gap marker and a clear "partial result" flag in the response — the user sees what succeeded and knows what's missing.

### 4.8 StandardTranscript schema versioning

The `StandardTranscript` schema will evolve (new optional fields, richer metadata). Backward compatibility strategy:

- Schema carries a `schema_version` field (semver, e.g. `"1.0.0"`).
- **Additive-only changes** (new optional fields) = minor version bump. All existing consumers continue working unchanged.
- **Breaking changes** (field removal, type change) = major version bump. Old adapters must be updated. In practice, we avoid breaking changes by keeping fields optional.
- Processors declare the minimum `schema_version` they require. The platform validates compatibility before running.

### 4.9 Client-side WASM model loading strategy

WASM-based transcription (e.g. `whisper.cpp` compiled to WASM) requires downloading large model files to the browser:

| Model | Size (approx.) | Accuracy | Use case |
|-------|----------------|----------|----------|
| tiny  | ~40 MB  | Low     | Quick demo, testing |
| base  | ~75 MB  | Moderate | Default for short audio |
| small | ~240 MB | Good    | When accuracy matters |

**Loading strategy:**
1. **Lazy download:** model is NOT bundled with the app. Downloaded on first use only, with clear progress UI ("Downloading speech model: 45%...").
2. **Cache via Service Worker + Cache API:** once downloaded, model is cached in the browser's Cache Storage. Subsequent visits load instantly from cache.
3. **Progressive upgrade:** start with `tiny` for instant first experience; offer a "Download better model" option for users who want accuracy.
4. **Fallback:** if user cancels download or device has insufficient memory (<2GB free), fall back to Web Speech API (Chrome) with a disclosure that audio is processed via Google.
5. **Storage budget check:** before downloading, check `navigator.storage.estimate()` and warn if space is tight.

---

## 5. Folder Structure

A single repository, organized so module boundaries are obvious and the engine/processor cores are isolated. (Illustrative — names may be refined at implementation time.)

```
squicky-ssip/
├── docs/
│   └── ARCHITECTURE.md                 # this document
│
├── client/                             # Frontend SPA (React + TS)
│   ├── src/
│   │   ├── app/                        # routing, layout, providers
│   │   ├── modules/                    # ONE folder per module
│   │   │   ├── speech-engine/
│   │   │   ├── transcript-studio/
│   │   │   ├── export-center/
│   │   │   ├── subtitle-studio/
│   │   │   ├── content-studio/
│   │   │   ├── meeting-intelligence/
│   │   │   ├── creator-studio/
│   │   │   └── business-studio/
│   │   ├── shared/
│   │   │   ├── components/             # rounded cards, buttons, dialogs (design system)
│   │   │   ├── hooks/
│   │   │   ├── services/               # api client, session, job polling
│   │   │   ├── stt-wasm/               # optional client-side engine (whisper.cpp/transformers.js)
│   │   │   └── lib/
│   │   ├── styles/                     # Squicky branding tokens, theme
│   │   └── types/                      # shared TS types incl. StandardTranscript
│   └── ...
│
├── server/                             # Backend (FastAPI / Python)
│   ├── app/
│   │   ├── api/                        # routes: upload, jobs, status, results
│   │   ├── core/
│   │   │   ├── session/                # anonymous tokens
│   │   │   ├── ratelimit/
│   │   │   └── config/
│   │   ├── engine/                     # PILLAR A
│   │   │   ├── interface.py            # TranscriptionEngine contract
│   │   │   ├── schema.py               # StandardTranscript
│   │   │   ├── registry.py             # engine selection + capabilities
│   │   │   └── adapters/
│   │   │       ├── whisper_cpp.py
│   │   │       ├── faster_whisper.py
│   │   │       └── cloud.py            # disabled by default
│   │   ├── processors/                 # PILLAR B
│   │   │   ├── interface.py            # Processor contract
│   │   │   ├── registry.py
│   │   │   ├── subtitles.py
│   │   │   ├── summary.py
│   │   │   ├── action_items.py
│   │   │   └── ...
│   │   ├── intelligence/               # TextIntelligenceProvider abstraction
│   │   ├── media/                      # FFmpeg wrappers, chunking, VAD
│   │   ├── jobs/                       # queue, workers, progress
│   │   ├── storage/                    # temp lifecycle + hard deletion
│   │   └── export/                     # format generators
│   └── ...
│
├── workers/                            # Background workers (Stage 2+: separable)
├── deploy/                             # deployment configs per stage
└── README.md
```

**Why this shape:** modules are isolated and discoverable; the two cores (`engine/`, `processors/`) are the only places that change when swapping engines or adding capabilities; `shared/` prevents UI duplication.

---

## 6. Data Flow Diagram

```
USER
  │  (1) drops audio/video  — no login, anonymous session token issued
  ▼
CLIENT (SPA)
  │  (2) request signed token + upload slot
  │  (3a) BATCH: upload file (resumable / chunked) ─────────────┐
  │  (3b) LIVE: stream mic via Web Speech (client-side) ──┐     │
  ▼                                                       │     │
API / GATEWAY                                             │     │
  │  (4) validate token, rate-limit, size/duration caps   │     │
  │  (5) hand file to MEDIA SERVICE (FFmpeg → 16kHz mono) │     │
  │  (6) enqueue JOB → returns job_id                     │     │
  ▼                                                       │     │
QUEUE ──► WORKER                                          │     │
  │  (7) ENGINE.transcribe() → StandardTranscript         │     │
  │  (8) run requested PROCESSORS (subtitles/summary/...)  │     │
  │  (9) write result to SHORT-TTL store, push progress    │     │
  ▼                                                       │     │
EPHEMERAL STORAGE                                          │     │
  │  (10) client polls/streams status → fetches result    │     │
  ▼                                                       ▼     ▼
CLIENT  ◄── transcript + outputs ─── (results owned by user, downloaded)
  │
  ▼
(11) TTL EXPIRES → result auto-deleted;  temp audio deleted immediately after step 7
```

**Data ownership rule:** the *only* durable copy of any output lives in the user's browser/download. The server holds data for the **minimum processing window** and nothing beyond TTL.

---

## 7. Processing Flow

### 7.1 Batch (file/video) — the primary Stage-1 path

1. **Upload** directly to a temp location (chunked/resumable so a 2–3 hr file doesn't time out the request). Video → FFmpeg extracts audio.
2. **Normalize** to 16kHz mono; optional loudness normalize + high-pass; optional denoise (RNNoise) — denoise is *tunable* because over-denoising hurts accuracy.
3. **Segment** on VAD/silence boundaries (~30–60s) with small overlap (1–2s) so words aren't cut. Reduces hallucination and enables parallelism later.
4. **Transcribe** each chunk via the active engine; merge with corrected timestamps into one `StandardTranscript`.
5. **Process** requested outputs (subtitles, summary, etc.) via processors.
6. **Deliver** to client; **delete temp audio immediately**; result lives under short TTL.

### 7.2 Live (mic) path

- Stage 1: **client-side Web Speech API** (Chrome) — interim + final results, zero server compute. Disclosed limitation: Chrome-dependent and uses Google's service behind the scenes.
- Future: server-side streaming via a cloud streaming adapter or GPU worker (Section 12).

### 7.3 Why async + progress everywhere

CPU transcription is slow; a 30-minute file can take minutes. Every long operation returns a `job_id` immediately and the UI shows real progress. **No synchronous request ever waits for a multi-minute job.** Workers must be **idempotent with retries** (a crashed chunk re-runs without corrupting the merge).

### 7.4 Stage-1 protection (single CPU reality)

- Hard **duration/size caps** (Stage 1: **max 60 minutes per file**) so one upload can't choke the box.
- **Low concurrency cap** + queue backpressure: process serially or in a tiny worker pool.
- Clear UX messaging: "queued — we'll show your result here" instead of pretending it's instant.

---

## 8. Privacy Model

Privacy is enforced by **data flow**, not policy text.

### 8.1 No-login workflow

- No accounts, no user table, no email. On first request the server issues a **signed, short-lived anonymous session token** (e.g. signed cookie/JWT-like) scoped to that session only.
- The token carries no PII; it exists to tie a job to a browser and to enforce rate limits.

### 8.2 Session handling

- Tokens are short-lived and refreshed within an active session.
- No cross-session linkage, no fingerprinting for tracking. (Abuse counters use coarse signals like IP + token, kept transiently.)

### 8.3 Temporary processing & file deletion workflow

- Audio is processed from memory/stream where possible. When a temp file is required (FFmpeg/Whisper need a path), it lives in `/tmp` and is deleted in a `finally` block **immediately after transcription** — guaranteed cleanup on both success and failure.
- Results are written to a **short-TTL store** (e.g. 10–30 min) so the client can fetch/download, then auto-expire.
- A **sweeper job** removes orphaned temp files left by crashes (defense in depth).
- **No permanent storage of user audio or transcripts** by default.

### 8.4 Abuse prevention & rate limiting

- Anonymous **rate limits**: IP + token counters with TTL.
- **Size/duration caps** per file and per session quota.
- **Captcha/Turnstile** only after a threshold is crossed (keeps normal UX frictionless).
- Queue **backpressure** so a flood degrades gracefully instead of crashing.

### 8.5 The honest privacy caveat

- If a **cloud STT adapter** is ever enabled, audio leaves our infrastructure to that vendor — which weakens the zero-retention claim. Therefore the privacy-strongest configuration is **client-side WASM** or **self-hosted CPU/GPU engines**. Any cloud option must be clearly disclosed and ideally use a zero-retention vendor setting.
- Zero-retention vs. reliability is a real tradeoff: no stored copy means a crashed long job = re-upload. We accept this and mitigate with the short processing-window store + resumable uploads.

---

## 9. Scalability Roadmap

| Dimension | **Stage 1 — Near-zero budget launch** | **Stage 2 — Growing traffic** | **Stage 3 — Large-scale platform** |
|-----------|----------------------------------------|-------------------------------|-------------------------------------|
| Compute | Client-side WASM + single CPU box | Dedicated CPU/GPU worker(s) | Autoscaled GPU worker pool |
| Hosting | Hostinger / cheap VPS (static + light API) | VPS + separate worker node | Cloud, containerized, autoscale |
| Queue | DB-backed or single Redis | Redis + multiple workers | Managed queue, partitioned |
| Storage | `/tmp` + short-TTL in Redis | Object store (temp, lifecycle auto-delete) | Object store + CDN for static |
| Engine | `whisper.cpp`/`faster-whisper` CPU, Web Speech | `faster-whisper` on GPU | Multi-engine, possibly cloud streaming |
| Real-time | Client-side only | Limited server streaming | Full streaming + diarization |
| Concurrency | Very low cap, serial | Moderate, small pool | High, horizontally scaled |

**What stays the same across all stages (the whole point of the architecture):**
- The `TranscriptionEngine` interface and `StandardTranscript` schema.
- The Processor Registry and module contracts.
- The privacy/session model and the client SPA.

**What changes:** *where* compute runs and *how many* workers exist — config and infra, not core code.

**Migration path:** Stage 1→2 = move transcription from the web box to a separate worker node (same adapter, new deployment target) and switch storage from `/tmp`+Redis to an object store with lifecycle rules. Stage 2→3 = containerize workers and autoscale; optionally enable a cloud streaming adapter. No module rewrites at any step.

---

## 10. Technical Stack

Every choice is justified, with limitations and an upgrade path.

| Layer | Recommendation | Why | Limitation | Upgrade path |
|-------|----------------|-----|------------|--------------|
| **Frontend** | React + TypeScript + Vite | Mature ecosystem for rich audio UI (MediaRecorder, WaveSurfer.js, WebSocket), TS keeps a large modular app maintainable | SPA size; SEO needs care | SSR/edge later if marketing pages need SEO |
| **Backend** | Python + FastAPI | ML/STT ecosystem is Python-native (whisper, pyannote, ffmpeg bindings); async-friendly; low glue friction | Python concurrency limits for CPU-bound work → use workers | Keep API in FastAPI, push heavy work to workers |
| **Processing Layer** | `faster-whisper` (CPU now / GPU later) + `whisper.cpp` (incl. WASM); FFmpeg for media | Best free speed/cost balance; self-host = genuine zero-retention; WASM enables client-side | CPU is slow on long audio; small models = lower Hinglish accuracy | GPU worker; larger models (`large-v3`); cloud adapter when funded |
| **Storage Layer** | `/tmp` (temp audio) + short-TTL store for results; Postgres/SQLite for *non-user* metadata only | Matches no-permanent-storage; cheap | No history/resume by design | Object store (S3-compatible) with lifecycle auto-delete |
| **Queue Layer** | Single Redis (or DB-backed queue at the very smallest) | Simple, cheap, supports jobs + progress + TTL results | Single point at Stage 1 | Redis cluster / managed queue (Stage 3) |
| **Export Layer** | Client-side generation where possible (TXT/MD/SRT/VTT/CSV/JSON); server for DOCX/PDF if needed | Keeps data on the client, reduces server cost | Heavy formats need server | Server-side rendering service if volume grows |
| **State Management** | React Query (server/job state) + lightweight store (Zustand) for UI | Job polling/caching fits React Query; Zustand avoids Redux boilerplate | — | Same pattern scales |
| **Deployment Strategy** | Stage 1: static client + light API on Hostinger/cheap VPS; heavy compute client-side or on one small worker | Lowest cost to launch | Shared hosting can't run heavy ML server-side | Containerize; split client / API / worker nodes (Stage 2+) |
| **Monitoring Strategy** | Structured logs + basic metrics (queue depth, job duration, failures); free/self-hosted (e.g. Prometheus/Grafana or hosted free tier) from day 1 | You cannot scale what you can't see; queue/GPU bottlenecks need early visibility | Self-hosting monitoring adds a little ops | Managed observability + tracing at Stage 3 |
| **Text Intelligence** | Extractive (TextRank/TF-IDF) → optional small local instruct model | Free; keeps modules 5–8 alive at Stage 1 | Modest quality | GPU-hosted open model → paid LLM API when funded |

> **Stack honesty:** A polyglot stack (e.g. PHP on Hostinger + Python workers) is possible but adds friction. The recommended path is a **single Python backend + JS client**, with the *option* to serve only the static client from shared hosting and run Python compute elsewhere when shared hosting can't handle it.

---

## 11. Risk Analysis

No marketing — these are the real risks and realistic mitigations.

| # | Risk | Severity | Reality | Mitigation |
|---|------|----------|---------|------------|
| 1 | **Accuracy ceiling** (Hinglish + noisy audio on small CPU models) | High | No free CPU model matches funded cloud accuracy; overlapping speech fails for everyone | Set expectations honestly; offer transliteration options; tune denoise; allow larger models when GPU exists; custom-vocab/prompt biasing |
| 2 | **Long-audio speed on CPU** | High | 2–3 hr files take very long on one CPU | Duration caps at Stage 1; chunking + parallel workers; GPU at Stage 2 |
| 3 | **No-storage vs. reliability** | Medium | Crash mid-job = re-upload; no "re-download later" | Short processing-window store; resumable uploads; idempotent retries |
| 4 | **Abuse without login** | Medium | Anonymous = spammable; one bad actor can choke the queue/bill | IP+token rate limits, size/duration caps, captcha threshold, backpressure |
| 5 | **Hosting limits (Hostinger)** | High | Shared hosting can't run Whisper server-side (no GPU, low RAM, exec-time limits) | Stage 1 = client-side WASM/Web Speech; shared host serves static + light API; move compute to a worker when funded |
| 6 | **Engine dependency** (Whisper discontinued / better model appears) | Medium | Lock-in would be fatal | Adapter pattern + StandardTranscript + capability detection (Section 4.3) |
| 7 | **Real-time + diarization quality** | Medium | Hardest area; weak without GPU | Client-side live at Stage 1; defer accurate server streaming/diarization to Stage 2+ |
| 8 | **Module sprawl (8 → 20)** | Medium | Bad contracts make every new module a hack | Strict Processor contract + StandardTranscript; observability from day 1 |
| 9 | **Text-intelligence quality (modules 5–8)** | Medium | Free/CPU summarization is modest | Extractive baseline now; provider abstraction so models swap in later |
| 10 | **"Private + accurate + cheap + real-time" impossible together** | Strategic | You cannot have all four at once | Prioritize **private + cheap + decent** for short/medium audio; document the tradeoff |

---

## 12. Future Upgrade Strategy

Each upgrade is **drop-in** because of the abstractions above.

1. **Engine upgrades** — add a new adapter (e.g. a better open model, or a cloud streaming engine), A/B test, flip default in config. No platform rewrite.
2. **Compute upgrade** — move transcription from CPU/client to a GPU worker; same `faster-whisper` adapter, new deployment target. Unlocks `large-v3` accuracy and long-audio speed.
3. **Real-time streaming** — enable a streaming adapter (cloud or GPU) behind the same engine interface; UI already supports live results from the Web Speech path.
4. **Diarization at quality** — add `pyannote`/cloud diarization; Meeting Intelligence already declares it via `requires.diarization` and degrades gracefully until then.
5. **Text intelligence** — swap the `TextIntelligenceProvider` from extractive → local model → hosted open model → paid LLM as budget grows. Modules 5–8 improve without code churn.
6. **Storage/scale** — `/tmp`+Redis → object store with lifecycle rules → autoscaled containers. Privacy model unchanged (still TTL-based deletion).
7. **New modules (toward 20+)** — each is a new route + UI + registered processor consuming `StandardTranscript`. Core untouched.
8. **Monetization options (non-architectural, optional)** — paid tier for larger files / faster GPU lane / higher caps, while keeping a free private tier. Doesn't change the privacy model for the free tier.

---

## 13. Development Roadmap

Phased to respect the budget and prove value early. (Aligns with a ~90-day first push, then iterative growth.)

### Phase 0 — Foundation (this document) ✅
- Architecture, contracts, schema, privacy model, repo structure.

### Phase 1 — Core MVP (≈ Days 1–30)
- Client SPA shell with Squicky branding, dashboard, rounded-card design system, responsive.
- Anonymous session + rate limiting + caps.
- Batch pipeline: upload → FFmpeg normalize → chunk → `faster-whisper`/`whisper.cpp` (CPU) → `StandardTranscript` → async job + progress.
- **Speech Engine** + **Transcript Studio** (editor) + **Export Center** (TXT/MD/SRT/VTT/JSON).
- Zero-retention deletion + sweeper.
- Goal: one file reliably transcribed, edited, exported — privately, no login.

### Phase 2 — Quality + Hinglish + first intelligence (≈ Days 31–60)
- Hinglish/code-switch handling + Devanagari↔Roman transliteration toggle.
- **Subtitle Studio** (timing, SRT/VTT styling).
- VAD/denoise tuning; basic diarization (graceful, CPU) where feasible.
- **Content Studio** v1 using extractive summarization (free).
- Observability (logs/metrics) in place; long-audio stability hardening.
- Client-side live mic (Web Speech) path.

### Phase 3 — Expansion + scale prep (≈ Days 61–90)
- **Meeting Intelligence**, **Creator Studio**, **Business Studio** v1 (extractive/heuristic + optional small local model).
- Resumable uploads; concurrency caps + backpressure hardening; abuse hardening.
- Lock the Processor contract so future modules are pure plug-ins.
- Prepare Stage-2 migration (separate worker node, object store) without enabling cost yet.

### Beyond 90 days — funded upgrades
- GPU worker, larger models, accurate diarization, server-side streaming, better text-intelligence provider, autoscaling. All drop-in per Section 12.

---

### Closing note

This architecture is intentionally **modest where money is the constraint** and **strict where flexibility matters**. The strictness lives in three places — the **engine interface**, the **standard transcript schema**, and the **processor registry**. As long as those three hold, Squicky can change engines, add modules, and scale infrastructure for years without a rewrite — which is exactly what a long-term Speech Intelligence Platform needs.
