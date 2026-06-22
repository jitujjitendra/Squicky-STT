/**
 * CSV Format Converter
 *
 * Produces comma-separated values from segment data.
 * Uses the raw segments array for direct tabular output.
 */

import type { FormatConverter, IntermediateDocument, ExportOptions } from '../../types';

/**
 * Escape a CSV field value
 */
function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Convert IntermediateDocument to CSV
 */
function convert(doc: IntermediateDocument, options: ExportOptions): string {
  const lines: string[] = [];

  // Build header
  const headers: string[] = ['Index'];
  if (options.include_timestamps) {
    headers.push('Start', 'End');
  }
  if (options.include_speakers) {
    headers.push('Speaker');
  }
  headers.push('Text');
  if (options.include_confidence) {
    headers.push('Confidence');
  }
  lines.push(headers.join(','));

  // Build rows
  for (const segment of doc.segments) {
    const row: string[] = [String(segment.index)];

    if (options.include_timestamps) {
      row.push(segment.start.toFixed(2), segment.end.toFixed(2));
    }
    if (options.include_speakers) {
      row.push(escapeCsv(segment.speaker ?? ''));
    }
    row.push(escapeCsv(segment.text));
    if (options.include_confidence) {
      row.push(segment.confidence !== undefined ? segment.confidence.toFixed(3) : '');
    }

    lines.push(row.join(','));
  }

  return lines.join('\n') + '\n';
}

/** CSV format converter instance */
export const csvConverter: FormatConverter = {
  format: 'csv',
  label: 'CSV',
  extension: '.csv',
  mimeType: 'text/csv',
  available: true,
  convert,
};
