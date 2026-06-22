/**
 * Business Studio Module - Page Component
 * 
 * Will provide business analytics and automation tools.
 * Currently renders a placeholder.
 * 
 * Route: /business
 */

import { ModulePlaceholder } from '@/shared/components/ModulePlaceholder';

export function BusinessStudioPage() {
  return (
    <ModulePlaceholder
      name="Business Studio"
      description="Business analytics, reporting, and workflow automation. Generate insights from conversations and track communication metrics."
      icon="business"
    />
  );
}
