import { useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { PATHS } from './paths';

/** Moves focus to the new view's heading after client-side navigation (not on first load). */
function useFocusHeadingOnNavigate() {
  const { pathname } = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const heading = document.querySelector<HTMLElement>('main h1');
    if (!heading) return;
    if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
    heading.focus();
  }, [pathname]);
}

/** Shared shell for every route: header with the main navigation, then the active route. */
export function RootLayout() {
  useFocusHeadingOnNavigate();
  const { status, logout, logoutError, logoutPending } = useAuth();
  const navigate = useNavigate();
  const signOut = async () => {
    if (await logout()) await navigate(PATHS.home);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-name">Disease Prediction</span>
        <nav aria-label="Main">
          <ul>
            <li>
              <NavLink to={PATHS.home} end>
                Home
              </NavLink>
            </li>
            {status === 'authenticated' ? (
              <>
                <li>
                  <NavLink to={PATHS.assessment} end>
                    New assessment
                  </NavLink>
                </li>
                <li>
                  <NavLink to={PATHS.account} end>
                    Account
                  </NavLink>
                </li>
                <li>
                  <button
                    type="button"
                    className="link-button"
                    disabled={logoutPending}
                    onClick={() => void signOut()}
                  >
                    Sign out
                  </button>
                </li>
              </>
            ) : (
              <li>
                <NavLink to={PATHS.login} end>
                  Sign in
                </NavLink>
              </li>
            )}
          </ul>
        </nav>
      </header>
      {logoutError && (
        <div className="message message-error" role="alert">
          <p>We could not confirm sign-out. Your session may still be active.</p>
          <button type="button" disabled={logoutPending} onClick={() => void signOut()}>
            Try signing out again
          </button>
        </div>
      )}
      <Outlet />
    </div>
  );
}
