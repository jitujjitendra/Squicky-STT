/**
 * Export Center Module - Page Component
 *
 * Main page for the Export Center module. Orchestrates the export
 * workflow: format selection, template choice, options, preview, and download.
 *
 * Route: /export
 */

import React from 'react';
import { Button, Icon, Badge } from '@/shared/components';
import { useActiveTranscript } from './hooks/useActiveTranscript';
import { useExportPipeline } from './hooks/useExportPipeline';
import { useExportCenterStore } from './store';
import {
  FormatSelector,
  TemplateSelector,
  OptionsPanel,
  ExportPreview,
  ExportProgress,
} from './components';

/**
 * Export Center page
 */
export function ExportCenterPage() {
  const { transcript, hasTranscript } = useActiveTranscript();
  const { isExporting, executePipeline } = useExportPipeline();
  const selectedFormats = useExportCenterStore((s) => s.selectedFormats);

  // No transcript loaded state
  if (!hasTranscript) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
          <Icon name="download" size={32} className="text-neutral-400" />
        </div>
        <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
          Export Center
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md">
          No transcript loaded. Process an audio file in the Speech Engine and then send it here for export.
        </p>
        <Badge variant="privacy" className="mt-4">
          <Icon name="shield" size={12} />
          100% Client-Side Processing
        </Badge>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
            Export Center
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Export "{transcript?.source.filename}" in multiple formats
          </p>
        </div>
        <Badge variant="privacy">
          <Icon name="shield" size={12} />
          100% Client-Side
        </Badge>
      </div>

      {/* Format selection */}
      <FormatSelector />

      {/* Template and Options - side by side on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TemplateSelector />
        <OptionsPanel />
      </div>

      {/* Preview */}
      <ExportPreview />

      {/* Progress & Results */}
      <ExportProgress />

      {/* Export action */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={isExporting || selectedFormats.length === 0}
          onClick={executePipeline}
          className="sm:w-auto"
        >
          <Icon name="download" size={18} />
          {isExporting
            ? 'Exporting...'
            : selectedFormats.length > 1
              ? `Export ${selectedFormats.length} Formats`
              : selectedFormats.length === 1
                ? `Export as ${selectedFormats[0].toUpperCase()}`
                : 'Select Format(s)'
          }
        </Button>
      </div>
    </div>
  );
}
