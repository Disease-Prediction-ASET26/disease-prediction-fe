import { createContext, useContext } from 'react';
import type { ProfileApiClient } from './ProfileApiClient';

/** DI seam for the `ProfileApiClient` port; provided by `AppProviders`. */
export const ProfileApiContext = createContext<ProfileApiClient | null>(null);

export function useProfileApiClient(): ProfileApiClient {
  const client = useContext(ProfileApiContext);
  if (!client) throw new Error('useProfileApiClient must be used inside <AppProviders>');
  return client;
}
