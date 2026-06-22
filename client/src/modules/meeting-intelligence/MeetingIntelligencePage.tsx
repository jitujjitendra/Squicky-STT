/**
 * Meeting Intelligence Module - Page Component
 *
 * Main dashboard for meeting analysis. Orchestrates the analysis pipeline
 * and displays results in a card-based layout: summary, action items,
 * decisions, risks, deadlines, and speaker statistics.
 *
 * Architecture decision: Client-side meeting intelligence extraction
 * using pattern matching. Human-in-the-loop review workflow ensures
 * only confirmed items reach export. 100% privacy-preserving.
 *
 * Route: /meeting
 */

import { useEffect } from 'react';
import { Button, Icon, Badge } from '@/shared/components';
import { useActiveTranscript } from './hooks/useActiveTranscript';
import { useMeetingAnalysis } from './hooks/useMeetingAnalysis';
import { useMeetingExport } from './hooks/useMeetingExport';
import { useMeetingIntelligenceStore } from './store';
import {
  SummaryCard,
  ActionItemsList,
  DecisionsList,
  RisksList,
  DeadlinesList,
  SpeakerStatsPanel,
} from './components';

/**
 * Meeting Intelligence page component
 */
export function MeetingIntelligencePage() {
  const { transcript, hasTranscript } = useActiveTranscript();
  const { analyze, reset, isAnalyzing, error } = useMeetingAnalysis();
  const { hasConfirmedItems, getExportPayload } = useMeetingExport();
  const summary = useMeetingIntelligenceStore((s) => s.summary);
  const speakerStats = useMeetingIntelligenceStore((s) => s.speakerStats);

  // Reset analysis when transcript changes
  useEffect(() => {
    reset();
  }, [transcript?.id, reset]);

  // No transcript loaded state
  if (!hasTranscript) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
          <Icon name="meeting" size={32} className="text-neutral-400" />
        </div>
        <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
          Meeting Intelligence
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md">
          No transcript loaded. Process an audio file in the Speech Engine and send it here
          to extract action items, decisions, risks, deadlines, and speaker analytics.
        </p>
        <Badge variant="privacy" className="mt-4">
          <Icon name="shield" size={12} />
          100% Client-Side Processing
        </Badge>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
            Meeting Intelligence
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
          <Icon name="meeting" size={16} />
          {isAnalyzing ? 'Analyzing...' : summary ? 'Re-Analyze' : 'Analyze Meeting'}
        </Button>
        {hasConfirmedItems && (
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              const payload = getExportPayload();
              // Store export payload in sessionStorage for Export Center
              sessionStorage.setItem('squicky:meeting_export', JSON.stringify(payload));
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
            Analyzing meeting transcript...
          </p>
        </div>
      )}

      {/* Results dashboard */}
      {summary && !isAnalyzing && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content (2/3 width on desktop) */}
          <div className="lg:col-span-2 space-y-4">
            <SummaryCard />
            <ActionItemsList />
            <DecisionsList />
            <RisksList />
            <DeadlinesList />
          </div>

          {/* Sidebar (1/3 width on desktop) */}
          <div className="space-y-4">
            {speakerStats.length > 0 && <SpeakerStatsPanel />}
          </div>
        </div>
      )}
    </div>
  );
}
