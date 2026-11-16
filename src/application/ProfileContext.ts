import { createContext, useContext } from 'react';
import type { CreateProfileRequest, Profile } from '../domain/profile';

/**
 * - `none`: nobody is signed in.
 * - `loading`: asking the backend for the profile.
 * - `needs-onboarding`: signed in, but no app profile yet (first login).
 * - `ready`: the profile is loaded.
 * - `error`: the profile could not be loaded; `reload` retries.
 */
export type ProfileStatus = 'none' | 'loading' | 'needs-onboarding' | 'ready' | 'error';

export interface ProfileState {
  status: ProfileStatus;
  profile: Profile | null;
  errorMessage: string | null;
  errorCode: string | null;
  reload: () => void;
  /** Rejects with the API error so the form can show it. */
  createProfile: (request: CreateProfileRequest) => Promise<Profile>;
  recordConsent: (granted: boolean) => Promise<Profile>;
}

export const ProfileContext = createContext<ProfileState | null>(null);

export function useProfile(): ProfileState {
  const state = useContext(ProfileContext);
  if (!state) throw new Error('useProfile must be used inside <ProfileProvider>');
  return state;
}
