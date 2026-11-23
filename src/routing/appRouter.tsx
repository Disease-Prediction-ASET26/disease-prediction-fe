import type { RouteObject } from 'react-router-dom';
import { createBrowserRouter } from 'react-router-dom';
import { RequireAuth } from './guards/RequireAuth';
import { RequirePatientConsent } from './guards/RequirePatientConsent';
import { RequireProfile } from './guards/RequireProfile';
import { RequireRole } from './guards/RequireRole';
import { PATHS } from './paths';
import { RootLayout } from './RootLayout';
import { AccountRoute } from './routes/AccountRoute';
import { AssessmentRoute } from './routes/AssessmentRoute';
import { EmergencyRoute } from './routes/EmergencyRoute';
import { HomePage } from './routes/HomePage';
import { LoginRoute } from './routes/LoginRoute';
import { NotFoundPage } from './routes/NotFoundPage';
import { OnboardingRoute } from './routes/OnboardingRoute';
import { ReportDetailRoute } from './routes/ReportDetailRoute';
import { ReportsRoute } from './routes/ReportsRoute';
import { ResultRoute } from './routes/ResultRoute';
import {
  AdminAuditRoute,
  AdminDoctorsRoute,
  AdminModelRoute,
  AdminUsersRoute,
  AppointmentsRoute,
  DoctorAssessmentsRoute,
  DoctorProfileRoute,
  DoctorScheduleRoute,
} from './routes/workspaces';

/**
 * Route model → router configuration. Future views (FR-P4 specialty routing, FR-D1 doctor
 * portal) are added as further children of `RootLayout`.
 *
 * MDD Iteration 6: pathless guard routes. `RequireAuth` (session) → `RequireProfile` (onboarding
 * done) → `RequirePatientConsent` (UC1 step 1) wrap the views that call the API. Home, login and
 * the not-found page stay public.
 *
 * Pocket Doc app shell: `RequireRole` splits the patient, doctor and administrator workspaces. The
 * patient's stored reports need a profile but not an active consent (the backend allows reading
 * your own data after withdrawing consent); starting an assessment still needs consent.
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
              {
                element: <RequireRole roles={['PATIENT']} />,
                children: [
                  { path: PATHS.reports, element: <ReportsRoute /> },
                  { path: PATHS.reportDetail, element: <ReportDetailRoute /> },
                  { path: PATHS.appointments, element: <AppointmentsRoute /> },
                ],
              },
              {
                element: <RequireRole roles={['DOCTOR']} />,
                children: [
                  { path: PATHS.doctorAssessments, element: <DoctorAssessmentsRoute /> },
                  { path: PATHS.doctorSchedule, element: <DoctorScheduleRoute /> },
                  { path: PATHS.doctorProfile, element: <DoctorProfileRoute /> },
                ],
              },
              {
                element: <RequireRole roles={['ADMIN']} />,
                children: [
                  { path: PATHS.adminDoctors, element: <AdminDoctorsRoute /> },
                  { path: PATHS.adminUsers, element: <AdminUsersRoute /> },
                  { path: PATHS.adminModel, element: <AdminModelRoute /> },
                  { path: PATHS.adminAudit, element: <AdminAuditRoute /> },
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
