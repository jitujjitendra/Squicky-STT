/**
 * useExportOptions Hook
 *
 * Provides a convenient interface for managing export options state.
 * Wraps the store actions with typed setters.
 */

import { useExportCenterStore } from '../store';
import type { ExportMode, TemplateName } from '../types';

/**
 * Hook for managing export options
 */
export function useExportOptions() {
  const options = useExportCenterStore((s) => s.options);
  const setOption = useExportCenterStore((s) => s.setOption);
  const setTemplate = useExportCenterStore((s) => s.setTemplate);
  const resetOptions = useExportCenterStore((s) => s.resetOptions);

  return {
    options,
    setIncludeTimestamps: (value: boolean) => setOption('include_timestamps', value),
    setIncludeSpeakers: (value: boolean) => setOption('include_speakers', value),
    setIncludeConfidence: (value: boolean) => setOption('include_confidence', value),
    setMode: (value: ExportMode) => setOption('mode', value),
    setTemplate: (value: TemplateName) => setTemplate(value),
    resetOptions,
  };
}
