/**
 * SpeakerPanel Component
 *
 * Displays speaker list with:
 * - Rename capability
 * - Color indicators
 * - Visibility toggle (filter by speaker)
 */

import React, { useState } from 'react';
import type { SpeakerId } from '@/modules/speech-engine/types';
import { Icon } from '@/shared/components';
import { useSpeakerManager } from '../hooks';

export function SpeakerPanel() {
  const { speakers, renameSpeaker, toggleVisibility } = useSpeakerManager();
  const [editingSpeakerId, setEditingSpeakerId] = useState<SpeakerId | null>(null);
  const [editName, setEditName] = useState('');

  const startRename = (speakerId: SpeakerId, currentName: string) => {
    setEditingSpeakerId(speakerId);
    setEditName(currentName);
  };

  const commitRename = () => {
    if (editingSpeakerId && editName.trim()) {
      renameSpeaker(editingSpeakerId, editName.trim());
    }
    setEditingSpeakerId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      commitRename();
    }
    if (e.key === 'Escape') {
      setEditingSpeakerId(null);
    }
  };

  if (speakers.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
      <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3 flex items-center gap-2">
        <Icon name="user" size={16} />
        Speakers
      </h3>

      <div className="space-y-2">
        {speakers.map((speaker) => (
          <div
            key={speaker.id}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800"
          >
            {/* Color indicator */}
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: speaker.color.color }}
            />

            {/* Name (editable) */}
            {editingSpeakerId === speaker.id ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={commitRename}
                className="flex-1 text-sm bg-transparent border-b border-accent outline-none text-neutral-900 dark:text-neutral-100"
                autoFocus
                aria-label={`Rename ${speaker.displayName}`}
              />
            ) : (
              <button
                onClick={() => startRename(speaker.id, speaker.displayName)}
                className="flex-1 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:text-accent truncate"
                title="Click to rename"
              >
                {speaker.displayName}
              </button>
            )}

            {/* Visibility toggle */}
            <button
              onClick={() => toggleVisibility(speaker.id)}
              className={`p-1 rounded transition-colors ${
                speaker.visible
                  ? 'text-neutral-500 hover:text-neutral-700'
                  : 'text-neutral-300 dark:text-neutral-600'
              }`}
              title={speaker.visible ? 'Hide speaker' : 'Show speaker'}
              aria-label={`${speaker.visible ? 'Hide' : 'Show'} ${speaker.displayName}`}
              aria-pressed={speaker.visible}
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                {speaker.visible ? (
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
                ) : (
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24 M1 1l22 22" />
                )}
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
