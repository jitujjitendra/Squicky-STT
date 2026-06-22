/**
 * Speech Engine Module - Page Component
 * 
 * The home page and primary entry point for the Squicky platform.
 * Will eventually contain the audio upload zone and processing interface.
 * Currently renders a placeholder with upload zone styling hint.
 * 
 * Route: / (home)
 */

import { Icon } from '@/shared/components/Icon';

export function SpeechEnginePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      {/* Upload zone placeholder */}
      <div
        className="
          w-full max-w-2xl p-12
          border-2 border-dashed border-[var(--border-secondary)]
          rounded-card-lg flex flex-col items-center
          bg-[var(--bg-secondary)] hover:border-accent
          transition-colors duration-200 cursor-pointer
          group
        "
      >
        {/* Icon */}
        <div
          className="
            w-20 h-20 rounded-full flex items-center justify-center mb-6
            bg-accent/10 text-accent
            group-hover:bg-accent/20 transition-colors duration-200
          "
        >
          <Icon name="mic" size={36} />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">
          Speech Engine
        </h1>

        {/* Description */}
        <p className="text-[var(--text-secondary)] text-center max-w-md mb-6">
          Drop audio files here or click to upload. Supports MP3, WAV, FLAC, M4A, OGG,
          and more. All processing happens locally on your device.
        </p>

        {/* Privacy notice */}
        <div className="flex items-center gap-2 text-sm text-privacy">
          <Icon name="shield" size={16} />
          <span>Privacy-first: Your audio never leaves your device</span>
        </div>
      </div>

      {/* Supported formats */}
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {['MP3', 'WAV', 'FLAC', 'M4A', 'OGG', 'WEBM'].map((format) => (
          <span
            key={format}
            className="
              px-3 py-1 text-xs rounded-full
              bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]
              font-mono
            "
          >
            .{format.toLowerCase()}
          </span>
        ))}
      </div>

      {/* Coming soon indicator */}
      <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-tertiary)] text-sm">
        <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        <span>Processing engine coming soon</span>
      </div>
    </div>
  );
}
