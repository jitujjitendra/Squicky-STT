/**
 * useSessionPersistence Hook
 *
 * Auto-saves editing sessions to localStorage with 24h TTL.
 * Provides session recovery and unsaved changes warning.
 */

import { useEffect, useCallback, useRef } from 'react';
import { useTranscriptStudioStore } from '../store';
import {
  saveSession,
  loadSession,
  removeSession,
  hasUnsavedChanges,
  cleanExpiredSessions,
} from '../services/SessionService';

/** Auto-save interval: 5 seconds */
const AUTO_SAVE_INTERVAL_MS = 5000;

/**
 * Hook providing session persistence capabilities
 */
export function useSessionPersistence() {
  const transcript = useTranscriptStudioStore((s) => s.transcript);
  const editLayer = useTranscriptStudioStore((s) => s.editLayer);
  const undoStack = useTranscriptStudioStore((s) => s.undoStack);
  const redoStack = useTranscriptStudioStore((s) => s.redoStack);
  const speakerConfigs = useTranscriptStudioStore((s) => s.speakerConfigs);
  const restoreSession = useTranscriptStudioStore((s) => s.restoreSession);

  const saveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** Save current session */
  const save = useCallback(() => {
    if (!transcript) return false;
    return saveSession(transcript.id, editLayer, undoStack, redoStack, speakerConfigs);
  }, [transcript, editLayer, undoStack, redoStack, speakerConfigs]);

  /** Recover existing session */
  const recover = useCallback((): boolean => {
    if (!transcript) return false;

    const session = loadSession(transcript.id);
    if (!session) return false;

    restoreSession(
      session.editLayer,
      session.undoStack,
      session.redoStack,
      session.speakerConfigs
    );
    return true;
  }, [transcript, restoreSession]);

  /** Clear saved session */
  const clear = useCallback(() => {
    if (!transcript) return;
    removeSession(transcript.id);
  }, [transcript]);

  /** Check if current state has unsaved changes */
  const hasChanges = hasUnsavedChanges(editLayer);

  // Auto-save on interval
  useEffect(() => {
    if (!transcript) return;

    saveIntervalRef.current = setInterval(() => {
      if (hasUnsavedChanges(editLayer)) {
        saveSession(transcript.id, editLayer, undoStack, redoStack, speakerConfigs);
      }
    }, AUTO_SAVE_INTERVAL_MS);

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, [transcript, editLayer, undoStack, redoStack, speakerConfigs]);

  // Clean expired sessions on mount
  useEffect(() => {
    cleanExpiredSessions();
  }, []);

  // Warn on page unload if unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges(editLayer)) {
        e.preventDefault();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [editLayer]);

  return {
    save,
    recover,
    clear,
    hasChanges,
  };
}
