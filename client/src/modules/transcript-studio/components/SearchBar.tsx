/**
 * SearchBar Component
 *
 * Provides keyword search with match highlighting, next/prev navigation,
 * match count display, and case sensitivity toggle.
 */

import { useRef, useEffect } from 'react';
import { Icon, Button } from '@/shared/components';
import { useSearch } from '../hooks';

export function SearchBar() {
  const {
    isOpen,
    query,
    matchCount,
    activeMatchIndex,
    caseSensitive,
    closeSearch,
    setQuery,
    setCaseSensitive,
    nextMatch,
    prevMatch,
  } = useSearch();

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when search opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        prevMatch();
      } else {
        nextMatch();
      }
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-surface-secondary dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 rounded-t-lg">
      <Icon name="search" size={16} className="text-neutral-400 flex-shrink-0" />

      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search transcript..."
        className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 outline-none min-w-0"
        aria-label="Search transcript"
      />

      {query && (
        <span className="text-xs text-neutral-500 flex-shrink-0">
          {matchCount > 0 ? `${activeMatchIndex + 1}/${matchCount}` : 'No matches'}
        </span>
      )}

      <button
        onClick={() => setCaseSensitive(!caseSensitive)}
        className={`px-1.5 py-0.5 text-xs rounded font-mono transition-colors ${
          caseSensitive
            ? 'bg-accent/20 text-accent'
            : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
        }`}
        title="Case sensitive"
        aria-label="Toggle case sensitivity"
        aria-pressed={caseSensitive}
      >
        Aa
      </button>

      <div className="flex items-center gap-0.5 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={prevMatch}
          disabled={matchCount === 0}
          aria-label="Previous match"
        >
          <Icon name="chevron-left" size={14} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={nextMatch}
          disabled={matchCount === 0}
          aria-label="Next match"
        >
          <Icon name="chevron-right" size={14} />
        </Button>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={closeSearch}
        aria-label="Close search"
      >
        <Icon name="x" size={14} />
      </Button>
    </div>
  );
}
