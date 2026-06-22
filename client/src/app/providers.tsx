/**
 * Application Providers
 * 
 * Wraps the app with all necessary context providers.
 * Currently includes React Router; will add React Query
 * and other providers as modules are implemented.
 * 
 * Architecture decision: Centralized providers make it easy
 * to add global state, query clients, or other contexts
 * without modifying the entry point.
 */

import { RouterProvider } from 'react-router-dom';
import { router } from './router';

export function AppProviders() {
  return <RouterProvider router={router} />;
}
