import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useProfileApiClient } from '../api/ProfileApiContext';
import { ApiProblemError } from '../api/errors';
import { useAuth } from '../auth/AuthContext';
import type { CreateProfileRequest, Profile } from '../domain/profile';
import type { ProfileState, ProfileStatus } from './ProfileContext';
import { ProfileContext } from './ProfileContext';

export interface ProfileProviderProps {
  /** Tests start with a loaded profile; the app loads it after login. */
  initialProfile?: Profile | null;
  children: ReactNode;
}

/**
 * The signed-in user's app profile (MDD Iteration 6). Loaded from `GET /api/me` whenever a session
 * starts; a 404 means first login, so the guards send the user to onboarding.
 */
export function ProfileProvider({ initialProfile, children }: ProfileProviderProps) {
  const { status: authStatus } = useAuth();
  const client = useProfileApiClient();
  const [status, setStatus] = useState<ProfileStatus>(initialProfile ? 'ready' : 'none');
  const [profile, setProfile] = useState<Profile | null>(initialProfile ?? null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  // Only the latest load may update state (a logout can overtake a slow request).
  const latestLoad = useRef(0);
  const skipFirstLoad = useRef(Boolean(initialProfile));

  const load = useCallback(() => {
    const loadId = ++latestLoad.current;
    setStatus('loading');
    setErrorMessage(null);
    setErrorCode(null);
    client
      .getProfile()
      .then((loaded) => {
        if (loadId !== latestLoad.current) return;
        setProfile(loaded);
        setStatus(loaded ? 'ready' : 'needs-onboarding');
      })
      .catch((error: unknown) => {
        if (loadId !== latestLoad.current) return;
        setProfile(null);
        setErrorCode(error instanceof ApiProblemError ? error.code : null);
        setErrorMessage(
          error instanceof Error ? error.message : 'Your profile could not be loaded.',
        );
        setStatus('error');
      });
  }, [client]);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      if (skipFirstLoad.current) {
        skipFirstLoad.current = false;
        return;
      }
      load();
    } else if (authStatus === 'anonymous') {
      latestLoad.current += 1;
      skipFirstLoad.current = false;
      setProfile(null);
      setErrorMessage(null);
      setErrorCode(null);
      setStatus('none');
    }
  }, [authStatus, load]);

  const createProfile = useCallback(
    async (request: CreateProfileRequest) => {
      let created: Profile;
      try {
        created = await client.createProfile(request);
      } catch (error) {
        if (error instanceof ApiProblemError && error.code === 'email-not-verified') {
          setErrorCode(error.code);
          setErrorMessage(error.message);
          setStatus('error');
        }
        throw error;
      }
      latestLoad.current += 1;
      setProfile(created);
      setStatus('ready');
      return created;
    },
    [client],
  );

  const recordConsent = useCallback(
    async (granted: boolean) => {
      const updated = await client.recordConsent(granted);
      setProfile(updated);
      return updated;
    },
    [client],
  );

  const value = useMemo<ProfileState>(
    () => ({
      status,
      profile,
      errorMessage,
      errorCode,
      reload: load,
      createProfile,
      recordConsent,
    }),
    [status, profile, errorMessage, errorCode, load, createProfile, recordConsent],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}
