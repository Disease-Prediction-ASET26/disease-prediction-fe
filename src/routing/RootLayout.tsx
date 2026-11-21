import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useProfile } from '../application/ProfileContext';
import { useAuth } from '../auth/AuthContext';
import { Icon } from '../components/ui/Icon';
import { initialsOf, NAVIGATION, PUBLIC_NAVIGATION, ROLE_LABELS } from './navigation';
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

function Logo() {
  return (
    <span className="logo-mark" aria-hidden="true">
      <i />
      <i />
    </span>
  );
}

/**
 * Pocket Doc app shell for every route: a sidebar with the workspace navigation of the signed-in
 * user's role, a header with who is signed in, then the active route. Before sign-in the sidebar
 * shows only the public pages.
 */
export function RootLayout() {
  useFocusHeadingOnNavigate();
  const { status, logout, logoutError, logoutPending } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [navOpen, setNavOpen] = useState(false);

  // Close the mobile navigation whenever the route changes.
  useEffect(() => setNavOpen(false), [pathname]);

  const signedIn = status === 'authenticated';
  const items = signedIn && profile ? NAVIGATION[profile.role] : PUBLIC_NAVIGATION;
  const signOut = async () => {
    if (await logout()) await navigate(PATHS.home);
  };

  return (
    <div className="app-shell">
      <aside className={navOpen ? 'sidebar open' : 'sidebar'} id="app-sidebar">
        <div className="logo">
          <Logo />
          <strong>Pocket Doc</strong>
          <button
            type="button"
            className="icon-button mobile-close"
            aria-label="Close navigation"
            onClick={() => setNavOpen(false)}
          >
            <Icon name="close" />
          </button>
        </div>
        <nav aria-label="Main">
          <ul>
            {items.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end>
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="sidebar-bottom">
          <p className="secure">
            <Icon name="shield" size={16} />
            <span>Health data protected</span>
          </p>
          {signedIn && (
            <button type="button" disabled={logoutPending} onClick={() => void signOut()}>
              <Icon name="logout" />
              <span>Sign out</span>
            </button>
          )}
        </div>
      </aside>
      {navOpen && (
        <button
          type="button"
          className="scrim"
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
        />
      )}

      <div className="app-main">
        <header className="app-header">
          <button
            type="button"
            className="icon-button mobile-menu"
            aria-label="Open navigation"
            aria-controls="app-sidebar"
            aria-expanded={navOpen}
            onClick={() => setNavOpen(true)}
          >
            <Icon name="menu" />
          </button>
          <div className="mobile-brand">
            <Logo />
            <strong>Pocket Doc</strong>
          </div>
          {signedIn && profile && (
            <div className="header-right">
              <p className="role-label">
                <Icon
                  name={
                    profile.role === 'PATIENT'
                      ? 'user'
                      : profile.role === 'DOCTOR'
                        ? 'doctor'
                        : 'shield'
                  }
                  size={15}
                />
                {ROLE_LABELS[profile.role]} workspace
              </p>
              <div className="user-menu">
                <span aria-hidden="true">{initialsOf(profile.fullName, profile.email)}</span>
                <div>
                  <strong>{profile.fullName}</strong>
                  <small>{ROLE_LABELS[profile.role]}</small>
                </div>
              </div>
            </div>
          )}
        </header>
        {logoutError && (
          <div className="message message-error workspace-message" role="alert">
            <p>We could not confirm sign-out. Your session may still be active.</p>
            <button
              type="button"
              className="button secondary"
              disabled={logoutPending}
              onClick={() => void signOut()}
            >
              Try signing out again
            </button>
          </div>
        )}
        <div className="workspace">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
