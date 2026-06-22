/**
 * ContentTypeSelector Component
 *
 * Tab/chip-based selector for choosing the content generation type.
 * Displays all 8 content types with labels and descriptions.
 */

import React from 'react';
import { useContentStudioStore } from '../store';
import type { ContentType } from '../types';

/** Content type metadata for display */
const CONTENT_TYPE_OPTIONS: Array<{
  type: ContentType;
  label: string;
  shortLabel: string;
  category: string;
}> = [
  { type: 'summary-short', label: 'Short Summary', shortLabel: 'Short', category: 'Summaries' },
  { type: 'summary-detailed', label: 'Detailed Summary', shortLabel: 'Detailed', category: 'Summaries' },
  { type: 'summary-executive', label: 'Executive Summary', shortLabel: 'Executive', category: 'Summaries' },
  { type: 'blog', label: 'Blog Post', shortLabel: 'Blog', category: 'Content' },
  { type: 'faq', label: 'FAQ', shortLabel: 'FAQ', category: 'Content' },
  { type: 'notes-meeting', label: 'Meeting Notes', shortLabel: 'Meeting', category: 'Notes' },
  { type: 'notes-quick', label: 'Quick Notes', shortLabel: 'Quick', category: 'Notes' },
  { type: 'social-linkedin', label: 'LinkedIn', shortLabel: 'LinkedIn', category: 'Social' },
  { type: 'social-twitter', label: 'Twitter/X', shortLabel: 'Twitter', category: 'Social' },
];

/**
 * Content type selector with chip-based UI
 */
export function ContentTypeSelector() {
  const selectedType = useContentStudioStore((s) => s.selectedType);
  const setSelectedType = useContentStudioStore((s) => s.setSelectedType);

  // Group by category
  const categories = CONTENT_TYPE_OPTIONS.reduce<Record<string, typeof CONTENT_TYPE_OPTIONS>>(
    (acc, option) => {
      if (!acc[option.category]) acc[option.category] = [];
      acc[option.category].push(option);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
        Content Type
      </h2>
      {Object.entries(categories).map(([category, options]) => (
        <div key={category} className="space-y-1.5">
          <span className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
            {category}
          </span>
          <div className="flex flex-wrap gap-2">
            {options.map((option) => (
              <button
                key={option.type}
                onClick={() => setSelectedType(option.type)}
                className={`
                  px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200
                  ${selectedType === option.type
                    ? 'bg-accent text-primary-dark shadow-sm'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }
                `}
                aria-pressed={selectedType === option.type}
              >
                {option.shortLabel}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
