import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import type { RedirectLocationState } from '../paths';
import { PATHS } from '../paths';
import { LoadingView } from './LoadingView';

/**
 * Pathless layout route: children need a session. Without one, go to `/login` and remember the
 * page. This only shapes the UI; the backend enforces access on every request.
 */
export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <LoadingView />;
  if (status === 'anonymous') {
    const state: RedirectLocationState = {
      from: `${location.pathname}${location.search}${location.hash}`,
    };
    return <Navigate to={PATHS.login} replace state={state} />;
  }
  return <Outlet />;
}
