/**
 * ContentOutput Component
 *
 * Renders the generated content with support for markdown-like formatting.
 * Provides copy and export actions.
 */

import { useState } from 'react';
import { Button, Icon } from '@/shared/components';
import { useContentStudioStore } from '../store';
import { useContentExport } from '../hooks/useContentExport';

/**
 * Render generated content with basic formatting
 */
export function ContentOutput() {
  const generatedContent = useContentStudioStore((s) => s.generatedContent);
  const isGenerating = useContentStudioStore((s) => s.isGenerating);
  const error = useContentStudioStore((s) => s.error);
  const { exportContent, copyToClipboard, canExport } = useContentExport();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Loading state
  if (isGenerating) {
    return (
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            Generating content...
          </span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
      </div>
    );
  }

  // Empty state
  if (!generatedContent) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 dark:border-neutral-600 p-8 text-center">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Select a content type and click Generate to create content from your transcript.
        </p>
      </div>
    );
  }

  // Render content
  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
      {/* Header with actions */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
        <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {generatedContent.title}
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            <Icon name="document" size={14} />
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          {canExport && (
            <Button variant="secondary" size="sm" onClick={exportContent}>
              <Icon name="download" size={14} />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Content body */}
      <div className="p-4 max-h-[500px] overflow-y-auto">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {renderMarkdown(generatedContent.rendered)}
        </div>
      </div>

      {/* Footer metadata */}
      <div className="px-4 py-2 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Used {generatedContent.usedSegmentIndices.length} segments from transcript
          {' '}&middot;{' '}
          Generated {new Date(generatedContent.generatedAt).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}

/**
 * Simple markdown-to-JSX renderer for content output
 */
function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (const line of lines) {
    key++;

    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={key} className="text-lg font-bold text-neutral-800 dark:text-neutral-200 mt-4 mb-2">
          {line.slice(2)}
        </h1>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={key} className="text-base font-semibold text-neutral-700 dark:text-neutral-300 mt-3 mb-1.5">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith('- ')) {
      elements.push(
        <li key={key} className="text-sm text-neutral-600 dark:text-neutral-400 ml-4 list-disc">
          {line.slice(2)}
        </li>
      );
    } else if (line.startsWith('---')) {
      elements.push(
        <hr key={key} className="my-3 border-neutral-200 dark:border-neutral-700" />
      );
    } else if (line.startsWith('**Q:')) {
      // FAQ question
      const questionText = line.replace(/\*\*/g, '');
      elements.push(
        <p key={key} className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mt-3">
          {questionText}
        </p>
      );
    } else if (line.startsWith('A:')) {
      elements.push(
        <p key={key} className="text-sm text-neutral-600 dark:text-neutral-400 ml-2">
          {line}
        </p>
      );
    } else if (line.trim() === '') {
      elements.push(<div key={key} className="h-2" />);
    } else {
      elements.push(
        <p key={key} className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
          {line}
        </p>
      );
    }
  }

  return <>{elements}</>;
}
