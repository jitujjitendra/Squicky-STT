/**
 * Application Providers
 * 
 * Wraps the app with all necessary context providers.
 * Includes React Router and React Query (TanStack Query).
 * Zustand stores don't need a provider (they use module-level state).
 * 
 * Architecture decision: Centralized providers make it easy
 * to add global state, query clients, or other contexts
 * without modifying the entry point.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';

/**
 * React Query client configuration
 * - No automatic refetching (privacy: minimize network calls)
 * - Stale time: 5 minutes (sufficient for session-based data)
 * - Retry: 2 attempts for transient failures
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false, // Privacy: no background requests
      refetchOnReconnect: false,
    },
  },
});

export function AppProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
