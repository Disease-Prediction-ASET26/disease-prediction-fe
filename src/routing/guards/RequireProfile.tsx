import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useProfile } from '../../application/ProfileContext';
import type { RedirectLocationState } from '../paths';
import { PATHS } from '../paths';
import { LoadingView } from './LoadingView';
import { ProfileLoadError } from './ProfileLoadError';

/** Pathless layout route inside `RequireAuth`: children need a finished profile (onboarding). */
export function RequireProfile() {
  const { status } = useProfile();
  const location = useLocation();

  if (status === 'none' || status === 'loading')
    return <LoadingView label="Loading your profile…" />;
  if (status === 'error') return <ProfileLoadError />;
  if (status === 'needs-onboarding') {
    const state: RedirectLocationState = { from: `${location.pathname}${location.search}` };
    return <Navigate to={PATHS.onboarding} replace state={state} />;
  }
  return <Outlet />;
}
