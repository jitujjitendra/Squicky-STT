/**
 * WebVTT Format Converter
 *
 * Produces standard WebVTT subtitle format.
 * Includes WEBVTT header and optional NOTE for metadata.
 */

import type { FormatConverter, IntermediateDocument, ExportOptions } from '../../types';

/**
 * Format seconds to VTT timestamp (HH:MM:SS.mmm)
 */
function formatVttTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);

  return (
    String(hours).padStart(2, '0') +
    ':' +
    String(mins).padStart(2, '0') +
    ':' +
    String(secs).padStart(2, '0') +
    '.' +
    String(ms).padStart(3, '0')
  );
}

/**
 * Convert IntermediateDocument to WebVTT
 */
function convert(doc: IntermediateDocument, options: ExportOptions): string {
  const lines: string[] = [];

  // VTT header
  lines.push('WEBVTT');
  lines.push('');

  // Optional metadata note
  if (options.mode === 'detailed') {
    lines.push(`NOTE`);
    lines.push(`Title: ${doc.title}`);
    for (const [key, value] of Object.entries(doc.metadata)) {
      lines.push(`${key}: ${value}`);
    }
    lines.push('');
  }

  // Cues
  for (const segment of doc.segments) {
    // Cue identifier (optional but useful)
    lines.push(String(segment.index + 1));

    // Timestamp line
    lines.push(`${formatVttTimestamp(segment.start)} --> ${formatVttTimestamp(segment.end)}`);

    // Text with optional speaker tag using VTT voice span
    let text = segment.text;
    if (options.include_speakers && segment.speaker) {
      text = `<v ${segment.speaker}>${text}</v>`;
    }
    lines.push(text);
    lines.push('');
  }

  return lines.join('\n');
}

/** WebVTT format converter instance */
export const vttConverter: FormatConverter = {
  format: 'vtt',
  label: 'WebVTT Subtitles',
  extension: '.vtt',
  mimeType: 'text/vtt',
  available: true,
  convert,
};
