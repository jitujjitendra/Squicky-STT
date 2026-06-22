/**
 * ExportPreview Component
 *
 * Shows an approximate text rendering of the export output
 * before the user triggers the download. Supports all text-based formats.
 */

import { useEffect } from 'react';
import { useExportCenterStore } from '../store';
import { useExportPipeline } from '../hooks/useExportPipeline';

/**
 * Export preview panel
 */
export function ExportPreview() {
  const previewContent = useExportCenterStore((s) => s.previewContent);
  const previewFormat = useExportCenterStore((s) => s.previewFormat);
  const selectedFormats = useExportCenterStore((s) => s.selectedFormats);
  const transcript = useExportCenterStore((s) => s.transcript);
  const { generatePreview } = useExportPipeline();

  // Auto-generate preview for the first selected format
  useEffect(() => {
    if (selectedFormats.length > 0 && transcript) {
      generatePreview(selectedFormats[0]);
    }
  }, [selectedFormats, transcript, generatePreview]);

  if (!previewContent || !previewFormat) {
    return (
      <div className="p-6 rounded-lg border-2 border-dashed border-neutral-200 dark:border-neutral-700 text-center">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Select a format to see a preview
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          Preview ({previewFormat.toUpperCase()})
        </h3>
        <div className="flex gap-1">
          {selectedFormats.map((fmt) => (
            <button
              key={fmt}
              type="button"
              onClick={() => generatePreview(fmt)}
              className={`
                px-2 py-1 text-xs rounded transition-colors
                ${fmt === previewFormat
                  ? 'bg-accent text-primary-dark'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }
              `.trim()}
            >
              {fmt.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full overflow-auto rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
        <pre className="p-4 text-xs text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap break-words font-mono max-h-80 overflow-y-auto">
          {previewContent}
        </pre>
      </div>
    </div>
  );
}
