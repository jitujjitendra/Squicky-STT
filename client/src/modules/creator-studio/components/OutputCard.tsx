/**
 * OutputCard Component
 *
 * Renders a single output card with title, content, character count,
 * and action buttons (Copy, Edit, Regenerate).
 * Supports inline editing via textarea toggle.
 */

import { useState, useCallback } from 'react';
import { Button } from '@/shared/components';
import { useCreatorStudioStore } from '../store';
import type { OutputCard as OutputCardType } from '../types';

interface OutputCardProps {
  /** The card data to render */
  card: OutputCardType;
  /** Called when regenerate is clicked */
  onRegenerate?: () => void;
}

export function OutputCard({ card, onRegenerate }: OutputCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(card.content);
  const [copied, setCopied] = useState(false);

  const mode = useCreatorStudioStore((s) => s.mode);
  const updateCard = useCreatorStudioStore((s) => s.updateCard);

  /** Copy content to clipboard */
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(card.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = card.content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [card.content]);

  /** Start editing */
  const handleEdit = useCallback(() => {
    setEditValue(card.content);
    setIsEditing(true);
  }, [card.content]);

  /** Save edit */
  const handleSave = useCallback(() => {
    updateCard(mode, card.id, editValue);
    setIsEditing(false);
  }, [mode, card.id, editValue, updateCard]);

  /** Cancel edit */
  const handleCancel = useCallback(() => {
    setEditValue(card.content);
    setIsEditing(false);
  }, [card.content]);

  /** Character count color */
  const charCountColor = card.maxChars && card.charCount > card.maxChars
    ? 'text-red-500'
    : 'text-neutral-500 dark:text-neutral-400';

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-700">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {card.title}
          </h3>
          {card.isEdited && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
              Edited
            </span>
          )}
        </div>
        <span className={`text-xs ${charCountColor}`}>
          {card.charCount} chars
          {card.maxChars ? ` / ${card.maxChars}` : ''}
        </span>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full min-h-[120px] p-3 rounded-md border border-neutral-300 dark:border-neutral-600
                         bg-neutral-50 dark:bg-neutral-900 text-sm text-neutral-900 dark:text-neutral-100
                         resize-y focus:outline-2 focus:outline-accent"
              aria-label={`Edit ${card.title}`}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSave}>
                Save
              </Button>
            </div>
          </div>
        ) : (
          <pre className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300 font-sans leading-relaxed max-h-64 overflow-y-auto">
            {card.content}
          </pre>
        )}
      </div>

      {/* Actions */}
      {!isEditing && (
        <div className="flex items-center gap-2 px-4 py-2 border-t border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleEdit}>
            Edit
          </Button>
          {onRegenerate && (
            <Button variant="ghost" size="sm" onClick={onRegenerate}>
              Regenerate
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
