/**
 * useContentExport Hook
 *
 * Handles exporting generated content to the Export Center module.
 * Sets source_module: 'content-studio' in the export payload.
 */

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContentStudioStore } from '../store';

const ACTIVE_TRANSCRIPT_KEY = 'squicky:active_transcript_id';

/**
 * Hook providing export capability for generated content
 */
export function useContentExport() {
  const transcript = useContentStudioStore((s) => s.transcript);
  const generatedContent = useContentStudioStore((s) => s.generatedContent);
  const navigate = useNavigate();

  /**
   * Send generated content to Export Center
   */
  const exportContent = useCallback(() => {
    if (!transcript || !generatedContent) return;

    // Store active transcript ID for the Export Center to pick up
    sessionStorage.setItem(ACTIVE_TRANSCRIPT_KEY, transcript.id);

    // Store the generated content for export
    sessionStorage.setItem(
      'squicky:content_studio_export',
      JSON.stringify({
        source_module: 'content-studio',
        content: generatedContent.rendered,
        title: generatedContent.title,
        type: generatedContent.type,
      })
    );

    // Navigate to Export Center
    navigate('/export');
  }, [transcript, generatedContent, navigate]);

  /**
   * Copy content to clipboard
   */
  const copyToClipboard = useCallback(async () => {
    if (!generatedContent) return false;
    try {
      await navigator.clipboard.writeText(generatedContent.rendered);
      return true;
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = generatedContent.rendered;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    }
  }, [generatedContent]);

  return {
    exportContent,
    copyToClipboard,
    canExport: transcript !== null && generatedContent !== null,
  };
}
