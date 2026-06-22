/**
 * useSpeakerManager Hook
 *
 * Provides speaker management: rename, color assignment, visibility filter.
 */

import { useCallback } from 'react';
import type { SpeakerId } from '@/modules/speech-engine/types';
import { useTranscriptStudioStore } from '../store';
import { createSpeakerRenameOperation } from '../services/EditService';

/**
 * Hook providing speaker management capabilities
 */
export function useSpeakerManager() {
  const speakerConfigs = useTranscriptStudioStore((s) => s.speakerConfigs);
  const updateSpeakerName = useTranscriptStudioStore((s) => s.updateSpeakerName);
  const toggleSpeakerVisibility = useTranscriptStudioStore((s) => s.toggleSpeakerVisibility);
  const applyEdit = useTranscriptStudioStore((s) => s.applyEdit);
  const editLayer = useTranscriptStudioStore((s) => s.editLayer);

  /** Rename a speaker (updates config + creates edit operation) */
  const renameSpeaker = useCallback(
    (speakerId: SpeakerId, newName: string) => {
      const config = speakerConfigs.find((c) => c.id === speakerId);
      const previousName = editLayer.speakerRenames[speakerId] ?? config?.displayName ?? '';

      if (previousName === newName) return;

      updateSpeakerName(speakerId, newName);

      const operation = createSpeakerRenameOperation(speakerId, previousName, newName);
      applyEdit(operation);
    },
    [speakerConfigs, editLayer.speakerRenames, updateSpeakerName, applyEdit]
  );

  /** Get display name for a speaker */
  const getSpeakerName = useCallback(
    (speakerId: SpeakerId | undefined): string => {
      if (!speakerId) return 'Unknown';
      const config = speakerConfigs.find((c) => c.id === speakerId);
      return editLayer.speakerRenames[speakerId] ?? config?.displayName ?? speakerId;
    },
    [speakerConfigs, editLayer.speakerRenames]
  );

  /** Get speaker color */
  const getSpeakerColor = useCallback(
    (speakerId: SpeakerId | undefined) => {
      if (!speakerId) return { color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.1)' };
      const config = speakerConfigs.find((c) => c.id === speakerId);
      return config?.color ?? { speakerId, color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.1)' };
    },
    [speakerConfigs]
  );

  /** Check if a speaker is visible (not filtered out) */
  const isSpeakerVisible = useCallback(
    (speakerId: SpeakerId | undefined): boolean => {
      if (!speakerId) return true;
      const config = speakerConfigs.find((c) => c.id === speakerId);
      return config?.visible ?? true;
    },
    [speakerConfigs]
  );

  return {
    speakers: speakerConfigs,
    renameSpeaker,
    getSpeakerName,
    getSpeakerColor,
    isSpeakerVisible,
    toggleVisibility: toggleSpeakerVisibility,
  };
}
