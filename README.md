# Squicky STT - Speech Intelligence Platform

Privacy-first speech-to-text platform with AI-powered transcription, subtitle generation, meeting intelligence, and content creation. All processing happens locally on your device.

## Live Demo

**[https://jitujjitendra.github.io/Squicky-STT/](https://jitujjitendra.github.io/Squicky-STT/)**

## Features

| Module | Description |
|--------|-------------|
| **Speech Engine** | Multi-format audio/video upload with local transcription |
| **Transcript Studio** | Review, edit, search, and refine transcripts with speaker identification |
| **Subtitle Studio** | Timeline-based subtitle editing with SRT/VTT export |
| **Content Studio** | Transform transcripts into blog posts, articles, and social content |
| **Meeting Intelligence** | Extract action items, decisions, risks, and deadlines |
| **Creator Studio** | YouTube descriptions, podcast notes, shorts/reels content |
| **Business Studio** | Sales intelligence, customer insights, CRM output |
| **Export Center** | Multi-format export (TXT, SRT, VTT, DOCX, PDF, CSV, JSON, HTML, Markdown) |

## Privacy

- All transcription runs locally in the browser
- No cloud uploads, no data collection, no telemetry
- No accounts required, anonymous sessions
- Zero external API calls for processing

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **State**: Zustand (module-level stores)
- **Routing**: React Router v6 (hash-based for GitHub Pages)
- **Styling**: Tailwind CSS + CSS Custom Properties (light/dark themes)
- **Build**: Vite 6
- **Data Fetching**: TanStack React Query
- **Deployment**: GitHub Pages via GitHub Actions

## Architecture

```
client/
  src/
    app/           # Layout, router, providers
    modules/       # Feature modules (speech-engine, transcript-studio, etc.)
    shared/        # Reusable components, hooks, services
    styles/        # Global CSS, tokens, themes
    types/         # Shared TypeScript types
```

Each module follows the structure:
```
module-name/
  components/    # UI components
  hooks/         # React hooks
  services/      # Business logic
  store/         # Zustand state
  types/         # Module-specific types
  index.ts       # Barrel exports
  *Page.tsx      # Page component
```

## Development

```bash
cd client
npm install
npm run dev
```

## Build

```bash
cd client
npm run build
```

Build output goes to `client/dist/`.

## Deployment

Deployment is automated via GitHub Actions on push to `main`. The workflow:

1. Installs dependencies
2. Builds with `BASE_URL=/Squicky-STT/`
3. Deploys to GitHub Pages

To deploy manually:
```bash
cd client
BASE_URL=/Squicky-STT/ npm run build
# Upload dist/ to gh-pages branch
```

## Routes

| Path | Description |
|------|-------------|
| `/#/` | Homepage (landing page, no sidebar) |
| `/#/dashboard` | Dashboard (module hub) |
| `/#/speech-engine` | Speech Engine |
| `/#/transcript` | Transcript Studio |
| `/#/subtitles` | Subtitle Studio |
| `/#/content` | Content Studio |
| `/#/meeting` | Meeting Intelligence |
| `/#/creator` | Creator Studio |
| `/#/business` | Business Studio |
| `/#/export` | Export Center |

## License

Private - All rights reserved.
