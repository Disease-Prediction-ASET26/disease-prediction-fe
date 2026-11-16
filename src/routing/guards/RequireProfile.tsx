import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useProfile } from '../../application/ProfileContext';
import type { RedirectLocationState } from '../paths';
import { PATHS } from '../paths';
import { LoadingView } from './LoadingView';

/** Pathless layout route inside `RequireAuth`: children need a finished profile (onboarding). */
export function RequireProfile() {
  const { status, errorMessage, reload } = useProfile();
  const location = useLocation();

  if (status === 'none' || status === 'loading')
    return <LoadingView label="Loading your profile…" />;
  if (status === 'error') {
    return (
      <main>
        <h1>Your profile could not be loaded</h1>
        <div className="message message-error" role="alert">
          <p>{errorMessage}</p>
          <button type="button" onClick={reload}>
            Try again
          </button>
        </div>
      </main>
    );
  }
  if (status === 'needs-onboarding') {
    const state: RedirectLocationState = { from: `${location.pathname}${location.search}` };
    return <Navigate to={PATHS.onboarding} replace state={state} />;
  }
  return <Outlet />;
}
