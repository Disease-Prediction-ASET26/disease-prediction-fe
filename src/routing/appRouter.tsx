import type { RouteObject } from 'react-router-dom';
import { createBrowserRouter } from 'react-router-dom';
import { PATHS } from './paths';
import { RootLayout } from './RootLayout';
import { AssessmentRoute } from './routes/AssessmentRoute';
import { EmergencyRoute } from './routes/EmergencyRoute';
import { HomePage } from './routes/HomePage';
import { NotFoundPage } from './routes/NotFoundPage';
import { ResultRoute } from './routes/ResultRoute';

/**
 * Route model → router configuration. Future views (FR-P4 specialty routing, FR-D1 doctor
 * portal) are added as further children of `RootLayout`; a guard for FR-G1 would wrap them in a
 * pathless layout route.
 */
export const appRoutes: RouteObject[] = [
  {
    path: PATHS.home,
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: PATHS.assessment, element: <AssessmentRoute /> },
      { path: PATHS.result, element: <ResultRoute /> },
      { path: PATHS.emergency, element: <EmergencyRoute /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export function createAppRouter() {
  return createBrowserRouter(appRoutes);
}
