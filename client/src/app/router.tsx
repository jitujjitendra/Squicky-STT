/**
 * Application Router
 * 
 * Defines all routes using React Router v6's createBrowserRouter.
 * Each module maps to a dedicated route within the MainLayout wrapper.
 * 
 * Architecture decision: Using createBrowserRouter for data-driven
 * routing which supports loaders, actions, and error boundaries.
 * Routes are lazy-loadable in the future for code-splitting.
 * 
 * Route structure:
 *   / .............. Speech Engine (home / upload zone)
 *   /transcript .... Transcript Studio
 *   /export ........ Export Center
 *   /subtitles ..... Subtitle Studio
 *   /content ....... Content Studio
 *   /meeting ....... Meeting Intelligence
 *   /creator ....... Creator Studio
 *   /business ...... Business Studio
 */

import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from './layout';
import { SpeechEnginePage } from '@/modules/speech-engine';
import { TranscriptStudioPage } from '@/modules/transcript-studio';
import { ExportCenterPage } from '@/modules/export-center';
import { SubtitleStudioPage } from '@/modules/subtitle-studio';
import { ContentStudioPage } from '@/modules/content-studio';
import { MeetingIntelligencePage } from '@/modules/meeting-intelligence';
import { CreatorStudioPage } from '@/modules/creator-studio';
import { BusinessStudioPage } from '@/modules/business-studio';

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      {
        path: '/',
        element: <SpeechEnginePage />,
      },
      {
        path: '/transcript',
        element: <TranscriptStudioPage />,
      },
      {
        path: '/export',
        element: <ExportCenterPage />,
      },
      {
        path: '/subtitles',
        element: <SubtitleStudioPage />,
      },
      {
        path: '/content',
        element: <ContentStudioPage />,
      },
      {
        path: '/meeting',
        element: <MeetingIntelligencePage />,
      },
      {
        path: '/creator',
        element: <CreatorStudioPage />,
      },
      {
        path: '/business',
        element: <BusinessStudioPage />,
      },
    ],
  },
]);
