/**
 * Transcript Studio Page Component
 *
 * The CENTRAL WORKSPACE of the platform where users spend most of their time
 * after transcription. Provides transcript viewing, editing, search, speaker
 * management, audio synchronization, and session persistence.
 *
 * Layout:
 * - Top: Toolbar with actions and display toggles
 * - Center: Transcript viewer with segments
 * - Left/Bottom sidebar: Speaker panel + Stats panel
 * - Bottom: Audio player bar
 *
 * Route: /transcript
 */

import { useCallback, useEffect, useState } from 'react';
import { useTranscriptStudioStore } from './store';
import { useSpeechEngineStore } from '@/modules/speech-engine/store';
import { useKeyboardShortcuts, useAudioSync, useSessionPersistence } from './hooks';
import {
  Toolbar,
  TranscriptViewer,
  SearchBar,
  SpeakerPanel,
  StatsPanel,
  AudioPlayerBar,
} from './components';
import { Button, Icon } from '@/shared/components';
import { hasRecoverableSession } from './services/SessionService';

export function TranscriptStudioPage() {
  const transcript = useTranscriptStudioStore((s) => s.transcript);
  const isLoading = useTranscriptStudioStore((s) => s.isLoading);
  const error = useTranscriptStudioStore((s) => s.error);
  const setTranscript = useTranscriptStudioStore((s) => s.setTranscript);
  const setError = useTranscriptStudioStore((s) => s.setError);
  const search = useTranscriptStudioStore((s) => s.search);
  const openSearch = useTranscriptStudioStore((s) => s.openSearch);
  const closeSearch = useTranscriptStudioStore((s) => s.closeSearch);

  const { togglePlayPause, setAudioRef } = useAudioSync();
  const { recover, hasChanges } = useSessionPersistence();

  const [showRecoveryBanner, setShowRecoveryBanner] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Load transcript from speech engine store (most recent)
  useEffect(() => {
    const speechStore = useSpeechEngineStore.getState();
    const transcripts = speechStore.transcripts;

    if (transcripts.size > 0) {
      // Get the most recent transcript
      const entries = Array.from(transcripts.values());
      const latest = entries[entries.length - 1];
      if (latest) {
        setTranscript(latest);
      }
    }
  }, [setTranscript]);

  // Check for recoverable session
  useEffect(() => {
    if (transcript && hasRecoverableSession(transcript.id)) {
      setShowRecoveryBanner(true);
    }
  }, [transcript]);

  /** Handle session recovery */
  const handleRecover = useCallback(() => {
    const success = recover();
    if (success) {
      setShowRecoveryBanner(false);
    }
  }, [recover]);

  /** Dismiss recovery banner */
  const dismissRecovery = useCallback(() => {
    setShowRecoveryBanner(false);
  }, []);

  /** Toggle search */
  const handleToggleSearch = useCallback(() => {
    if (search.isOpen) {
      closeSearch();
    } else {
      openSearch();
    }
  }, [search.isOpen, openSearch, closeSearch]);

  // Register keyboard shortcuts
  useKeyboardShortcuts({
    onTogglePlayPause: togglePlayPause,
    onToggleSearch: handleToggleSearch,
  });

  // Audio element (hidden)
  const audioSrc = transcript?.source?.filename
    ? undefined // In production, this would be an actual audio URL
    : undefined;

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <Icon name="x" size={24} className="text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            Error Loading Transcript
          </h2>
          <p className="text-sm text-neutral-500 mb-4">{error}</p>
          <Button
            variant="secondary"
            onClick={() => setError(null)}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-neutral-500">Loading transcript...</p>
        </div>
      </div>
    );
  }

  // Empty state: no transcript loaded
  if (!transcript) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center">
            <Icon name="document" size={32} className="text-neutral-400" />
          </div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            No Transcript Loaded
          </h2>
          <p className="text-sm text-neutral-500 mb-4">
            Upload and transcribe an audio file from the Speech Engine to get started.
          </p>
          <Button
            variant="primary"
            onClick={() => { window.location.href = '/'; }}
          >
            <Icon name="mic" size={16} />
            Go to Speech Engine
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Hidden audio element */}
      {audioSrc && (
        <audio ref={setAudioRef} src={audioSrc} preload="metadata" />
      )}

      {/* Session recovery banner */}
      {showRecoveryBanner && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-4 py-2 flex items-center gap-3">
          <span className="text-sm text-blue-700 dark:text-blue-300 flex-1">
            A previous editing session was found. Would you like to recover it?
          </span>
          <Button variant="primary" size="sm" onClick={handleRecover}>
            Recover
          </Button>
          <Button variant="ghost" size="sm" onClick={dismissRecovery}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Toolbar */}
      <Toolbar />

      {/* Search bar */}
      <SearchBar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Transcript viewer (main area) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          <TranscriptViewer />
        </div>

        {/* Mobile sidebar toggle */}
        <button
          className="lg:hidden fixed bottom-20 right-4 z-10 w-10 h-10 bg-accent text-white rounded-full shadow-lg flex items-center justify-center"
          onClick={() => setShowMobileSidebar(!showMobileSidebar)}
          aria-label="Toggle sidebar"
        >
          <Icon name="user" size={18} />
        </button>

        {/* Sidebar (desktop: always visible, mobile: overlay) */}
        <div
          className={`
            ${showMobileSidebar ? 'fixed inset-0 z-20 bg-black/50 lg:bg-transparent lg:relative lg:inset-auto' : 'hidden lg:block'}
            lg:relative lg:w-72 lg:border-l lg:border-neutral-200 lg:dark:border-neutral-700
          `}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowMobileSidebar(false);
            }
          }}
        >
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-neutral-50 dark:bg-neutral-900 lg:relative lg:w-full overflow-y-auto p-4 space-y-4">
            <SpeakerPanel />
            <StatsPanel />

            {/* Unsaved changes indicator */}
            {hasChanges && (
              <div className="text-xs text-neutral-400 text-center">
                Unsaved changes (auto-saving...)
              </div>
            )}

            {/* Mobile: Send to buttons */}
            <div className="lg:hidden bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
              <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
                Send to...
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <MobileSendButton label="Export" path="/export" icon="download" />
                <MobileSendButton label="Subtitles" path="/subtitles" icon="subtitles" />
                <MobileSendButton label="Content" path="/content" icon="content" />
                <MobileSendButton label="Meeting" path="/meeting" icon="meeting" />
                <MobileSendButton label="Creator" path="/creator" icon="creator" />
                <MobileSendButton label="Business" path="/business" icon="business" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audio player bar */}
      <AudioPlayerBar />
    </div>
  );
}

/** Mobile send-to button */
function MobileSendButton({ label, path, icon }: { label: string; path: string; icon: string }) {
  return (
    <button
      onClick={() => { window.location.href = path; }}
      className="flex items-center gap-2 p-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-accent hover:bg-accent/10 rounded transition-colors"
    >
      <Icon name={icon} size={14} />
      {label}
    </button>
  );
}
