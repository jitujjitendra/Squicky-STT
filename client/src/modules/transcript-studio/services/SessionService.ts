/**
 * SessionService
 *
 * Manages auto-save of editing sessions to localStorage.
 * Implements 24-hour TTL expiration and session recovery.
 */

import type { SessionData, EditLayer, EditOperation, SpeakerDisplayConfig } from '../types';

/** localStorage key prefix */
const STORAGE_KEY_PREFIX = 'squicky_transcript_session_';

/** Session TTL: 24 hours in milliseconds */
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

/** Current session data version */
const SESSION_VERSION = 1;

/**
 * Save session data to localStorage
 */
export function saveSession(
  transcriptId: string,
  editLayer: EditLayer,
  undoStack: EditOperation[],
  redoStack: EditOperation[],
  speakerConfigs: SpeakerDisplayConfig[]
): boolean {
  try {
    const sessionData: SessionData = {
      transcriptId,
      editLayer,
      undoStack,
      redoStack,
      speakerConfigs,
      savedAt: Date.now(),
      version: SESSION_VERSION,
    };

    const key = `${STORAGE_KEY_PREFIX}${transcriptId}`;
    localStorage.setItem(key, JSON.stringify(sessionData));
    return true;
  } catch {
    console.warn('[SessionService] Failed to save session');
    return false;
  }
}

/**
 * Load session data from localStorage
 * Returns null if session doesn't exist or has expired
 */
export function loadSession(transcriptId: string): SessionData | null {
  try {
    const key = `${STORAGE_KEY_PREFIX}${transcriptId}`;
    const raw = localStorage.getItem(key);

    if (!raw) return null;

    const data = JSON.parse(raw) as SessionData;

    // Check version compatibility
    if (data.version !== SESSION_VERSION) {
      removeSession(transcriptId);
      return null;
    }

    // Check TTL expiration
    if (Date.now() - data.savedAt > SESSION_TTL_MS) {
      removeSession(transcriptId);
      return null;
    }

    return data;
  } catch {
    console.warn('[SessionService] Failed to load session');
    return null;
  }
}

/**
 * Remove session from localStorage
 */
export function removeSession(transcriptId: string): void {
  try {
    const key = `${STORAGE_KEY_PREFIX}${transcriptId}`;
    localStorage.removeItem(key);
  } catch {
    // Silently fail
  }
}

/**
 * Check if there are unsaved changes (edit layer has modifications)
 */
export function hasUnsavedChanges(editLayer: EditLayer): boolean {
  return (
    Object.keys(editLayer.textEdits).length > 0 ||
    Object.keys(editLayer.speakerChanges).length > 0 ||
    editLayer.deletedSegments.length > 0 ||
    Object.keys(editLayer.splits).length > 0 ||
    Object.keys(editLayer.merges).length > 0 ||
    Object.keys(editLayer.speakerRenames).length > 0
  );
}

/**
 * Check if a session exists and is recoverable
 */
export function hasRecoverableSession(transcriptId: string): boolean {
  const session = loadSession(transcriptId);
  if (!session) return false;
  return hasUnsavedChanges(session.editLayer);
}

/**
 * Clean up expired sessions (call periodically)
 */
export function cleanExpiredSessions(): void {
  try {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (!key.startsWith(STORAGE_KEY_PREFIX)) continue;

      const raw = localStorage.getItem(key);
      if (!raw) continue;

      try {
        const data = JSON.parse(raw) as SessionData;
        if (Date.now() - data.savedAt > SESSION_TTL_MS) {
          localStorage.removeItem(key);
        }
      } catch {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // Silently fail
  }
}
