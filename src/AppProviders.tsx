import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Theme } from '@radix-ui/themes';
import { AssessmentApiContext } from './api/AssessmentApiContext';
import { createAuthorizedFetch } from './api/authorizedFetch';
import { HttpAssessmentApiClient, resolveApiBaseUrl } from './api/HttpAssessmentApiClient';
import { HttpProfileApiClient } from './api/HttpProfileApiClient';
import { ProfileApiContext } from './api/ProfileApiContext';
import { ProfileProvider } from './application/ProfileProvider';
import type { AuthClient } from './auth/AuthClient';
import { useAuth } from './auth/AuthContext';
import type { AuthStatus } from './auth/AuthContext';
import { AuthProvider } from './auth/AuthProvider';
import type { Profile } from './domain/profile';
import { ThemeContext } from './ThemeContext';
import type { Appearance } from './ThemeContext';

export interface AppProvidersProps {
  authClient: AuthClient;
  initialAuthStatus?: AuthStatus;
  initialProfile?: Profile | null;
  fetchFn?: typeof fetch;
  children: ReactNode;
}

/** Builds the API clients on top of the session: every call carries the Bearer token. */
function ApiClientsProvider({
  children,
  fetchFn,
}: {
  children: ReactNode;
  fetchFn?: typeof fetch;
}) {
  const { client, handleUnauthorized } = useAuth();
  const clients = useMemo(() => {
    const authorizedFetch = createAuthorizedFetch(
      () => client.waitForSessionToken(),
      handleUnauthorized,
      fetchFn,
    );
    const baseUrl = resolveApiBaseUrl();
    return {
      assessment: new HttpAssessmentApiClient(baseUrl, authorizedFetch),
      profile: new HttpProfileApiClient(authorizedFetch, baseUrl),
    };
  }, [client, handleUnauthorized, fetchFn]);
  return (
    <AssessmentApiContext.Provider value={clients.assessment}>
      <ProfileApiContext.Provider value={clients.profile}>{children}</ProfileApiContext.Provider>
    </AssessmentApiContext.Provider>
  );
}

/** Session → API clients → profile. Wraps the router in the app and in tests. */
export function AppProviders({
  authClient,
  initialAuthStatus,
  initialProfile,
  fetchFn,
  children,
}: AppProvidersProps) {
  const [preference, setPreference] = useState<Appearance | null>(() => {
    try {
      const stored = window.localStorage.getItem('pocket-doc-theme');
      return stored === 'light' || stored === 'dark' ? stored : null;
    } catch {
      return null;
    }
  });
  const [systemDark, setSystemDark] = useState(
    () =>
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches,
  );
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemDark(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const appearance = preference ?? (systemDark ? 'dark' : 'light');
  useEffect(() => {
    document.documentElement.dataset.theme = appearance;
    return () => {
      delete document.documentElement.dataset.theme;
    };
  }, [appearance]);
  const toggle = () => {
    const next = appearance === 'light' ? 'dark' : 'light';
    setPreference(next);
    try {
      window.localStorage.setItem('pocket-doc-theme', next);
    } catch {
      /* Storage may be unavailable. */
    }
  };

  return (
    <ThemeContext.Provider value={{ appearance, toggle }}>
      <Theme appearance={appearance} accentColor="grass" grayColor="sage" radius="medium">
        <AuthProvider client={authClient} initialStatus={initialAuthStatus}>
          <ApiClientsProvider fetchFn={fetchFn}>
            <ProfileProvider initialProfile={initialProfile}>{children}</ProfileProvider>
          </ApiClientsProvider>
        </AuthProvider>
      </Theme>
    </ThemeContext.Provider>
  );
}
