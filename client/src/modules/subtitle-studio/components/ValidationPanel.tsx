/**
 * ValidationPanel Component
 *
 * Displays all validation issues across subtitle cues with:
 * - Issue count summary (errors, warnings)
 * - Issue list grouped by severity
 * - Auto-fix buttons for fixable issues
 * - Click to navigate to affected cue
 */

import { useCallback } from 'react';
import { Button, Badge } from '@/shared/components';
import { useSubtitleStudioStore } from '../store';
import { ValidationService } from '../services/ValidationService';
import type { ValidationIssue, CueId } from '../types';

/**
 * Validation panel showing all issues with auto-fix options
 */
export function ValidationPanel() {
  const validationResults = useSubtitleStudioStore((s) => s.validationResults);
  const cues = useSubtitleStudioStore((s) => s.cues);
  const config = useSubtitleStudioStore((s) => s.config);
  const setCues = useSubtitleStudioStore((s) => s.setCues);
  const setEditingCueId = useSubtitleStudioStore((s) => s.setEditingCueId);
  const pushHistory = useSubtitleStudioStore((s) => s.pushHistory);
  const runValidation = useSubtitleStudioStore((s) => s.runValidation);

  /** Navigate to a cue */
  const navigateToCue = useCallback(
    (cueId: CueId) => {
      setEditingCueId(cueId);
      // Scroll into view (will be picked up by CueList)
      const el = document.querySelector(`[data-cue-id="${cueId}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    [setEditingCueId]
  );

  /** Apply auto-fix for an issue */
  const handleAutoFix = useCallback(
    (issue: ValidationIssue) => {
      pushHistory(`Auto-fix: ${issue.type}`);

      let updatedCues = [...cues];

      switch (issue.type) {
        case 'overlap':
          updatedCues = ValidationService.fixOverlap(issue.cueId, updatedCues, config);
          break;
        case 'duration_min':
          updatedCues = ValidationService.fixMinDuration(issue.cueId, updatedCues, config);
          break;
        case 'duration_max':
          updatedCues = ValidationService.fixMaxDuration(issue.cueId, updatedCues, config);
          break;
        case 'sequential_timing':
          updatedCues = ValidationService.fixSequentialTiming(issue.cueId, updatedCues);
          break;
        case 'line_length':
          updatedCues = ValidationService.fixLineLength(issue.cueId, updatedCues, config);
          break;
        default:
          return;
      }

      setCues(updatedCues);
    },
    [cues, config, setCues, pushHistory]
  );

  /** Fix all fixable issues */
  const handleFixAll = useCallback(() => {
    pushHistory('Auto-fix all');

    let updatedCues = [...cues];
    const fixableIssues = validationResults.issues.filter((i) => i.autoFixable);

    for (const issue of fixableIssues) {
      switch (issue.type) {
        case 'overlap':
          updatedCues = ValidationService.fixOverlap(issue.cueId, updatedCues, config);
          break;
        case 'duration_min':
          updatedCues = ValidationService.fixMinDuration(issue.cueId, updatedCues, config);
          break;
        case 'duration_max':
          updatedCues = ValidationService.fixMaxDuration(issue.cueId, updatedCues, config);
          break;
        case 'sequential_timing':
          updatedCues = ValidationService.fixSequentialTiming(issue.cueId, updatedCues);
          break;
        case 'line_length':
          updatedCues = ValidationService.fixLineLength(issue.cueId, updatedCues, config);
          break;
      }
    }

    setCues(updatedCues);
  }, [cues, config, validationResults.issues, setCues, pushHistory]);

  // Group issues by severity
  const errors = validationResults.issues.filter((i) => i.severity === 'error');
  const warnings = validationResults.issues.filter((i) => i.severity === 'warning');
  const fixableCount = validationResults.issues.filter((i) => i.autoFixable).length;

  return (
    <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-neutral-50 dark:bg-neutral-800 px-3 py-2 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            Validation
          </h3>
          {validationResults.isValid ? (
            <Badge variant="success">All clear</Badge>
          ) : (
            <>
              {errors.length > 0 && (
                <Badge variant="error">{errors.length} errors</Badge>
              )}
              {warnings.length > 0 && (
                <Badge variant="warning">{warnings.length} warnings</Badge>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          {fixableCount > 0 && (
            <Button variant="secondary" size="sm" onClick={handleFixAll}>
              Fix All ({fixableCount})
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={runValidation}>
            Re-check
          </Button>
        </div>
      </div>

      {/* Issues list */}
      <div className="max-h-48 overflow-y-auto">
        {validationResults.isValid && (
          <div className="p-4 text-center text-sm text-neutral-500">
            All cues pass validation checks.
          </div>
        )}

        {/* Errors first */}
        {errors.map((issue, i) => (
          <IssueRow
            key={`err-${i}`}
            issue={issue}
            onNavigate={navigateToCue}
            onAutoFix={handleAutoFix}
          />
        ))}

        {/* Then warnings */}
        {warnings.map((issue, i) => (
          <IssueRow
            key={`warn-${i}`}
            issue={issue}
            onNavigate={navigateToCue}
            onAutoFix={handleAutoFix}
          />
        ))}
      </div>
    </div>
  );
}

/** Individual issue row */
function IssueRow({
  issue,
  onNavigate,
  onAutoFix,
}: {
  issue: ValidationIssue;
  onNavigate: (cueId: CueId) => void;
  onAutoFix: (issue: ValidationIssue) => void;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-neutral-100 dark:border-neutral-800 last:border-b-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
      {/* Severity indicator */}
      <span
        className={`w-2 h-2 rounded-full flex-shrink-0 ${
          issue.severity === 'error' ? 'bg-red-500' : 'bg-yellow-500'
        }`}
      />

      {/* Message */}
      <button
        className="flex-1 text-left text-xs text-neutral-700 dark:text-neutral-300 truncate hover:text-accent"
        onClick={() => onNavigate(issue.cueId)}
      >
        {issue.message}
      </button>

      {/* Auto-fix button */}
      {issue.autoFixable && (
        <Button variant="ghost" size="sm" onClick={() => onAutoFix(issue)}>
          Fix
        </Button>
      )}
    </div>
  );
}
