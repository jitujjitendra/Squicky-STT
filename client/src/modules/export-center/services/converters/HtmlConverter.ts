/**
 * HTML Format Converter
 *
 * Produces self-contained HTML document from an IntermediateDocument.
 * Includes basic inline styles for readability without external CSS.
 */

import type { FormatConverter, IntermediateDocument, ExportOptions } from '../../types';

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Convert IntermediateDocument to HTML
 */
function convert(doc: IntermediateDocument, options: ExportOptions): string {
  const lines: string[] = [];

  lines.push('<!DOCTYPE html>');
  lines.push('<html lang="en">');
  lines.push('<head>');
  lines.push(`  <meta charset="UTF-8">`);
  lines.push(`  <meta name="viewport" content="width=device-width, initial-scale=1.0">`);
  lines.push(`  <title>${escapeHtml(doc.title)}</title>`);
  lines.push('  <style>');
  lines.push('    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; color: #1a1a1a; }');
  lines.push('    h1 { border-bottom: 2px solid #e5e5e5; padding-bottom: 0.5rem; }');
  lines.push('    h2 { color: #333; margin-top: 2rem; }');
  lines.push('    .metadata { background: #f5f5f5; padding: 1rem; border-radius: 8px; margin: 1rem 0; }');
  lines.push('    .metadata dt { font-weight: 600; }');
  lines.push('    .segment { margin: 0.5rem 0; padding: 0.5rem; border-left: 3px solid #e5e5e5; }');
  lines.push('    .speaker { font-weight: 600; color: #555; }');
  lines.push('    .timestamp { color: #888; font-size: 0.85em; font-family: monospace; }');
  lines.push('    .confidence { color: #aaa; font-size: 0.8em; }');
  lines.push('    hr { border: none; border-top: 1px solid #e5e5e5; margin: 2rem 0; }');
  lines.push('  </style>');
  lines.push('</head>');
  lines.push('<body>');

  // Title
  lines.push(`  <h1>${escapeHtml(doc.title)}</h1>`);

  // Metadata
  if (options.mode === 'detailed') {
    lines.push('  <div class="metadata">');
    lines.push('    <dl>');
    for (const [key, value] of Object.entries(doc.metadata)) {
      lines.push(`      <dt>${escapeHtml(key)}</dt>`);
      lines.push(`      <dd>${escapeHtml(value)}</dd>`);
    }
    lines.push('    </dl>');
    lines.push('  </div>');
  }

  // Sections
  for (const section of doc.sections) {
    if (section.type === 'separator') {
      lines.push('  <hr>');
      continue;
    }

    if (section.title) {
      lines.push(`  <h2>${escapeHtml(section.title)}</h2>`);
    }

    for (const line of section.lines) {
      if (line.trim()) {
        lines.push(`  <p>${escapeHtml(line)}</p>`);
      }
    }
  }

  lines.push('</body>');
  lines.push('</html>');

  return lines.join('\n');
}

/** HTML format converter instance */
export const htmlConverter: FormatConverter = {
  format: 'html',
  label: 'HTML',
  extension: '.html',
  mimeType: 'text/html',
  available: true,
  convert,
};
