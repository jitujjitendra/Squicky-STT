/**
 * useActiveTranscript Hook
 *
 * Reads the active transcript ID from sessionStorage and loads the
 * corresponding transcript from the Speech Engine store.
 *
 * Cross-module data flow:
 * 1. Other modules write `squicky:active_transcript_id` to sessionStorage
 * 2. This hook reads that ID
 * 3. Looks up the transcript in the Speech Engine store
 * 4. Sets it in the Subtitle Studio store
 */

import { useEffect, useCallback } from 'react';
import { useSpeechEngineStore } from '@/modules/speech-engine/store';
import { useSubtitleStudioStore } from '../store';

const SESSION_KEY = 'squicky:active_transcript_id';

/**
 * Hook to load the active transcript from cross-module session storage
 */
export function useActiveTranscript() {
  const setTranscript = useSubtitleStudioStore((s) => s.setTranscript);
  const transcript = useSubtitleStudioStore((s) => s.transcript);
  const transcripts = useSpeechEngineStore((s) => s.transcripts);

  /**
   * Load transcript by looking up the active ID from sessionStorage
   */
  const loadTranscript = useCallback(() => {
    const activeId = sessionStorage.getItem(SESSION_KEY);
    if (!activeId) {
      // Try to load the most recent transcript
      if (transcripts.size > 0) {
        const entries = Array.from(transcripts.values());
        const latest = entries[entries.length - 1];
        if (latest) {
          setTranscript(latest);
          return;
        }
      }
      return;
    }

    // Search by transcript.id
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
