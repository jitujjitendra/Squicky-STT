/**
 * useSearch Hook
 *
 * Provides search functionality within the transcript.
 * Supports keyword search, match highlighting, and navigation.
 */

import { useCallback } from 'react';
import { useTranscriptStudioStore } from '../store';

/**
 * Hook providing transcript search capabilities
 */
export function useSearch() {
  const search = useTranscriptStudioStore((s) => s.search);
  const openSearch = useTranscriptStudioStore((s) => s.openSearch);
  const closeSearch = useTranscriptStudioStore((s) => s.closeSearch);
  const setSearchQuery = useTranscriptStudioStore((s) => s.setSearchQuery);
  const setSearchCaseSensitive = useTranscriptStudioStore((s) => s.setSearchCaseSensitive);
  const nextMatch = useTranscriptStudioStore((s) => s.nextMatch);
  const prevMatch = useTranscriptStudioStore((s) => s.prevMatch);

  /** Toggle search visibility */
  const toggleSearch = useCallback(() => {
    if (search.isOpen) {
      closeSearch();
    } else {
      openSearch();
    }
  }, [search.isOpen, openSearch, closeSearch]);

  return {
    isOpen: search.isOpen,
    query: search.query,
    matches: search.matches,
    activeMatchIndex: search.activeMatchIndex,
    matchCount: search.matches.length,
    caseSensitive: search.caseSensitive,
    openSearch,
    closeSearch,
    toggleSearch,
    setQuery: setSearchQuery,
    setCaseSensitive: setSearchCaseSensitive,
    nextMatch,
    prevMatch,
  };
}
