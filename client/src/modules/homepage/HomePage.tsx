/**
 * Homepage Component
 *
 * Premium landing page for the Squicky STT platform.
 * This page renders WITHOUT the MainLayout (no sidebar/header)
 * to provide a full-screen, immersive experience.
 *
 * Sections:
 * - Navigation bar with logo and CTA
 * - Hero section with mascot, tagline, and call-to-action
 * - Privacy-first messaging
 * - Module showcase (8 cards)
 * - Footer
 */

import { Link } from 'react-router-dom';

/** Inline SVG squirrel mascot using brand colors */
function SquirrelMascot({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Squicky squirrel mascot"
      role="img"
    >
      {/* Body */}
      <ellipse cx="100" cy="130" rx="40" ry="50" fill="#00d4aa" opacity="0.9" />
      {/* Head */}
      <circle cx="100" cy="75" r="32" fill="#00d4aa" />
      {/* Ears */}
      <ellipse cx="78" cy="50" rx="10" ry="14" fill="#00d4aa" />
      <ellipse cx="122" cy="50" rx="10" ry="14" fill="#00d4aa" />
      <ellipse cx="78" cy="50" rx="6" ry="9" fill="#8b5cf6" opacity="0.6" />
      <ellipse cx="122" cy="50" rx="6" ry="9" fill="#8b5cf6" opacity="0.6" />
      {/* Eyes */}
      <circle cx="88" cy="72" r="6" fill="#1a1a2e" />
      <circle cx="112" cy="72" r="6" fill="#1a1a2e" />
      <circle cx="90" cy="70" r="2" fill="white" />
      <circle cx="114" cy="70" r="2" fill="white" />
      {/* Nose */}
      <ellipse cx="100" cy="82" rx="4" ry="3" fill="#1a1a2e" />
      {/* Cheeks */}
      <circle cx="82" cy="80" r="4" fill="#8b5cf6" opacity="0.3" />
      <circle cx="118" cy="80" r="4" fill="#8b5cf6" opacity="0.3" />
      {/* Tail */}
      <path
        d="M130 120 C160 100 170 70 150 50 C140 40 130 55 135 75 C138 90 135 110 130 120"
        fill="#00d4aa"
        opacity="0.8"
      />
      <path
        d="M132 115 C155 98 162 72 148 55 C142 48 135 60 138 75 C140 88 137 105 132 115"
        fill="#8b5cf6"
        opacity="0.3"
      />
      {/* Arms */}
      <ellipse cx="68" cy="125" rx="8" ry="16" fill="#00d4aa" opacity="0.85" transform="rotate(-15 68 125)" />
      <ellipse cx="132" cy="125" rx="8" ry="16" fill="#00d4aa" opacity="0.85" transform="rotate(15 132 125)" />
      {/* Feet */}
      <ellipse cx="85" cy="175" rx="12" ry="7" fill="#00d4aa" opacity="0.85" />
      <ellipse cx="115" cy="175" rx="12" ry="7" fill="#00d4aa" opacity="0.85" />
      {/* Belly */}
      <ellipse cx="100" cy="135" rx="22" ry="28" fill="white" opacity="0.3" />
      {/* Headphones detail */}
      <path
        d="M70 68 C70 50 80 42 100 42 C120 42 130 50 130 68"
        stroke="#8b5cf6"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <rect x="65" y="64" width="10" height="14" rx="4" fill="#8b5cf6" />
      <rect x="125" y="64" width="10" height="14" rx="4" fill="#8b5cf6" />
    </svg>
  );
}

/** Module card data for the showcase section */
const modules = [
  {
    id: 'speech-engine',
    title: 'Speech Engine',
    description: 'AI-powered speech recognition with multi-format support and local processing.',
    icon: '🎙️',
    path: '/speech-engine',
    color: 'from-teal-500/10 to-emerald-500/10',
  },
  {
    id: 'transcript-studio',
    title: 'Transcript Studio',
    description: 'Review, edit, and refine transcriptions with speaker identification.',
    icon: '📄',
    path: '/transcript',
    color: 'from-blue-500/10 to-cyan-500/10',
  },
  {
    id: 'subtitle-studio',
    title: 'Subtitle Studio',
    description: 'Create synchronized subtitles with timeline editing and style customization.',
    icon: '🎬',
    path: '/subtitles',
    color: 'from-purple-500/10 to-pink-500/10',
  },
  {
    id: 'content-studio',
    title: 'Content Studio',
    description: 'Transform transcripts into blog posts, articles, and social media content.',
    icon: '✍️',
    path: '/content',
    color: 'from-orange-500/10 to-amber-500/10',
  },
  {
    id: 'meeting-intelligence',
    title: 'Meeting Intelligence',
    description: 'Extract action items, decisions, and insights from recorded discussions.',
    icon: '🤝',
    path: '/meeting',
    color: 'from-indigo-500/10 to-violet-500/10',
  },
  {
    id: 'creator-studio',
    title: 'Creator Studio',
    description: 'Show notes, chapter markers, highlights, and repurposing workflows.',
    icon: '🎨',
    path: '/creator',
    color: 'from-rose-500/10 to-pink-500/10',
  },
  {
    id: 'business-studio',
    title: 'Business Studio',
    description: 'Business analytics, reporting, and conversation intelligence metrics.',
    icon: '📊',
    path: '/business',
    color: 'from-emerald-500/10 to-teal-500/10',
  },
  {
    id: 'export-center',
    title: 'Export Center',
    description: 'Export in TXT, SRT, VTT, DOCX, and PDF with formatting options.',
    icon: '📦',
    path: '/export',
    color: 'from-slate-500/10 to-gray-500/10',
  },
];

export function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-glass-strong)] backdrop-blur-xl border-b border-[var(--border-primary)]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <img src="/squicky.svg" alt="Squicky" className="w-8 h-8" />
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-[var(--text-primary)]">Squicky</span>
              <span className="text-xs font-semibold text-accent uppercase tracking-wider">STT</span>
            </div>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Features
            </a>
            <a href="#privacy" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Privacy
            </a>
            <a href="#modules" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Modules
            </a>
          </div>

          {/* CTA */}
          <Link
            to="/dashboard"
            className="px-5 py-2 rounded-full bg-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-accent/20"
          >
            Open Dashboard
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          {/* Hero Text */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Privacy-First Speech Platform
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Your voice,{' '}
              <span className="text-accent">your data,</span>
              <br />
              your control.
            </h1>
            <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-xl mb-8 leading-relaxed">
              Squicky STT transforms speech into actionable text using AI-powered recognition.
              Everything runs locally. No cloud uploads. No data collection. Just results.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link
                to="/dashboard"
                className="px-8 py-3.5 rounded-full bg-accent text-white font-semibold text-base hover:opacity-90 transition-opacity shadow-xl shadow-accent/25"
              >
                Get Started
              </Link>
              <Link
                to="/speech-engine"
                className="px-8 py-3.5 rounded-full border border-[var(--border-primary)] text-[var(--text-primary)] font-semibold text-base hover:bg-[var(--bg-hover)] transition-colors"
              >
                Try Speech Engine
              </Link>
            </div>
          </div>

          {/* Hero Mascot */}
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="absolute inset-0 bg-accent/20 rounded-full blur-3xl scale-75" />
              <SquirrelMascot className="w-64 h-64 md:w-80 md:h-80 relative z-10 drop-shadow-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Privacy-First Section */}
      <section id="privacy" className="py-20 px-6 bg-[var(--surface-card)]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Privacy is not a feature.{' '}
              <span className="text-accent">It's the foundation.</span>
            </h2>
            <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">
              Unlike cloud-based transcription services, Squicky processes everything on your device.
              Your audio never leaves your machine.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-primary)]">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-2xl mb-4">
                🔒
              </div>
              <h3 className="text-lg font-semibold mb-2">Local Processing</h3>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                All transcription happens directly on your device. No server uploads, no cloud processing, no data transmission.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-primary)]">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-2xl mb-4">
                🛡️
              </div>
              <h3 className="text-lg font-semibold mb-2">Zero Data Collection</h3>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                No analytics, no tracking, no telemetry. We do not collect, store, or monetize any of your data. Ever.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-primary)]">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-2xl mb-4">
                👤
              </div>
              <h3 className="text-lg font-semibold mb-2">Anonymous Sessions</h3>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                No accounts required. No sign-ups. No email verification. Open the app and start working immediately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            More than transcription.{' '}
            <span className="text-accent">A complete platform.</span>
          </h2>
          <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">
            From speech recognition to content creation, meeting intelligence to business analytics,
            Squicky provides a full suite of audio intelligence tools.
          </p>
        </div>
      </section>

      {/* Module Showcase */}
      <section id="modules" className="pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {modules.map((mod) => (
              <Link
                key={mod.id}
                to={mod.path}
                className={`group p-5 rounded-2xl border border-[var(--border-primary)] bg-gradient-to-br ${mod.color} hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300`}
              >
                <div className="text-3xl mb-3">{mod.icon}</div>
                <h3 className="text-base font-semibold mb-1.5 group-hover:text-accent transition-colors">
                  {mod.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {mod.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-[var(--border-primary)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/squicky.svg" alt="Squicky" className="w-6 h-6" />
            <span className="text-sm text-[var(--text-secondary)]">
              Squicky STT - Privacy-first speech intelligence
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-xs text-[var(--text-tertiary)]">v0.1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
