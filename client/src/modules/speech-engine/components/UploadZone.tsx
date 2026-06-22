/**
 * Upload Zone Component - Premium Edition
 *
 * Drag-and-drop file upload area with gradient border, glow effects,
 * and premium glassmorphism design.
 *
 * Architecture decision: The upload zone is the primary entry point
 * for the speech engine. It is designed to be the dominant visual
 * element on the page, guiding users to the core action.
 */

import { Icon } from '@/shared/components/Icon';
import { Button } from '@/shared/components/Button';
import { useFileUpload } from '../hooks/useFileUpload';

export function UploadZone() {
  const {
    isDragOver,
    errors,
    isUploading,
    acceptString,
    inputRef,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleFileChange,
    openFileBrowser,
  } = useFileUpload();

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Drop zone with gradient border */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFileBrowser}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openFileBrowser();
          }
        }}
        aria-label="Upload audio or video files"
        className={`
          relative w-full p-12
          rounded-card-lg
          flex flex-col items-center
          transition-all duration-300 cursor-pointer
          focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2
          group
          ${
            isDragOver
              ? 'bg-accent/5 scale-[1.01] shadow-glow-accent ring-2 ring-accent/30'
              : 'bg-[var(--surface-card)] hover:bg-[var(--surface-card-hover)]'
          }
          ${isUploading ? 'pointer-events-none opacity-70' : ''}
          border border-[var(--border-primary)]
          hover:border-[var(--border-accent)] hover:shadow-glow-accent-sm
        `}
      >
        {/* Gradient border overlay */}
        <div className="absolute inset-0 rounded-card-lg overflow-hidden pointer-events-none">
          <div className="absolute inset-0 rounded-card-lg p-[1px] opacity-30 group-hover:opacity-60 transition-opacity duration-300">
            <div className="absolute inset-0 rounded-card-lg bg-gradient-to-br from-accent/30 via-transparent to-accent-secondary-light/30" />
          </div>
        </div>

        {/* Animated background orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-accent/5 blur-3xl group-hover:bg-accent/10 transition-all duration-500 pulse-glow pointer-events-none" />

        {/* Animated icon */}
        <div
          className={`
            relative w-20 h-20 rounded-2xl flex items-center justify-center mb-6
            transition-all duration-300
            ${
              isDragOver
                ? 'bg-accent/20 text-accent scale-110 shadow-glow-accent'
                : 'bg-accent/10 text-accent group-hover:bg-accent/15 group-hover:shadow-glow-accent-sm'
            }
          `}
        >
          <Icon name="mic" size={36} />
        </div>

        {/* Title */}
        <h2 className="relative text-xl font-semibold text-[var(--text-primary)] mb-2">
          {isDragOver ? 'Drop files here' : 'Upload Audio or Video'}
        </h2>

        {/* Description */}
        <p className="relative text-[var(--text-secondary)] text-center max-w-md mb-6 text-sm leading-relaxed">
          {isDragOver
            ? 'Release to start processing'
            : 'Drag and drop files here, or click to browse. All processing happens locally on your device.'}
        </p>

        {/* Browse button */}
        {!isDragOver && (
          <div className="relative">
            <Button
              variant="primary"
              size="md"
              onClick={(e) => {
                e.stopPropagation();
                openFileBrowser();
              }}
            >
              <Icon name="mic" size={16} />
              Browse Files
            </Button>
          </div>
        )}

        {/* Loading indicator */}
        {isUploading && (
          <div className="relative flex items-center gap-2 mt-4 text-sm text-[var(--text-secondary)]">
            <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            Validating files...
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={acceptString}
          onChange={handleFileChange}
          className="hidden"
          aria-hidden="true"
        />
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mt-4 space-y-2">
          {errors.map((error, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 p-3 rounded-card bg-red-500/5 border border-red-500/20"
            >
              <Icon name="x" size={16} className="text-red-400 mt-0.5 shrink-0" />
              <span className="text-sm text-red-300">{error}</span>
            </div>
          ))}
        </div>
      )}

      {/* Privacy notice */}
      <div className="mt-6 flex items-center justify-center gap-2 text-sm text-privacy">
        <Icon name="shield" size={16} />
        <span>Privacy-first: Your files never leave your device</span>
      </div>

      {/* Supported formats */}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {['MP3', 'WAV', 'M4A', 'AAC', 'OGG', 'FLAC', 'MP4', 'MOV', 'MKV', 'AVI', 'WEBM'].map(
          (format) => (
            <span
              key={format}
              className="px-2.5 py-0.5 text-[10px] rounded-full bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] font-mono border border-[var(--border-primary)]"
            >
              .{format.toLowerCase()}
            </span>
          )
        )}
      </div>
    </div>
  );
}
