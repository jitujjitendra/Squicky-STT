/**
 * PDF Format Converter (Placeholder)
 *
 * Structural placeholder that returns a message indicating jsPDF
 * needs to be installed for full PDF generation.
 * The IntermediateDocument structure is preserved for future implementation.
 */

import type { FormatConverter, IntermediateDocument, ExportOptions } from '../../types';

/**
 * Placeholder convert - returns installation message
 */
function convert(doc: IntermediateDocument, _options: ExportOptions): string {
  const lines: string[] = [
    `[PDF Export - ${doc.title}]`,
    '',
    'Install jsPDF to enable PDF export:',
    '  npm install jspdf',
    '',
    'This placeholder confirms the export pipeline is functional.',
    `Document contains ${doc.segments.length} segments ready for PDF rendering.`,
    '',
    'When jsPDF is available, this converter will produce formatted PDFs with:',
    '- Headers and metadata',
    '- Speaker-attributed paragraphs',
    '- Timestamp annotations',
    '- Page numbers and table of contents',
  ];

  return lines.join('\n') + '\n';
}

/** PDF format converter instance (placeholder) */
export const pdfConverter: FormatConverter = {
  format: 'pdf',
  label: 'PDF Document',
  extension: '.pdf',
  mimeType: 'application/pdf',
  available: false,
  convert,
};
