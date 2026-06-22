/**
 * ExportProgress Component
 *
 * Displays pipeline progress with stage indicators and a progress bar.
 * Shows after export is initiated and until completion.
 */

import React from 'react';
import { Badge } from '@/shared/components';
import { useExportCenterStore } from '../store';

/**
 * Export progress display
 */
export function ExportProgress() {
  const progress = useExportCenterStore((s) => s.progress);
  const results = useExportCenterStore((s) => s.results);
  const errors = useExportCenterStore((s) => s.errors);

  if (!progress && results.length === 0 && errors.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      {progress && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              {progress.message}
            </span>
            <Badge variant="info">{progress.stage}</Badge>
          </div>
          <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-accent h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Results
          </h4>
          <div className="space-y-1">
            {results.map((result) => (
              <div
                key={result.format}
                className="flex items-center justify-between p-2 rounded bg-neutral-50 dark:bg-neutral-800"
              >
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  {result.filename || result.format.toUpperCase()}
                </span>
                {result.success ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500">
                      {(result.sizeBytes / 1024).toFixed(1)} KB
                    </span>
                    <Badge variant="success">Done</Badge>
                  </div>
                ) : (
                  <Badge variant="error">Failed</Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <h4 className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">
            Errors
          </h4>
          <ul className="space-y-1">
            {errors.map((error, idx) => (
              <li key={idx} className="text-xs text-red-600 dark:text-red-300">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
