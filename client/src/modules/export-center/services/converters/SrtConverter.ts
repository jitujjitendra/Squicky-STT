/**
 * SRT (SubRip) Format Converter
 *
 * Produces standard SRT subtitle format.
 * Format: sequential number, timestamp line (HH:MM:SS,mmm --> HH:MM:SS,mmm), text, blank line.
 */

import type { FormatConverter, IntermediateDocument, ExportOptions } from '../../types';

/**
 * Format seconds to SRT timestamp (HH:MM:SS,mmm)
 */
function formatSrtTimestamp(seconds: number): string {
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
    ',' +
    String(ms).padStart(3, '0')
  );
}

/**
 * Convert IntermediateDocument to SRT
 */
function convert(doc: IntermediateDocument, options: ExportOptions): string {
  const blocks: string[] = [];

  for (const segment of doc.segments) {
    const lines: string[] = [];

    // Sequence number (1-based)
    lines.push(String(segment.index + 1));

    // Timestamp line
    lines.push(`${formatSrtTimestamp(segment.start)} --> ${formatSrtTimestamp(segment.end)}`);

    // Text with optional speaker prefix
    let text = segment.text;
    if (options.include_speakers && segment.speaker) {
      text = `[${segment.speaker}] ${text}`;
    }
    lines.push(text);

    blocks.push(lines.join('\n'));
  }

  return blocks.join('\n\n') + '\n';
}

/** SRT format converter instance */
export const srtConverter: FormatConverter = {
  format: 'srt',
  label: 'SRT Subtitles',
  extension: '.srt',
  mimeType: 'application/x-subrip',
  available: true,
  convert,
};
