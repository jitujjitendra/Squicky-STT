/**
 * Export Validation Service
 *
 * Validates export payloads before pipeline execution.
 * Checks transcript data integrity, format availability,
 * and option consistency.
 */

import type { ExportPayload, ExportFormat } from '../types';
import { formatRegistry } from './FormatRegistry';

/** Validation error */
export interface ExportValidationError {
  field: string;
  message: string;
}

/** Validation result */
export interface ExportValidationResult {
  valid: boolean;
  errors: ExportValidationError[];
}

/**
 * Validate an export payload
 */
export function validateExportPayload(payload: ExportPayload): ExportValidationResult {
  const errors: ExportValidationError[] = [];

  // Validate transcript
  if (!payload.transcript) {
    errors.push({ field: 'transcript', message: 'No transcript data provided' });
  } else {
    if (!payload.transcript.segments || payload.transcript.segments.length === 0) {
      errors.push({ field: 'transcript.segments', message: 'Transcript has no segments' });
    }
    if (!payload.transcript.id) {
      errors.push({ field: 'transcript.id', message: 'Transcript missing identifier' });
    }
  }

  // Validate formats
  if (!payload.formats || payload.formats.length === 0) {
    errors.push({ field: 'formats', message: 'No export formats selected' });
  } else {
    const availableFormats = formatRegistry.getAvailableFormats();
    for (const format of payload.formats) {
      if (!availableFormats.includes(format)) {
        errors.push({
          field: 'formats',
          message: `Format "${format}" is not available`,
        });
      }
    }
  }

  // Validate options
  if (!payload.options) {
    errors.push({ field: 'options', message: 'Export options not provided' });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if a specific format is compatible with the transcript
 */
export function isFormatCompatible(format: ExportFormat, payload: ExportPayload): boolean {
  // Subtitle formats need timestamps
  if (format === 'srt' || format === 'vtt') {
    return payload.transcript?.segments?.some((s) => s.start !== undefined && s.end !== undefined) ?? false;
  }

  // CSV needs segments
  if (format === 'csv') {
    return (payload.transcript?.segments?.length ?? 0) > 0;
  }

  return true;
}
