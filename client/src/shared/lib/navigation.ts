/**
 * Navigation Configuration
 * 
 * Centralized navigation data used by sidebar and routing.
 * Modules are grouped into PLATFORM (homepage/dashboard), CORE (primary workflow)
 * and STUDIOS (specialized tools).
 * 
 * Architecture decision: Navigation is data-driven to support
 * future features like role-based access control, module
 * enable/disable toggles, and dynamic module loading.
 */

import type { NavGroup } from '@/types';

export const navigationGroups: NavGroup[] = [
  {
    label: 'PLATFORM',
    items: [
      {
        id: 'homepage',
        label: 'Homepage',
        path: '/',
        icon: 'home',
        description:
          'Return to the Squicky STT landing page with platform overview and branding.',
        isActive: true,
      },
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/dashboard',
        icon: 'grid',
        description:
          'Central hub showing all available modules and quick access to every tool.',
        isActive: true,
      },
    ],
  },
  {
    label: 'CORE',
    items: [
      {
        id: 'speech-engine',
        label: 'Speech Engine',
        path: '/speech-engine',
        icon: 'mic',
        description:
          'Upload and process audio files with AI-powered speech recognition. Supports multiple formats and languages with privacy-first local processing.',
        isActive: true,
      },
      {
        id: 'transcript-studio',
        label: 'Transcript Studio',
        path: '/transcript',
        icon: 'document',
        description:
          'Review, edit, and refine transcription results. Features speaker identification, timestamp navigation, and collaborative editing.',
        isActive: true,
      },
      {
        id: 'export-center',
        label: 'Export Center',
        path: '/export',
        icon: 'download',
        description:
          'Export transcripts in multiple formats including TXT, SRT, VTT, DOCX, and PDF. Configure formatting and metadata options.',
        isActive: true,
      },
    ],
  },
  {
    label: 'STUDIOS',
    items: [
      {
        id: 'subtitle-studio',
        label: 'Subtitle Studio',
        path: '/subtitles',
        icon: 'subtitles',
        description:
          'Create and edit synchronized subtitles with timeline editing, style customization, and multi-language support.',
        isActive: true,
      },
      {
        id: 'content-studio',
        label: 'Content Studio',
        path: '/content',
        icon: 'content',
        description:
          'Transform transcripts into blog posts, articles, summaries, and social media content with AI-assisted writing tools.',
        isActive: true,
      },
      {
        id: 'meeting-intelligence',
        label: 'Meeting Intelligence',
        path: '/meeting',
        icon: 'meeting',
        description:
          'Extract meeting insights including action items, decisions, topics, and participant contributions from recorded discussions.',
        isActive: true,
      },
      {
        id: 'creator-studio',
        label: 'Creator Studio',
        path: '/creator',
        icon: 'creator',
        description:
          'Tools for content creators including show notes generation, chapter markers, highlight extraction, and repurposing workflows.',
        isActive: true,
      },
      {
        id: 'business-studio',
        label: 'Business Studio',
        path: '/business',
        icon: 'business',
        description:
          'Business analytics, reporting, and workflow automation. Generate insights from conversations and track communication metrics.',
        isActive: true,
      },
    ],
  },
];

/**
 * Flat list of all navigation items for quick lookup
 */
export const allNavItems = navigationGroups.flatMap((group) => group.items);

/**
 * Find a navigation item by its ID
 */
export function getNavItemById(id: string) {
  return allNavItems.find((item) => item.id === id);
}
