/**
 * Subtitle Validation Service
 *
 * Validates subtitle cues against broadcast subtitling rules:
 * - Overlap detection between adjacent cues
 * - Duration constraints (min 1.0s, max 7.0s)
 * - Characters per second (CPS): warn >25, error >30
 * - Line length (max 42 chars)
 * - Empty text detection
 * - Sequential timing validation
 *
 * Provides per-cue validation and summary results with auto-fix suggestions.
 */

import type {
  SubtitleCue,
  CueValidation,
  ValidationIssue,
  ValidationResults,
  SubtitleConfig,
  CueId,
} from '../types';
import { DEFAULT_SUBTITLE_CONFIG } from '../types';

/**
 * Calculate characters per second for a cue
 */
function calculateCPS(text: string, start: number, end: number): number {
  const duration = end - start;
  if (duration <= 0) return Infinity;
  // Count only visible characters (no newlines)
  const charCount = text.replace(/\n/g, '').length;
  return charCount / duration;
}

/**
 * Subtitle Validation Service
 */
export const ValidationService = {
  /**
   * Validate a single cue against subtitle rules
   * @param cue - The cue to validate
   * @param allCues - All cues for overlap checking
   * @param config - Validation configuration
   * @returns CueValidation result
   */
  validateCue(
    cue: SubtitleCue,
    allCues: SubtitleCue[],
    config: SubtitleConfig = DEFAULT_SUBTITLE_CONFIG
  ): CueValidation {
    const issues: ValidationIssue[] = [];
    const lines = cue.text.split('\n');
    const lineCount = lines.length;
    const maxLineLength = Math.max(...lines.map((l) => l.length), 0);
    const cps = calculateCPS(cue.text, cue.start, cue.end);
    const duration = cue.end - cue.start;

    // Empty text check
    if (!cue.text.trim()) {
      issues.push({
        type: 'empty_text',
        severity: 'error',
        message: 'Cue has empty text',
        cueId: cue.id,
        autoFixable: false,
      });
    }

    // Duration minimum
    if (duration < config.minDuration) {
      issues.push({
        type: 'duration_min',
        severity: 'warning',
        message: `Duration ${duration.toFixed(2)}s is below minimum ${config.minDuration}s`,
        cueId: cue.id,
        autoFixable: true,
      });
    }

    // Duration maximum
    if (duration > config.maxDuration) {
      issues.push({
        type: 'duration_max',
        severity: 'warning',
        message: `Duration ${duration.toFixed(2)}s exceeds maximum ${config.maxDuration}s`,
        cueId: cue.id,
        autoFixable: true,
      });
    }

    // CPS warning
    if (cps > config.errorCPS) {
      issues.push({
        type: 'cps_error',
        severity: 'error',
        message: `CPS ${cps.toFixed(1)} exceeds error threshold ${config.errorCPS}`,
        cueId: cue.id,
        autoFixable: false,
      });
    } else if (cps > config.warnCPS) {
      issues.push({
        type: 'cps_warning',
        severity: 'warning',
        message: `CPS ${cps.toFixed(1)} exceeds warning threshold ${config.warnCPS}`,
        cueId: cue.id,
        autoFixable: false,
      });
    }

    // Line length
    for (const line of lines) {
      if (line.length > config.maxCharsPerLine) {
        issues.push({
          type: 'line_length',
          severity: 'warning',
          message: `Line "${line.substring(0, 20)}..." exceeds ${config.maxCharsPerLine} characters (${line.length})`,
          cueId: cue.id,
          autoFixable: true,
        });
        break; // Report once per cue
      }
    }

    // Overlap check
    const activeCues = allCues.filter((c) => !c.isDeleted && c.id !== cue.id);
    for (const other of activeCues) {
      if (cue.start < other.end && cue.end > other.start) {
        // Check if it is actually an adjacent overlap (not complete containment)
        issues.push({
          type: 'overlap',
          severity: 'error',
          message: `Overlaps with cue #${other.sequenceIndex}`,
          cueId: cue.id,
          autoFixable: true,
        });
        break; // Report first overlap only
      }
    }

    // Sequential timing (end < start)
    if (cue.end <= cue.start) {
      issues.push({
        type: 'sequential_timing',
        severity: 'error',
        message: 'End time must be after start time',
        cueId: cue.id,
        autoFixable: true,
      });
    }

    return {
      isValid: issues.filter((i) => i.severity === 'error').length === 0,
      issues,
      cps,
      lineCount,
      maxLineLength,
    };
  },

  /**
   * Validate all cues and produce a summary
   * @param cues - All cues to validate
   * @param config - Validation configuration
   * @returns Summary validation results
   */
  validateAll(
    cues: SubtitleCue[],
    config: SubtitleConfig = DEFAULT_SUBTITLE_CONFIG
  ): ValidationResults {
    const activeCues = cues.filter((c) => !c.isDeleted);
    const allIssues: ValidationIssue[] = [];

    for (const cue of activeCues) {
      const validation = this.validateCue(cue, activeCues, config);
      allIssues.push(...validation.issues);
    }

    const errors = allIssues.filter((i) => i.severity === 'error').length;
    const warnings = allIssues.filter((i) => i.severity === 'warning').length;

    return {
      totalIssues: allIssues.length,
      errors,
      warnings,
      issues: allIssues,
      isValid: errors === 0,
    };
  },

  /**
   * Auto-fix an overlap by trimming the earlier cue's end time
   * @param cueId - The cue with the overlap issue
   * @param cues - All cues
   * @param config - Configuration
   * @returns Updated cues array
   */
  fixOverlap(cueId: CueId, cues: SubtitleCue[], config: SubtitleConfig): SubtitleCue[] {
    const cueIndex = cues.findIndex((c) => c.id === cueId);
    if (cueIndex < 0) return cues;

    const cue = cues[cueIndex]!;
    const updated = [...cues];

    // Find the overlapping cue that starts before this one
    const overlapping = cues.find(
      (c) => !c.isDeleted && c.id !== cue.id && c.start < cue.end && c.end > cue.start
    );

    if (overlapping) {
      if (overlapping.start < cue.start) {
        // Trim overlapping cue end to just before this cue starts
        const idx = updated.findIndex((c) => c.id === overlapping.id);
        if (idx >= 0) {
          updated[idx] = {
            ...updated[idx]!,
            end: cue.start - config.minGap,
          };
        }
      } else {
        // Trim this cue's end to just before the next cue starts
        updated[cueIndex] = {
          ...cue,
          end: overlapping.start - config.minGap,
        };
      }
    }

    return updated;
  },

  /**
   * Auto-fix minimum duration by extending end time
   */
  fixMinDuration(cueId: CueId, cues: SubtitleCue[], config: SubtitleConfig): SubtitleCue[] {
    const idx = cues.findIndex((c) => c.id === cueId);
    if (idx < 0) return cues;

    const updated = [...cues];
    const cue = updated[idx]!;
    updated[idx] = {
      ...cue,
      end: cue.start + config.minDuration,
    };
    return updated;
  },

  /**
   * Auto-fix maximum duration by trimming end time
   */
  fixMaxDuration(cueId: CueId, cues: SubtitleCue[], config: SubtitleConfig): SubtitleCue[] {
    const idx = cues.findIndex((c) => c.id === cueId);
    if (idx < 0) return cues;

    const updated = [...cues];
    const cue = updated[idx]!;
    updated[idx] = {
      ...cue,
      end: cue.start + config.maxDuration,
    };
    return updated;
  },

  /**
   * Auto-fix sequential timing by swapping start/end
   */
  fixSequentialTiming(cueId: CueId, cues: SubtitleCue[]): SubtitleCue[] {
    const idx = cues.findIndex((c) => c.id === cueId);
    if (idx < 0) return cues;

    const updated = [...cues];
    const cue = updated[idx]!;
    updated[idx] = {
      ...cue,
      start: Math.min(cue.start, cue.end),
      end: Math.max(cue.start, cue.end),
    };
    return updated;
  },

  /**
   * Auto-fix line length by re-wrapping text
   */
  fixLineLength(cueId: CueId, cues: SubtitleCue[], config: SubtitleConfig): SubtitleCue[] {
    const idx = cues.findIndex((c) => c.id === cueId);
    if (idx < 0) return cues;

    const updated = [...cues];
    const cue = updated[idx]!;
    const words = cue.text.replace(/\n/g, ' ').split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = '';

    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (candidate.length > config.maxCharsPerLine && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);

    updated[idx] = {
      ...cue,
      text: lines.slice(0, config.maxLines).join('\n'),
    };
    return updated;
  },
};
