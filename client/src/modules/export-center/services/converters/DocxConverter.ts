/**
 * DOCX Format Converter (Placeholder)
 *
 * Structural placeholder that returns a message indicating docx.js
 * needs to be installed for full DOCX generation.
 * The IntermediateDocument structure is preserved for future implementation.
 */

import type { FormatConverter, IntermediateDocument, ExportOptions } from '../../types';

/**
 * Placeholder convert - returns installation message
 */
function convert(doc: IntermediateDocument, _options: ExportOptions): string {
  const lines: string[] = [
    `[DOCX Export - ${doc.title}]`,
    '',
    'Install docx.js to enable DOCX export:',
    '  npm install docx',
    '',
    'This placeholder confirms the export pipeline is functional.',
    `Document contains ${doc.segments.length} segments ready for DOCX rendering.`,
    '',
    'When docx.js is available, this converter will produce Word documents with:',
    '- Styled headings and paragraphs',
    '- Speaker name formatting',
    '- Timestamp tables',
    '- Custom page layout and fonts',
  ];

  return lines.join('\n') + '\n';
}

/** DOCX format converter instance (placeholder) */
export const docxConverter: FormatConverter = {
  format: 'docx',
  label: 'Word Document',
  extension: '.docx',
  mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  available: false,
  convert,
};
