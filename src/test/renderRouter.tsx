import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import type { InitialEntry } from 'react-router-dom';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { AppProviders } from '../AppProviders';
import type { AuthStatus } from '../auth/AuthContext';
import type { Profile } from '../domain/profile';
import { appRoutes } from '../routing/appRouter';
import { FakeAuthClient } from './FakeAuthClient';
import { patientProfile } from './mocks/fixtures';

export interface RenderAppOptions {
  entries?: InitialEntry[];
  auth?: FakeAuthClient;
  /** Known session state at the first render; omit to start in `loading` like the app. */
  authStatus?: AuthStatus;
  /** Profile already loaded at the first render; omit to load it from `GET /api/me`. */
  profile?: Profile | null;
}

/** Renders the real route table and providers in a memory router, with a fake Hanko. */
export function renderApp({
  entries = ['/'],
  auth = new FakeAuthClient(true),
  authStatus,
  profile,
}: RenderAppOptions = {}) {
  const router = createMemoryRouter(appRoutes, { initialEntries: entries });
  const view = render(
    <AppProviders authClient={auth} initialAuthStatus={authStatus} initialProfile={profile}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return { router, auth, ...view };
}

/** A signed-in patient with consent, profile already loaded (the Iteration 3/4 tests' world). */
export function renderAppAt(...initialEntries: InitialEntry[]) {
  return renderApp({
    entries: initialEntries,
    authStatus: 'authenticated',
    profile: { ...patientProfile },
  });
}

/** Renders a single component inside a signed-in session (real authorized API clients). */
export function renderWithSession(
  ui: ReactElement,
  auth: FakeAuthClient = new FakeAuthClient(true),
) {
  return render(
    <AppProviders
      authClient={auth}
      initialAuthStatus="authenticated"
      initialProfile={{ ...patientProfile }}
    >
      {ui}
    </AppProviders>,
  );
}
