/**
 * TXT Format Converter
 *
 * Produces plain text output from an IntermediateDocument.
 * Respects options for timestamps, speakers, and mode.
 */

import type { FormatConverter, IntermediateDocument, ExportOptions } from '../../types';

/**
 * Convert IntermediateDocument to plain text
 */
function convert(doc: IntermediateDocument, options: ExportOptions): string {
  const lines: string[] = [];

  // Title
  lines.push(doc.title);
  lines.push('='.repeat(doc.title.length));
  lines.push('');

  // Metadata
  if (options.mode === 'detailed') {
    for (const [key, value] of Object.entries(doc.metadata)) {
      lines.push(`${key}: ${value}`);
    }
    lines.push('');
  }

  // Sections
  for (const section of doc.sections) {
    if (section.type === 'separator') {
      lines.push('---');
      lines.push('');
      continue;
    }

    if (section.title) {
      lines.push(section.title);
      lines.push('-'.repeat(section.title.length));
    }

    for (const line of section.lines) {
      lines.push(line);
    }

    lines.push('');
  }

  return lines.join('\n').trim() + '\n';
}

/** TXT format converter instance */
export const txtConverter: FormatConverter = {
  format: 'txt',
  label: 'Plain Text',
  extension: '.txt',
  mimeType: 'text/plain',
  available: true,
  convert,
};
