/**
 * Delivery Service
 *
 * Handles the final delivery stage of the export pipeline.
 * Creates Blob URLs, triggers downloads, and manages cleanup.
 * 100% client-side - zero server communication.
 *
 * Flow: content string -> Blob -> createObjectURL -> anchor click -> revokeObjectURL
 */

import type { ExportResult } from '../types';

/**
 * Trigger a file download from export result
 *
 * Creates a temporary blob URL, triggers a download via a hidden anchor,
 * and revokes the URL after a short delay to free memory.
 */
export function downloadResult(result: ExportResult): void {
  if (!result.success || !result.content) {
    throw new Error(`Cannot download failed export: ${result.error ?? 'Unknown error'}`);
  }

  const blob = new Blob([result.content], { type: result.mimeType });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = result.filename;
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();

  // Cleanup after download starts
  setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Download multiple results sequentially
 *
 * Downloads each result with a small delay between them to avoid
 * browser throttling of multiple simultaneous downloads.
 */
export async function downloadBatch(results: ExportResult[]): Promise<void> {
  const successful = results.filter((r) => r.success);

  for (let i = 0; i < successful.length; i++) {
    downloadResult(successful[i]);
    // Small delay between downloads to prevent browser blocking
    if (i < successful.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
}

/**
 * Generate a filename for an export
 */
export function generateFilename(
  sourceFilename: string,
  format: string,
  extension: string
): string {
  // Strip extension from source filename
  const baseName = sourceFilename.replace(/\.[^.]+$/, '');
  const sanitized = baseName.replace(/[^a-zA-Z0-9_\-. ]/g, '_');
  return `${sanitized}_export${extension}`;
}
