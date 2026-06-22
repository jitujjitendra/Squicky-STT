/**
 * Validation Service
 *
 * Validates uploaded files against format, size, and duration constraints.
 * Extracts file metadata during the validation pass for downstream use.
 *
 * Architecture decision: Validation is a separate service (not embedded in the
 * upload handler) to allow reuse in bulk upload, API upload, and testing.
 */

import type {
  ValidationResult,
  ValidationError,
  FileMetadata,
} from '../types';
import {
  SUPPORTED_FORMATS,
  EXTENSION_MIME_MAP,
  FILE_SIZE_LIMITS,
  DURATION_LIMITS,
} from '../types';

/**
 * Estimates audio duration from file size and format
 * Used when Web Audio API duration detection is not available
 */
function estimateDuration(sizeBytes: number, mimeType: string): number {
  // Average bitrates for estimation
  const bitRates: Record<string, number> = {
    'audio/mpeg': 192_000,      // MP3 ~192kbps
    'audio/wav': 1_411_200,     // WAV 16-bit 44.1kHz stereo
    'audio/x-wav': 1_411_200,
    'audio/mp4': 128_000,       // AAC ~128kbps
    'audio/x-m4a': 128_000,
    'audio/aac': 128_000,
    'audio/ogg': 160_000,       // Vorbis ~160kbps
    'audio/flac': 800_000,      // FLAC ~800kbps
    'audio/x-flac': 800_000,
    'video/mp4': 5_000_000,     // Video ~5Mbps
    'video/quicktime': 5_000_000,
    'video/x-matroska': 5_000_000,
    'video/x-msvideo': 5_000_000,
    'video/webm': 3_000_000,
  };
  const bitRate = bitRates[mimeType] ?? 192_000;
  return (sizeBytes * 8) / bitRate;
}

/**
 * Resolves MIME type from file, using extension fallback
 */
function resolveMimeType(file: File): string {
  if (file.type && file.type !== 'application/octet-stream') {
    return file.type;
  }
  const parts = file.name.split('.');
  const extension = parts.length > 1 ? parts.pop()?.toLowerCase() : undefined;
  if (!extension) return '';
  const ext = '.' + extension;
  return EXTENSION_MIME_MAP[ext] ?? '';
}

/**
 * Checks if a MIME type is in the supported formats list
 */
function isSupportedFormat(mimeType: string): boolean {
  return (SUPPORTED_FORMATS as readonly string[]).includes(mimeType);
}

/**
 * Checks if a MIME type is a video format
 */
function isVideoFormat(mimeType: string): boolean {
  return mimeType.startsWith('video/');
}

export class ValidationService {
  /**
   * Validate a file for upload
   *
   * Checks format, size, and estimated duration.
   * Returns metadata on success for use in downstream stages.
   */
  async validate(file: File): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    // Check for empty file
    if (file.size === 0) {
      errors.push({
        code: 'EMPTY_FILE',
        message: 'File is empty',
        details: 'The uploaded file contains no data.',
      });
      return { valid: false, errors };
    }

    // Resolve MIME type
    const mimeType = resolveMimeType(file);

    // Check format support
    if (!mimeType || !isSupportedFormat(mimeType)) {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'unknown';
      errors.push({
        code: 'UNSUPPORTED_FORMAT',
        message: `Unsupported file format: .${ext}`,
        details: `Supported formats: MP3, WAV, M4A, AAC, OGG, FLAC, MP4, MOV, MKV, AVI, WEBM`,
      });
      return { valid: false, errors };
    }

    // Check file size
    const isVideo = isVideoFormat(mimeType);
    const maxSize = isVideo
      ? FILE_SIZE_LIMITS.VIDEO_MAX_BYTES
      : FILE_SIZE_LIMITS.AUDIO_MAX_BYTES;

    if (file.size > maxSize) {
      const maxMB = Math.round(maxSize / (1024 * 1024));
      const fileMB = Math.round(file.size / (1024 * 1024));
      errors.push({
        code: 'FILE_TOO_LARGE',
        message: `File too large (${fileMB}MB)`,
        details: `Maximum ${isVideo ? 'video' : 'audio'} file size is ${maxMB}MB.`,
      });
      return { valid: false, errors };
    }

    // Estimate duration
    const estimatedDuration = estimateDuration(file.size, mimeType);

    if (estimatedDuration > DURATION_LIMITS.MAX_DURATION_SECONDS) {
      const maxMin = DURATION_LIMITS.MAX_DURATION_SECONDS / 60;
      const estMin = Math.round(estimatedDuration / 60);
      errors.push({
        code: 'DURATION_TOO_LONG',
        message: `Estimated duration too long (~${estMin} min)`,
        details: `Maximum duration is ${maxMin} minutes. Actual duration will be verified during preprocessing.`,
      });
      return { valid: false, errors };
    }

    // Build metadata
    const metadata: FileMetadata = {
      filename: file.name,
      mime_type: mimeType,
      size_bytes: file.size,
      duration_seconds: estimatedDuration,
      has_video: isVideo,
    };

    return { valid: true, errors: [], metadata };
  }

  /**
   * Validate multiple files
   * Returns results indexed by file name
   */
  async validateBatch(files: File[]): Promise<Map<string, ValidationResult>> {
    const results = new Map<string, ValidationResult>();
    for (const file of files) {
      const result = await this.validate(file);
      results.set(file.name, result);
    }
    return results;
  }
}
