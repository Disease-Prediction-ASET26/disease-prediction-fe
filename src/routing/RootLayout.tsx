import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useProfile } from '../application/ProfileContext';
import { useAuth } from '../auth/AuthContext';
import { Icon } from '../components/ui/Icon';
import { initialsOf, NAVIGATION, PUBLIC_NAVIGATION, ROLE_LABELS } from './navigation';
import { PATHS } from './paths';
import { useAppearance } from '../ThemeContext';

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
    <svg className="logo-mark" viewBox="0 0 52 60" aria-hidden="true" focusable="false">
      <path d="M6 10h40v31c0 8-7 13-20 13S6 49 6 41V10Z" fill="currentColor" />
      <path
        d="M9 16h34"
        fill="none"
        stroke="var(--logo-pocket-bg, var(--surface-muted))"
        strokeWidth="2"
      />
      <path
        d="M23 23h6v6h6v6h-6v6h-6v-6h-6v-6h6Z"
        fill="var(--logo-pocket-bg, var(--surface-muted))"
      />
    </svg>
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
  const { appearance, toggle } = useAppearance();
  const sidebarRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);

  // Close the mobile navigation whenever the route changes.
  useEffect(() => setNavOpen(false), [pathname]);

  useEffect(() => {
    if (!navOpen) return;
    const sidebar = sidebarRef.current;
    const menu = menuRef.current;
    const desktop =
      typeof window.matchMedia === 'function' ? window.matchMedia('(min-width: 901px)') : null;
    const onResize = () => {
      if (desktop?.matches) setNavOpen(false);
    };
    desktop?.addEventListener('change', onResize);
    const controls = () =>
      Array.from(sidebar?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)') ?? []);
    const focusFirstControl = () => {
      if (!sidebar?.contains(document.activeElement)) controls()[0]?.focus();
    };
    focusFirstControl();
    // Wait for the offscreen sidebar to become visible before focusing in a browser.
    // Keep the deferred focus from stealing focus if the user has already moved within the drawer.
    const focusFrame = window.requestAnimationFrame(focusFirstControl);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setNavOpen(false);
      } else if (event.key === 'Tab') {
        const items = controls();
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.cancelAnimationFrame(focusFrame);
      desktop?.removeEventListener('change', onResize);
      if (sidebar?.contains(document.activeElement)) menu?.focus();
    };
  }, [navOpen]);

  const signedIn = status === 'authenticated';
  const items = signedIn && profile ? NAVIGATION[profile.role] : PUBLIC_NAVIGATION;
  const signOut = async () => {
    if (await logout()) await navigate(PATHS.home);
  };

  return (
    <div
      className={
        signedIn && profile?.role === 'PATIENT'
          ? 'app-shell patient-shell'
          : signedIn
            ? 'app-shell'
            : 'app-shell public-shell'
      }
    >
      {signedIn && (
        <aside ref={sidebarRef} className={navOpen ? 'sidebar open' : 'sidebar'} id="app-sidebar">
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
                  <NavLink to={item.to} end={item.to === PATHS.home}>
                    <Icon name={item.icon} />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          {signedIn && (
            <div className="sidebar-bottom">
              <button type="button" disabled={logoutPending} onClick={() => void signOut()}>
                <Icon name="logout" />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </aside>
      )}
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
          {signedIn && (
            <button
              ref={menuRef}
              type="button"
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              aria-controls="app-sidebar"
              aria-expanded={navOpen}
              onClick={() => setNavOpen(true)}
            >
              <Icon name="menu" />
            </button>
          )}
          <div className={signedIn ? 'mobile-brand' : 'public-brand'}>
            <Logo />
            <strong>Pocket Doc</strong>
          </div>
          {!signedIn && (
            <nav className="public-nav" aria-label="Main">
              {PUBLIC_NAVIGATION.map((item) => (
                <NavLink key={item.to} to={item.to} end>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          )}
          <button
            type="button"
            className="icon-button theme-toggle"
            onClick={toggle}
            aria-label={appearance === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
          >
            <Icon name={appearance === 'light' ? 'moon' : 'sun'} />
          </button>
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
        <div
          className={
            !signedIn && pathname === PATHS.home ? 'workspace landing-workspace' : 'workspace'
          }
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
}
