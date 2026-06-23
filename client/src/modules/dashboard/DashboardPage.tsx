/**
 * Dashboard Page Component
 *
 * Central hub showing all available modules as interactive cards.
 * Renders within MainLayout (with sidebar and header).
 *
 * Structure:
 * - Welcome/overview section with platform status
 * - Grid of module cards linking to each tool
 */

import { Link } from 'react-router-dom';
import { Icon } from '@/shared/components/Icon';

/** Module card configuration */
interface ModuleCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  path: string;
  badge?: string;
}

const moduleCards: ModuleCard[] = [
  {
    id: 'speech-engine',
    title: 'Speech Engine',
    description: 'Upload and process audio files with AI-powered speech recognition. Supports multiple formats and languages.',
    icon: 'mic',
    path: '/speech-engine',
    badge: 'Core',
  },
  {
    id: 'transcript-studio',
    title: 'Transcript Studio',
    description: 'Review, edit, and refine transcription results with speaker identification and timestamp navigation.',
    icon: 'document',
    path: '/transcript',
    badge: 'Core',
  },
  {
    id: 'export-center',
    title: 'Export Center',
    description: 'Export transcripts in TXT, SRT, VTT, DOCX, and PDF with configurable formatting options.',
    icon: 'download',
    path: '/export',
    badge: 'Core',
  },
  {
    id: 'subtitle-studio',
    title: 'Subtitle Studio',
    description: 'Create and edit synchronized subtitles with timeline editing, style customization, and multi-language support.',
    icon: 'subtitles',
    path: '/subtitles',
    badge: 'Studio',
  },
  {
    id: 'content-studio',
    title: 'Content Studio',
    description: 'Transform transcripts into blog posts, articles, summaries, and social media content.',
    icon: 'content',
    path: '/content',
    badge: 'Studio',
  },
  {
    id: 'meeting-intelligence',
    title: 'Meeting Intelligence',
    description: 'Extract action items, decisions, topics, and participant contributions from recorded discussions.',
    icon: 'meeting',
    path: '/meeting',
    badge: 'Studio',
  },
  {
    id: 'creator-studio',
    title: 'Creator Studio',
    description: 'Show notes generation, chapter markers, highlight extraction, and content repurposing workflows.',
    icon: 'creator',
    path: '/creator',
    badge: 'Studio',
  },
  {
    id: 'business-studio',
    title: 'Business Studio',
    description: 'Business analytics, reporting, and workflow automation with conversation intelligence metrics.',
    icon: 'business',
    path: '/business',
    badge: 'Studio',
  },
];

export function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-2">
          Dashboard
        </h1>
        <p className="text-[var(--text-secondary)] text-base">
          Welcome to Squicky STT. Choose a module to get started with your audio intelligence workflow.
        </p>
      </div>

      {/* Status Bar */}
      <div className="flex flex-wrap items-center gap-4 mb-8 p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border-primary)]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-sm text-[var(--text-secondary)]">All systems operational</span>
        </div>
        <div className="hidden sm:block w-px h-4 bg-[var(--border-primary)]" />
        <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
          <Icon name="shield" size={14} />
          <span>Local processing active</span>
        </div>
        <div className="hidden sm:block w-px h-4 bg-[var(--border-primary)]" />
        <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
          <Icon name="user" size={14} />
          <span>Anonymous session</span>
        </div>
      </div>

      {/* Module Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {moduleCards.map((card) => (
          <Link
            key={card.id}
            to={card.path}
            className="group relative p-5 rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-card)] hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300"
          >
            {/* Badge */}
            {card.badge && (
              <span className="absolute top-4 right-4 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                {card.badge}
              </span>
            )}

            {/* Icon */}
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-4 group-hover:bg-accent/20 transition-colors">
              <Icon name={card.icon} size={20} />
            </div>

            {/* Content */}
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1.5 group-hover:text-accent transition-colors">
              {card.title}
            </h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {card.description}
            </p>

            {/* Hover arrow */}
            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-accent opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Open</span>
              <Icon name="chevron-right" size={12} />
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Start Tip */}
      <div className="mt-10 p-5 rounded-xl bg-accent/5 border border-accent/20">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent flex-shrink-0 mt-0.5">
            <Icon name="mic" size={16} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Quick Start</h4>
            <p className="text-sm text-[var(--text-secondary)]">
              Begin by opening the <Link to="/speech-engine" className="text-accent hover:underline font-medium">Speech Engine</Link> to
              upload an audio file. Your transcript will then be available across all studio modules for editing, export, and analysis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
