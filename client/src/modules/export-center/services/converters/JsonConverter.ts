/**
 * JSON Format Converter
 *
 * Produces structured JSON output from an IntermediateDocument.
 * In compact mode, outputs only segments. In detailed mode, includes
 * full document structure with metadata.
 */

import type { FormatConverter, IntermediateDocument, ExportOptions } from '../../types';

/**
 * Convert IntermediateDocument to JSON
 */
function convert(doc: IntermediateDocument, options: ExportOptions): string {
  if (options.mode === 'compact') {
    // Compact: only segments array
    const segments = doc.segments.map((seg) => {
      const entry: Record<string, unknown> = { index: seg.index, text: seg.text };
      if (options.include_timestamps) {
        entry.start = seg.start;
        entry.end = seg.end;
      }
      if (options.include_speakers && seg.speaker) {
        entry.speaker = seg.speaker;
      }
      if (options.include_confidence && seg.confidence !== undefined) {
        entry.confidence = seg.confidence;
      }
      return entry;
    });
    return JSON.stringify(segments, null, 2) + '\n';
  }

  // Detailed: full document
  const output: Record<string, unknown> = {
    title: doc.title,
    metadata: doc.metadata,
    segments: doc.segments.map((seg) => {
      const entry: Record<string, unknown> = {
        index: seg.index,
        start: seg.start,
        end: seg.end,
        text: seg.text,
      };
      if (seg.speaker) entry.speaker = seg.speaker;
      if (seg.confidence !== undefined) entry.confidence = seg.confidence;
      return entry;
    }),
  };

  return JSON.stringify(output, null, 2) + '\n';
}

/** JSON format converter instance */
export const jsonConverter: FormatConverter = {
  format: 'json',
  label: 'JSON',
  extension: '.json',
  mimeType: 'application/json',
  available: true,
  convert,
};
