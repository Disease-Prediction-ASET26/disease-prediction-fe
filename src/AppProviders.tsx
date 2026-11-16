import type { ReactNode } from 'react';
import { useMemo } from 'react';
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

export interface AppProvidersProps {
  authClient: AuthClient;
  initialAuthStatus?: AuthStatus;
  initialProfile?: Profile | null;
  children: ReactNode;
}

/** Builds the API clients on top of the session: every call carries the Bearer token. */
function ApiClientsProvider({ children }: { children: ReactNode }) {
  const { client, handleUnauthorized } = useAuth();
  const clients = useMemo(() => {
    const authorizedFetch = createAuthorizedFetch(
      () => client.getSessionToken(),
      handleUnauthorized,
    );
    const baseUrl = resolveApiBaseUrl();
    return {
      assessment: new HttpAssessmentApiClient(baseUrl, authorizedFetch),
      profile: new HttpProfileApiClient(authorizedFetch, baseUrl),
    };
  }, [client, handleUnauthorized]);
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
  children,
}: AppProvidersProps) {
  return (
    <AuthProvider client={authClient} initialStatus={initialAuthStatus}>
      <ApiClientsProvider>
        <ProfileProvider initialProfile={initialProfile}>{children}</ProfileProvider>
      </ApiClientsProvider>
    </AuthProvider>
  );
}
