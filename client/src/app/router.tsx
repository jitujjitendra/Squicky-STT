/**
 * Application Router
 * 
 * Defines all routes using React Router v6's createHashRouter.
 * 
 * Route structure:
 *   / .............. Homepage (premium landing page, no MainLayout)
 *   /dashboard ..... Dashboard (module hub, within MainLayout)
 *   /speech-engine . Speech Engine (upload zone)
 *   /transcript .... Transcript Studio
 *   /export ........ Export Center
 *   /subtitles ..... Subtitle Studio
 *   /content ....... Content Studio
 *   /meeting ....... Meeting Intelligence
 *   /creator ....... Creator Studio
 *   /business ...... Business Studio
 * 
 * Architecture decision: The Homepage renders standalone (no sidebar/header)
 * to provide a full-screen immersive landing experience. All other routes
 * use MainLayout with the sidebar and header.
 */

import { createHashRouter } from 'react-router-dom';
import { MainLayout } from './layout';
import { HomePage } from '@/modules/homepage';
import { DashboardPage } from '@/modules/dashboard';
import { SpeechEnginePage } from '@/modules/speech-engine';
import { TranscriptStudioPage } from '@/modules/transcript-studio';
import { ExportCenterPage } from '@/modules/export-center';
import { SubtitleStudioPage } from '@/modules/subtitle-studio';
import { ContentStudioPage } from '@/modules/content-studio';
import { MeetingIntelligencePage } from '@/modules/meeting-intelligence';
import { CreatorStudioPage } from '@/modules/creator-studio';
import { BusinessStudioPage } from '@/modules/business-studio';

/**
 * Using createHashRouter for GitHub Pages compatibility.
 * GitHub Pages doesn't support SPA fallback (all routes -> index.html),
 * so hash-based routing (/#/path) ensures all routes work without server config.
 */
export const router = createHashRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    element: <MainLayout />,
    children: [
      {
        path: '/dashboard',
        element: <DashboardPage />,
      },
      {
        path: '/speech-engine',
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
