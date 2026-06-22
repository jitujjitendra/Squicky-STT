/**
 * useKeyboardShortcuts Hook
 *
 * Registers keyboard shortcuts for the transcript studio:
 * - Space: play/pause audio
 * - Ctrl+F: toggle search
 * - Ctrl+Z: undo
 * - Ctrl+Shift+Z: redo
 * - Escape: exit edit mode / close search
 */

import { useEffect } from 'react';
import { useTranscriptStudioStore } from '../store';

interface KeyboardShortcutOptions {
  /** Callback for play/pause toggle */
  onTogglePlayPause: () => void;
  /** Callback for search toggle */
  onToggleSearch: () => void;
}

/**
 * Hook that registers keyboard shortcuts for transcript studio
 */
export function useKeyboardShortcuts({
  onTogglePlayPause,
  onToggleSearch,
}: KeyboardShortcutOptions) {
  const undo = useTranscriptStudioStore((s) => s.undo);
  const redo = useTranscriptStudioStore((s) => s.redo);
  const setEditingSegment = useTranscriptStudioStore((s) => s.setEditingSegment);
  const closeSearch = useTranscriptStudioStore((s) => s.closeSearch);
  const editingSegmentId = useTranscriptStudioStore((s) => s.editingSegmentId);
  const search = useTranscriptStudioStore((s) => s.search);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Escape: exit edit mode or close search
      if (e.key === 'Escape') {
        if (editingSegmentId) {
          setEditingSegment(null);
          e.preventDefault();
          return;
        }
        if (search.isOpen) {
          closeSearch();
          e.preventDefault();
          return;
        }
      }

      // Ctrl+F: toggle search
      if (e.key === 'f' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onToggleSearch();
        return;
      }

      // Ctrl+Z: undo
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        if (!isInput) {
          e.preventDefault();
          undo();
          return;
        }
      }

      // Ctrl+Shift+Z: redo
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        if (!isInput) {
          e.preventDefault();
          redo();
          return;
        }
      }

      // Space: play/pause (only when not editing text)
      if (e.key === ' ' && !isInput) {
        e.preventDefault();
        onTogglePlayPause();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    undo,
    redo,
    setEditingSegment,
    closeSearch,
    editingSegmentId,
    search.isOpen,
    onTogglePlayPause,
    onToggleSearch,
  ]);
}
