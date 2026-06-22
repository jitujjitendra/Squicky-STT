/**
 * Creator Studio Module - Barrel exports
 *
 * Content repurposing module with YouTube, Podcast, and Shorts/Reels modes.
 * Consumes ContentIntelligenceCache for platform-specific content formatting.
 */

export { CreatorStudioPage } from './CreatorStudioPage';
export { useCreatorStudioStore } from './store';
export type {
  CreatorMode,
  OutputCard,
  YouTubeOutputs,
  PodcastOutputs,
  ShortsOutputs,
  ChapterMarker,
  HighlightSegment,
  CreatorStudioState,
} from './types';
export {
  generateYouTubeOutputs,
  generatePodcastOutputs,
  generateShortsOutputs,
  detectChapters,
  formatTimestamp,
} from './services';
