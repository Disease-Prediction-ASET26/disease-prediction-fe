import type { RouteObject } from 'react-router-dom';
import { createBrowserRouter } from 'react-router-dom';
import { RequireAuth } from './guards/RequireAuth';
import { RequirePatientConsent } from './guards/RequirePatientConsent';
import { RequireProfile } from './guards/RequireProfile';
import { PATHS } from './paths';
import { RootLayout } from './RootLayout';
import { AccountRoute } from './routes/AccountRoute';
import { AssessmentRoute } from './routes/AssessmentRoute';
import { EmergencyRoute } from './routes/EmergencyRoute';
import { HomePage } from './routes/HomePage';
import { LoginRoute } from './routes/LoginRoute';
import { NotFoundPage } from './routes/NotFoundPage';
import { OnboardingRoute } from './routes/OnboardingRoute';
import { ResultRoute } from './routes/ResultRoute';

/**
 * Route model → router configuration. Future views (FR-P4 specialty routing, FR-D1 doctor
 * portal) are added as further children of `RootLayout`.
 *
 * MDD Iteration 6: pathless guard routes. `RequireAuth` (session) → `RequireProfile` (onboarding
 * done) → `RequirePatientConsent` (UC1 step 1) wrap the views that call the API. Home, login and
 * the not-found page stay public.
 */
export const appRoutes: RouteObject[] = [
  {
    path: PATHS.home,
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: PATHS.login, element: <LoginRoute /> },
      {
        element: <RequireAuth />,
        children: [
          { path: PATHS.onboarding, element: <OnboardingRoute /> },
          {
            element: <RequireProfile />,
            children: [
              { path: PATHS.account, element: <AccountRoute /> },
              {
                element: <RequirePatientConsent />,
                children: [
                  { path: PATHS.assessment, element: <AssessmentRoute /> },
                  { path: PATHS.result, element: <ResultRoute /> },
                  { path: PATHS.emergency, element: <EmergencyRoute /> },
                ],
              },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export function createAppRouter() {
  return createBrowserRouter(appRoutes);
}
