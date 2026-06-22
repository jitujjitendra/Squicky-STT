/**
 * CRM Output Panel
 *
 * Displays the CRM-ready output note (Salesforce/HubSpot style)
 * with copy-to-clipboard functionality.
 */

import { useState, useCallback } from 'react';
import { Button, Icon } from '@/shared/components';
import { useBusinessStudioStore } from '../store';
import { useBusinessExport } from '../hooks/useBusinessExport';
import { generateCrmOutput } from '../services/CrmOutputGenerator';

export function CrmOutputPanel() {
  const businessMode = useBusinessStudioStore((s) => s.businessMode);
  const customerProfile = useBusinessStudioStore((s) => s.customerProfile);
  const salesInsights = useBusinessStudioStore((s) => s.salesInsights);
  const supportInsights = useBusinessStudioStore((s) => s.supportInsights);
  const commitments = useBusinessStudioStore((s) => s.commitments);
  const followUps = useBusinessStudioStore((s) => s.followUps);
  const executiveSummary = useBusinessStudioStore((s) => s.executiveSummary);
  const analytics = useBusinessStudioStore((s) => s.analytics);
  const { hasConfirmedItems } = useBusinessExport();

  const [copied, setCopied] = useState(false);

  const getCrmNote = useCallback((): string => {
    if (!businessMode) return '';
    const output = generateCrmOutput({
      mode: businessMode,
      summaryLines: executiveSummary,
      speakerCount: analytics?.speakerCount ?? 0,
      customerProfile,
      salesInsights,
      supportInsights,
      commitments,
      followUps,
    });
    return output.fullNote;
  }, [businessMode, executiveSummary, analytics, customerProfile, salesInsights, supportInsights, commitments, followUps]);

  const handleCopy = useCallback(() => {
    const note = getCrmNote();
    navigator.clipboard.writeText(note).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [getCrmNote]);

  if (!businessMode || !hasConfirmedItems) return null;

  const note = getCrmNote();

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
          CRM Note
        </h2>
        <Button size="sm" variant="secondary" onClick={handleCopy}>
          <Icon name="download" size={14} />
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>
      <pre className="text-xs text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-md whitespace-pre-wrap font-mono overflow-auto max-h-64">
        {note}
      </pre>
    </div>
  );
}
