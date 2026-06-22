/**
 * Markdown Format Converter
 *
 * Produces GitHub-flavored Markdown from an IntermediateDocument.
 * Uses headings, emphasis, and tables for structured output.
 */

import type { FormatConverter, IntermediateDocument, ExportOptions } from '../../types';

/**
 * Convert IntermediateDocument to Markdown
 */
function convert(doc: IntermediateDocument, options: ExportOptions): string {
  const lines: string[] = [];

  // Title
  lines.push(`# ${doc.title}`);
  lines.push('');

  // Metadata
  if (options.mode === 'detailed') {
    lines.push('## Metadata');
    lines.push('');
    lines.push('| Field | Value |');
    lines.push('|-------|-------|');
    for (const [key, value] of Object.entries(doc.metadata)) {
      lines.push(`| ${key} | ${value} |`);
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
      lines.push(`## ${section.title}`);
      lines.push('');
    }

    for (const line of section.lines) {
      lines.push(line);
    }

    lines.push('');
  }

  return lines.join('\n').trim() + '\n';
}

/** Markdown format converter instance */
export const markdownConverter: FormatConverter = {
  format: 'markdown',
  label: 'Markdown',
  extension: '.md',
  mimeType: 'text/markdown',
  available: true,
  convert,
};
