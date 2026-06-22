/**
 * Content Studio Module - Page Component
 *
 * Main page for the Content Studio module. Orchestrates the content
 * generation workflow: type selection, generation, quality assessment,
 * and source visualization.
 *
 * Architecture decision: Extractive-only intelligence (Stage 1).
 * All content is derived from the transcript using TF-IDF and TextRank.
 * 100% client-side processing, no external API calls.
 *
 * Route: /content
 */

import React from 'react';
import { Button, Icon, Badge } from '@/shared/components';
import { useActiveTranscript } from './hooks/useActiveTranscript';
import { useContentGeneration } from './hooks/useContentGeneration';
import { useContentStudioStore } from './store';
import {
  ContentTypeSelector,
  ContentOutput,
  QualityPanel,
  SourcePanel,
} from './components';

/**
 * Content Studio page
 */
export function ContentStudioPage() {
  const { transcript, hasTranscript } = useActiveTranscript();
  const { generate, regenerate, isGenerating } = useContentGeneration();
  const generatedContent = useContentStudioStore((s) => s.generatedContent);

  // No transcript loaded state
  if (!hasTranscript) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
          <Icon name="content" size={32} className="text-neutral-400" />
        </div>
        <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
          Content Studio
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md">
          No transcript loaded. Process an audio file in the Speech Engine and send it here
          to generate blog posts, summaries, meeting notes, and social content.
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
            Content Studio
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Generate content from &ldquo;{transcript?.source.filename}&rdquo;
          </p>
        </div>
        <Badge variant="privacy">
          <Icon name="shield" size={12} />
          100% Client-Side
        </Badge>
      </div>

      {/* Content type selector */}
      <ContentTypeSelector />

      {/* Generate / Regenerate actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="primary"
          size="md"
          disabled={isGenerating}
          onClick={() => generate()}
        >
          <Icon name="content" size={16} />
          {isGenerating ? 'Generating...' : 'Generate'}
        </Button>
        {generatedContent && (
          <Button
            variant="secondary"
            size="md"
            disabled={isGenerating}
            onClick={regenerate}
          >
            Regenerate
          </Button>
        )}
      </div>

      {/* Main content area - two column layout on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Content output (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          <ContentOutput />
        </div>

        {/* Right: Quality + Source (1/3 width) */}
        <div className="space-y-4">
          <QualityPanel />
          <SourcePanel />
        </div>
      </div>
    </div>
  );
}
