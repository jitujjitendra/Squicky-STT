/**
 * useCreatorExport Hook
 *
 * Handles exporting creator studio output to the Export Center.
 * Sets source_module: 'creator-studio' and navigates to /export.
 *
 * Architecture decision: Follows the same pattern as Content Studio
 * export - writes export metadata to sessionStorage and navigates.
 */

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreatorStudioStore } from '../store';
import type { OutputCard } from '../types';

const EXPORT_KEY = 'squicky:export_source';

interface ExportPayload {
  source_module: 'creator-studio';
  mode: string;
  cards: Array<{ title: string; content: string }>;
  exportedAt: number;
}

/**
 * Hook providing export functionality for Creator Studio
 */
export function useCreatorExport() {
  const navigate = useNavigate();
  const mode = useCreatorStudioStore((s) => s.mode);
  const youtubeOutputs = useCreatorStudioStore((s) => s.youtubeOutputs);
  const podcastOutputs = useCreatorStudioStore((s) => s.podcastOutputs);
  const shortsOutputs = useCreatorStudioStore((s) => s.shortsOutputs);

  /**
   * Get all output cards for the current mode
   */
  const getActiveCards = useCallback((): OutputCard[] => {
    switch (mode) {
      case 'youtube':
        if (!youtubeOutputs) return [];
        return Object.values(youtubeOutputs);
      case 'podcast':
        if (!podcastOutputs) return [];
        return Object.values(podcastOutputs);
      case 'shorts':
        if (!shortsOutputs) return [];
        return Object.values(shortsOutputs);
      default:
        return [];
    }
  }, [mode, youtubeOutputs, podcastOutputs, shortsOutputs]);

  /**
   * Export all current mode outputs to Export Center
   */
  const exportAll = useCallback(() => {
    const cards = getActiveCards();
    if (cards.length === 0) return;

    const payload: ExportPayload = {
      source_module: 'creator-studio',
      mode,
      cards: cards.map((c) => ({ title: c.title, content: c.content })),
      exportedAt: Date.now(),
    };

    try {
      sessionStorage.setItem(EXPORT_KEY, JSON.stringify(payload));
    } catch {
      console.warn('[Creator Studio] Failed to write export payload to sessionStorage');
    }

    navigate('/export');
  }, [mode, getActiveCards, navigate]);

  /**
   * Export a single card to Export Center
   */
  const exportCard = useCallback((card: OutputCard) => {
    const payload: ExportPayload = {
      source_module: 'creator-studio',
      mode,
      cards: [{ title: card.title, content: card.content }],
      exportedAt: Date.now(),
    };

    try {
      sessionStorage.setItem(EXPORT_KEY, JSON.stringify(payload));
    } catch {
      console.warn('[Creator Studio] Failed to write export payload to sessionStorage');
    }

    navigate('/export');
  }, [mode, navigate]);

  return {
    exportAll,
    exportCard,
    hasOutputs: getActiveCards().length > 0,
  };
}
