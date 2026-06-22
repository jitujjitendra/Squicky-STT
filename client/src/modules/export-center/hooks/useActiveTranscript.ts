/**
 * useActiveTranscript Hook
 *
 * Reads the active transcript ID from sessionStorage and loads the
 * corresponding transcript from the Speech Engine store.
 *
 * Cross-module data flow:
 * 1. Other modules write `squicky:active_transcript_id` to sessionStorage
 * 2. This hook reads that ID
 * 3. Iterates the Speech Engine store transcripts Map to find the matching one
 */

import { useEffect, useCallback } from 'react';
import { useSpeechEngineStore } from '@/modules/speech-engine/store';
import { useExportCenterStore } from '../store';

const SESSION_KEY = 'squicky:active_transcript_id';

/**
 * Hook to load the active transcript from cross-module session storage
 */
export function useActiveTranscript() {
  const setTranscript = useExportCenterStore((s) => s.setTranscript);
  const transcript = useExportCenterStore((s) => s.transcript);
  const transcripts = useSpeechEngineStore((s) => s.transcripts);

  /**
   * Load transcript by looking up the active ID from sessionStorage
   */
  const loadTranscript = useCallback(() => {
    const activeId = sessionStorage.getItem(SESSION_KEY);
    if (!activeId) return;

    // The transcripts Map is keyed by job ID, not transcript ID.
    // Iterate values to find by transcript.id
    for (const [, t] of transcripts) {
      if (t.id === activeId) {
        setTranscript(t);
        return;
      }
    }

    // Fallback: check if activeId is a job key
    const byJobKey = transcripts.get(activeId);
    if (byJobKey) {
      setTranscript(byJobKey);
    }
  }, [transcripts, setTranscript]);

  // Load on mount and when transcripts change
  useEffect(() => {
    loadTranscript();
  }, [loadTranscript]);

  return {
    transcript,
    reload: loadTranscript,
    hasTranscript: transcript !== null,
  };
}
