/**
 * SourcePanel Component
 *
 * Displays the transcript with highlighted segments that were
 * used in the generated content. Provides visual feedback on
 * which parts of the transcript contributed to the output.
 */

import React, { useMemo } from 'react';
import { useContentStudioStore } from '../store';

/**
 * Source transcript panel with highlighting
 */
export function SourcePanel() {
  const transcript = useContentStudioStore((s) => s.transcript);
  const generatedContent = useContentStudioStore((s) => s.generatedContent);

  const usedSet = useMemo(() => {
    if (!generatedContent) return new Set<number>();
    return new Set(generatedContent.usedSegmentIndices);
  }, [generatedContent]);

  if (!transcript) return null;

  const segments = transcript.segments;
  const usedCount = usedSet.size;
  const totalCount = segments.length;

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Source Transcript
          </h3>
          {generatedContent && (
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {usedCount}/{totalCount} segments used
            </span>
          )}
        </div>
        {generatedContent && (
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-xs text-neutral-500">
              <span className="inline-block w-3 h-3 rounded bg-accent/20 border border-accent/40" />
              Used in output
            </span>
          </div>
        )}
      </div>

      <div className="p-3 max-h-[400px] overflow-y-auto space-y-1">
        {segments.map((segment, index) => {
          const isUsed = usedSet.has(index);
          const text = segment.text_display || segment.text;

          return (
            <div
              key={segment.id}
              className={`
                px-2 py-1 rounded text-sm transition-colors
                ${isUsed
                  ? 'bg-accent/10 border-l-2 border-accent text-neutral-700 dark:text-neutral-300'
                  : 'text-neutral-500 dark:text-neutral-500'
                }
              `}
            >
              <span className="text-xs text-neutral-400 mr-2 font-mono">
                {index + 1}
              </span>
              {text}
            </div>
          );
        })}
      </div>
    </div>
  );
}
