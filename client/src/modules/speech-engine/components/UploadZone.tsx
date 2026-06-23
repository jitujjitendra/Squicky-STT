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
      {/* Drop zone with dashed border and gradient background */}
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
              ? 'scale-[1.01] border-accent ring-2 ring-accent/30'
              : ''
          }
          ${isUploading ? 'pointer-events-none opacity-70' : ''}
          border-2 border-dashed border-accent/40
          hover:border-accent/70
        `}
        style={{ background: 'var(--upload-zone-bg, linear-gradient(to bottom, #ffffff, #f3f0ff))' }}
      >
        {/* Mic icon */}
        <div
          className={`
            relative w-20 h-20 rounded-full flex items-center justify-center mb-6
            transition-all duration-300
            ${
              isDragOver
                ? 'bg-accent/20 text-accent scale-110'
                : 'bg-accent/10 text-accent group-hover:bg-accent/15'
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
              <Icon name="x" size={16} className="text-red-500 mt-0.5 shrink-0" />
              <span className="text-sm text-red-600 dark:text-red-300">{error}</span>
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
