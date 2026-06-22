/**
 * Subtitle Studio Module - Page Component
 * 
 * Will provide subtitle creation and editing tools.
 * Currently renders a placeholder.
 * 
 * Route: /subtitles
 */

import { ModulePlaceholder } from '@/shared/components/ModulePlaceholder';

export function SubtitleStudioPage() {
  return (
    <ModulePlaceholder
      name="Subtitle Studio"
      description="Create and edit synchronized subtitles with timeline editing, style customization, and multi-language support."
      icon="subtitles"
    />
  );
}
