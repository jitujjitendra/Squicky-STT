/**
 * Toolbar Component
 *
 * Provides toolbar actions for the transcript studio:
 * - Undo / Redo
 * - Search toggle
 * - Display config toggles (timestamps, confidence, speakers)
 * - Send to... integration buttons
 */

import { useNavigate } from 'react-router-dom';
import { Icon, Button } from '@/shared/components';
import { useTranscriptEditor, useSearch } from '../hooks';
import { useTranscriptStudioStore } from '../store';

export function Toolbar() {
  const { canUndo, canRedo, undo, redo } = useTranscriptEditor();
  const { toggleSearch, isOpen: isSearchOpen } = useSearch();
  const config = useTranscriptStudioStore((s) => s.config);
  const updateConfig = useTranscriptStudioStore((s) => s.updateConfig);
  const navigate = useNavigate();

  /** Navigate to target module with transcript context */
  const navigateTo = (path: string) => {
    const store = useTranscriptStudioStore.getState();
    const transcript = store.transcript;
    if (transcript) {
      // Store active transcript ID for receiving module
      sessionStorage.setItem('squicky:active_transcript_id', transcript.id);
      // Store edit layer if modifications exist
      const editLayer = store.editLayer;
      const hasEdits = Object.keys(editLayer.textEdits).length > 0 ||
        Object.keys(editLayer.speakerChanges).length > 0 ||
        editLayer.deletedSegments.length > 0 ||
        Object.keys(editLayer.splits).length > 0 ||
        Object.keys(editLayer.merges).length > 0;
      if (hasEdits) {
        sessionStorage.setItem('squicky:active_edit_layer', JSON.stringify(editLayer));
      }
    }
    navigate(path);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap px-4 py-2 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
      {/* Edit actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M3 10h10a5 5 0 0 1 5 5v2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 10l4-4M3 10l4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)"
          aria-label="Redo"
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M21 10H11a5 5 0 0 0-5 5v2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 10l-4-4M21 10l-4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Button>
      </div>

      {/* Separator */}
      <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700" />

      {/* Search */}
      <Button
        variant={isSearchOpen ? 'secondary' : 'ghost'}
        size="sm"
        onClick={toggleSearch}
        title="Search (Ctrl+F)"
      >
        <Icon name="search" size={14} />
        <span className="hidden sm:inline text-xs">Search</span>
      </Button>

      {/* Separator */}
      <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700" />

      {/* Display toggles */}
      <div className="flex items-center gap-1">
        <ToggleButton
          active={config.showTimestamps}
          onClick={() => updateConfig({ showTimestamps: !config.showTimestamps })}
          label="Timestamps"
        />
        <ToggleButton
          active={config.showConfidence}
          onClick={() => updateConfig({ showConfidence: !config.showConfidence })}
          label="Confidence"
        />
        <ToggleButton
          active={config.showSpeakers}
          onClick={() => updateConfig({ showSpeakers: !config.showSpeakers })}
          label="Speakers"
        />
        <ToggleButton
          active={config.autoScroll}
          onClick={() => updateConfig({ autoScroll: !config.autoScroll })}
          label="Auto-scroll"
        />
      </div>

      {/* Send to integration (desktop only) */}
      <div className="ml-auto hidden lg:flex items-center gap-1">
        <SendToButton label="Export" path="/export" icon="download" navigate={navigateTo} />
        <SendToButton label="Subtitles" path="/subtitles" icon="subtitles" navigate={navigateTo} />
        <SendToButton label="Content" path="/content" icon="content" navigate={navigateTo} />
        <SendToButton label="Meeting" path="/meeting" icon="meeting" navigate={navigateTo} />
        <SendToButton label="Creator" path="/creator" icon="creator" navigate={navigateTo} />
        <SendToButton label="Business" path="/business" icon="business" navigate={navigateTo} />
      </div>
    </div>
  );
}

/** Toggle button for display config */
function ToggleButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 text-xs rounded transition-colors ${
        active
          ? 'bg-accent/10 text-accent font-medium'
          : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
      }`}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

/** Send-to navigation button */
function SendToButton({ label, path, icon, navigate }: { label: string; path: string; icon: string; navigate: (path: string) => void }) {
  return (
    <button
      onClick={() => navigate(path)}
      className="flex items-center gap-1 px-2 py-1 text-xs text-neutral-500 hover:text-accent hover:bg-accent/10 rounded transition-colors"
      title={`Send to ${label}`}
    >
      <Icon name={icon} size={12} />
      <span>{label}</span>
    </button>
  );
}
