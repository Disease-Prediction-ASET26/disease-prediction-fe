import { useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
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
            <li>
              <NavLink to={PATHS.assessment} end>
                New assessment
              </NavLink>
            </li>
          </ul>
        </nav>
      </header>
      <Outlet />
    </div>
  );
}
