/**
 * useExportPipeline Hook
 *
 * Orchestrates the 6-stage export pipeline:
 * Receive -> Validate -> Template -> Convert -> Package -> Download
 *
 * All processing is 100% client-side. Uses Blob + createObjectURL for downloads.
 */

import { useCallback } from 'react';
import { useExportCenterStore } from '../store';
import { validateExportPayload } from '../services/ValidationService';
import { applyTemplate } from '../services/TemplateEngine';
import { formatRegistry } from '../services/FormatRegistry';
import { downloadResult, downloadBatch, generateFilename } from '../services/DeliveryService';
import type { ExportPayload, ExportResult, PipelineStage, ExportFormat } from '../types';

/**
 * Hook providing the export pipeline execution
 */
export function useExportPipeline() {
  const transcript = useExportCenterStore((s) => s.transcript);
  const selectedFormats = useExportCenterStore((s) => s.selectedFormats);
  const options = useExportCenterStore((s) => s.options);
  const isExporting = useExportCenterStore((s) => s.isExporting);
  const progress = useExportCenterStore((s) => s.progress);
  const results = useExportCenterStore((s) => s.results);
  const errors = useExportCenterStore((s) => s.errors);

  const setIsExporting = useExportCenterStore((s) => s.setIsExporting);
  const setProgress = useExportCenterStore((s) => s.setProgress);
  const setResults = useExportCenterStore((s) => s.setResults);
  const addError = useExportCenterStore((s) => s.addError);
  const clearErrors = useExportCenterStore((s) => s.clearErrors);
  const clearResults = useExportCenterStore((s) => s.clearResults);
  const setPreview = useExportCenterStore((s) => s.setPreview);

  /**
   * Update progress state
   */
  const updateProgress = useCallback(
    (stage: PipelineStage, percent: number, message: string) => {
      setProgress({ stage, percent, message });
    },
    [setProgress]
  );

  /**
   * Generate preview for a specific format
   */
  const generatePreview = useCallback(
    (format: ExportFormat) => {
      if (!transcript) {
        setPreview(null, null);
        return;
      }

      try {
        const doc = applyTemplate(options.template, transcript, options);
        const content = formatRegistry.convert(format, doc, options);
        // Truncate preview to 2000 chars for performance
        const preview = content.length > 2000
          ? content.slice(0, 2000) + '\n\n... (truncated for preview)'
          : content;
        setPreview(preview, format);
      } catch (err) {
        setPreview(`Error generating preview: ${err instanceof Error ? err.message : 'Unknown error'}`, format);
      }
    },
    [transcript, options, setPreview]
  );

  /**
   * Execute the full export pipeline for all selected formats
   */
  const executePipeline = useCallback(async () => {
    if (!transcript || selectedFormats.length === 0) {
      addError('No transcript or formats selected');
      return;
    }

    setIsExporting(true);
    clearErrors();
    clearResults();

    try {
      // Stage 1: Receive
      updateProgress('receive', 10, 'Preparing export data...');
      const payload: ExportPayload = { transcript, formats: selectedFormats, options };

      // Stage 2: Validate
      updateProgress('validate', 20, 'Validating export payload...');
      const validation = validateExportPayload(payload);
      if (!validation.valid) {
        for (const err of validation.errors) {
          addError(`${err.field}: ${err.message}`);
        }
        setIsExporting(false);
        setProgress(null);
        return;
      }

      // Stage 3: Template
      updateProgress('template', 40, `Applying "${options.template}" template...`);
      const doc = applyTemplate(options.template, transcript, options);

      // Stage 4: Convert
      const exportResults: ExportResult[] = [];
      const formatCount = selectedFormats.length;

      for (let i = 0; i < formatCount; i++) {
        const format = selectedFormats[i];
        const percent = 40 + Math.round((i / formatCount) * 30);
        updateProgress('convert', percent, `Converting to ${format.toUpperCase()}...`);

        try {
          const converter = formatRegistry.get(format);
          if (!converter) {
            exportResults.push({
              format,
              content: '',
              filename: '',
              mimeType: '',
              sizeBytes: 0,
              success: false,
              error: `No converter found for "${format}"`,
            });
            continue;
          }

          const content = converter.convert(doc, options);
          const filename = generateFilename(
            transcript.source.filename,
            format,
            converter.extension
          );

          exportResults.push({
            format,
            content,
            filename,
            mimeType: converter.mimeType,
            sizeBytes: new Blob([content]).size,
            success: true,
          });
        } catch (err) {
          exportResults.push({
            format,
            content: '',
            filename: '',
            mimeType: '',
            sizeBytes: 0,
            success: false,
            error: err instanceof Error ? err.message : 'Conversion failed',
          });
        }
      }

      // Stage 5: Package
      updateProgress('package', 80, 'Packaging results...');
      setResults(exportResults);

      // Stage 6: Download
      updateProgress('download', 90, 'Starting downloads...');
      const successful = exportResults.filter((r) => r.success);
      if (successful.length === 1) {
        downloadResult(successful[0]);
      } else if (successful.length > 1) {
        await downloadBatch(successful);
      }

      // Done
      updateProgress('download', 100, 'Export complete!');
      const failedCount = exportResults.filter((r) => !r.success).length;
      if (failedCount > 0) {
        addError(`${failedCount} format(s) failed to export`);
      }
    } catch (err) {
      addError(err instanceof Error ? err.message : 'Export pipeline failed');
    } finally {
      setIsExporting(false);
      // Clear progress after a delay
      setTimeout(() => setProgress(null), 3000);
    }
  }, [
    transcript,
    selectedFormats,
    options,
    setIsExporting,
    clearErrors,
    clearResults,
    updateProgress,
    addError,
    setResults,
    setProgress,
  ]);

  /**
   * Download a single result from the results list
   */
  const downloadSingleResult = useCallback((result: ExportResult) => {
    if (result.success) {
      downloadResult(result);
    }
  }, []);

  return {
    // State
    isExporting,
    progress,
    results,
    errors,

    // Actions
    executePipeline,
    generatePreview,
    downloadSingleResult,
    clearErrors,
    clearResults,
  };
}
