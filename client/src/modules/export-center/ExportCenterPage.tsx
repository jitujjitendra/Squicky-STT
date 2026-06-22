/**
 * Export Center Module - Page Component
 * 
 * Will provide multi-format export capabilities.
 * Currently renders a placeholder.
 * 
 * Route: /export
 */

import { ModulePlaceholder } from '@/shared/components/ModulePlaceholder';

export function ExportCenterPage() {
  return (
    <ModulePlaceholder
      name="Export Center"
      description="Export transcripts in multiple formats including TXT, SRT, VTT, DOCX, and PDF. Configure formatting and metadata options."
      icon="download"
    />
  );
}
