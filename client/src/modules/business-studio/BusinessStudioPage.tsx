/**
 * Business Studio Module - Page Component
 *
 * Main dashboard for business intelligence analysis. Orchestrates the
 * analysis pipeline and displays results in a mode-driven card layout:
 * Executive Summary, Customer Insights, Sales Signals, Support Signals,
 * Actions, Risks, Opportunities, Commitments, Follow-ups, CRM Output.
 *
 * Architecture decision: Client-side business intelligence extraction
 * using pattern matching. Human-in-the-loop review workflow ensures
 * only confirmed items reach export. 100% privacy-preserving.
 *
 * Card visibility is mode-driven:
 * - sales-call/discovery-call: Customer + Sales panels visible
 * - customer-support: Support panel visible
 * - recruitment-interview: Interview panel visible
 * - All modes: Risks, Opportunities, Commitments, Follow-ups
 *
 * Route: /business
 */

import { useEffect } from 'react';
import { Button, Icon, Badge } from '@/shared/components';
import { useActiveTranscript } from './hooks/useActiveTranscript';
import { useBusinessAnalysis } from './hooks/useBusinessAnalysis';
import { useBusinessExport } from './hooks/useBusinessExport';
import { useBusinessStudioStore } from './store';
import {
  ExecutiveSummaryCard,
  CustomerInsightsPanel,
  SalesSignalsPanel,
  SupportSignalsPanel,
  RisksPanel,
  OpportunitiesPanel,
  CommitmentsPanel,
  FollowUpsPanel,
  CrmOutputPanel,
  InterviewPanel,
} from './components';

/**
 * Business Studio page component
 */
export function BusinessStudioPage() {
  const { transcript, hasTranscript } = useActiveTranscript();
  const { analyze, reset, isAnalyzing, error } = useBusinessAnalysis();
  const { hasConfirmedItems, getExportPayload } = useBusinessExport();
  const businessMode = useBusinessStudioStore((s) => s.businessMode);

  // Reset analysis when transcript changes
  useEffect(() => {
    reset();
  }, [transcript?.id, reset]);

  // No transcript loaded state
  if (!hasTranscript) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
          <Icon name="business" size={32} className="text-neutral-400" />
        </div>
        <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
          Business Studio
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md">
          No transcript loaded. Process an audio file in the Speech Engine and send it here
          to extract business intelligence: customer insights, sales signals, commitments,
          risks, and CRM-ready outputs.
        </p>
        <Badge variant="privacy" className="mt-4">
          <Icon name="shield" size={12} />
          100% Client-Side Processing
        </Badge>
      </div>
    );
  }

  /** Determine which panels are visible based on mode */
  const showSalesPanel = businessMode === 'sales-call' || businessMode === 'discovery-call';
  const showSupportPanel = businessMode === 'customer-support';
  const showInterviewPanel = businessMode === 'recruitment-interview';
  // Customer insights, risks, opportunities, commitments, follow-ups always visible
  const showCustomerPanel = businessMode === 'sales-call'
    || businessMode === 'discovery-call'
    || businessMode === 'client-meeting'
    || businessMode === 'customer-support';

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
            Business Studio
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Analyze &ldquo;{transcript?.source.filename}&rdquo;
          </p>
        </div>
        <Badge variant="privacy">
          <Icon name="shield" size={12} />
          100% Client-Side
        </Badge>
      </div>

      {/* Analyze action */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="primary"
          size="md"
          disabled={isAnalyzing}
          onClick={() => transcript && analyze(transcript)}
        >
          <Icon name="business" size={16} />
          {isAnalyzing ? 'Analyzing...' : businessMode ? 'Re-Analyze' : 'Analyze Business Call'}
        </Button>
        {hasConfirmedItems && (
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              const payload = getExportPayload();
              sessionStorage.setItem('squicky:business_export', JSON.stringify(payload));
            }}
          >
            <Icon name="download" size={16} />
            Export Confirmed Items
          </Button>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {isAnalyzing && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Analyzing business conversation...
          </p>
        </div>
      )}

      {/* Results dashboard */}
      {businessMode && !isAnalyzing && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content (2/3 width on desktop) */}
          <div className="lg:col-span-2 space-y-4">
            <ExecutiveSummaryCard />
            {showCustomerPanel && <CustomerInsightsPanel />}
            {showSalesPanel && <SalesSignalsPanel />}
            {showSupportPanel && <SupportSignalsPanel />}
            {showInterviewPanel && <InterviewPanel />}
            <CommitmentsPanel />
            <FollowUpsPanel />
          </div>

          {/* Sidebar (1/3 width on desktop) */}
          <div className="space-y-4">
            <RisksPanel />
            <OpportunitiesPanel />
            <CrmOutputPanel />
          </div>
        </div>
      )}
    </div>
  );
}
