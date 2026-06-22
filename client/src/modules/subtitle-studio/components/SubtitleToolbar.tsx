/**
 * SubtitleToolbar Component
 *
 * Top toolbar for the Subtitle Studio with:
 * - Title and cue count
 * - Undo/Redo buttons
 * - Regenerate button
 * - Export button (sends to Export Center)
 * - Privacy badge (all client-side)
 */

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Badge, Icon } from '@/shared/components';
import { useSubtitleStudioStore } from '../store';
import { useSubtitleGeneration } from '../hooks/useSubtitleGeneration';
import { useSubtitleEditor } from '../hooks/useSubtitleEditor';
const SESSION_KEY = 'squicky:active_transcript_id';

/**
 * Subtitle Studio toolbar
 */
export function SubtitleToolbar() {
  const navigate = useNavigate();
  const transcript = useSubtitleStudioStore((s) => s.transcript);
  const cues = useSubtitleStudioStore((s) => s.cues);
  const hasWordTimestamps = useSubtitleStudioStore((s) => s.hasWordTimestamps);
  const validationResults = useSubtitleStudioStore((s) => s.validationResults);
  const { undo, redo } = useSubtitleEditor();
  const { regenerate, isGenerating } = useSubtitleGeneration();

  const activeCues = cues.filter((c) => !c.isDeleted);

  /** Handle export: send cues as ExportPayload via sessionStorage + navigate */
  const handleExport = useCallback(() => {
    if (!transcript) return;

    // Store active transcript ID for Export Center to pick up
    sessionStorage.setItem(SESSION_KEY, transcript.id);

    // Store source module marker for Export Center
    sessionStorage.setItem('squicky:export_source_module', 'subtitle-studio');

    // Navigate to export center
    navigate('/export');
  }, [transcript, navigate]);

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex-wrap">
      {/* Title */}
      <div className="flex items-center gap-2 mr-auto">
        <Icon name="subtitles" size={18} className="text-accent" />
        <h1 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          Subtitle Studio
        </h1>
        {activeCues.length > 0 && (
          <Badge variant="default">{activeCues.length} cues</Badge>
        )}
        {!hasWordTimestamps && activeCues.length > 0 && (
          <Badge variant="warning">approximate timing</Badge>
        )}
      </div>

      {/* Validation summary */}
      {!validationResults.isValid && (
        <Badge variant="error">
          {validationResults.errors} errors
        </Badge>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={undo} title="Undo (Ctrl+Z)">
          Undo
        </Button>
        <Button variant="ghost" size="sm" onClick={redo} title="Redo (Ctrl+Y)">
          Redo
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={regenerate}
          disabled={isGenerating || !transcript}
        >
          Regenerate
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleExport}
          disabled={activeCues.length === 0}
        >
          <Icon name="download" size={14} />
          Export
        </Button>
      </div>
    </div>
  );
}
