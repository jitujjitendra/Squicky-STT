/**
 * OutputPanel Component
 *
 * Renders the output cards for the currently active mode.
 * YouTube: 7 cards, Podcast: 5 cards, Shorts: 4 cards.
 * Stacked cards layout with full-width on mobile.
 */

import { useCreatorStudioStore } from '../store';
import { OutputCard } from './OutputCard';
import type { OutputCard as OutputCardType } from '../types';

interface OutputPanelProps {
  /** Called when any card's regenerate button is clicked */
  onRegenerate: () => void;
}

export function OutputPanel({ onRegenerate }: OutputPanelProps) {
  const mode = useCreatorStudioStore((s) => s.mode);
  const youtubeOutputs = useCreatorStudioStore((s) => s.youtubeOutputs);
  const podcastOutputs = useCreatorStudioStore((s) => s.podcastOutputs);
  const shortsOutputs = useCreatorStudioStore((s) => s.shortsOutputs);

  /** Get the cards array for the active mode */
  const getCards = (): OutputCardType[] => {
    switch (mode) {
      case 'youtube':
        if (!youtubeOutputs) return [];
        return [
          youtubeOutputs.titleSuggestions,
          youtubeOutputs.description,
          youtubeOutputs.chapters,
          youtubeOutputs.tags,
          youtubeOutputs.hashtags,
          youtubeOutputs.pinnedComment,
          youtubeOutputs.shortsIdeas,
        ];
      case 'podcast':
        if (!podcastOutputs) return [];
        return [
          podcastOutputs.episodeTitle,
          podcastOutputs.showNotes,
          podcastOutputs.keyTakeaways,
          podcastOutputs.guestHighlights,
          podcastOutputs.chapterMarkers,
        ];
      case 'shorts':
        if (!shortsOutputs) return [];
        return [
          shortsOutputs.highlights,
          shortsOutputs.hookSuggestions,
          shortsOutputs.captionIdeas,
          shortsOutputs.bestTimestamps,
        ];
      default:
        return [];
    }
  };

  const cards = getCards();

  if (cards.length === 0) {
    return null;
  }

  return (
    <div
      className="flex flex-col gap-4 w-full"
      role="tabpanel"
      id={`panel-${mode}`}
      aria-label={`${mode} outputs`}
    >
      {cards.map((card) => (
        <OutputCard
          key={card.id}
          card={card}
          onRegenerate={onRegenerate}
        />
      ))}
    </div>
  );
}
