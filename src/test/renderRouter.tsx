import { render } from '@testing-library/react';
import type { InitialEntry } from 'react-router-dom';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { appRoutes } from '../routing/appRouter';

/** Renders the real route table in a memory router, so tests can inspect and drive navigation. */
export function renderAppAt(...initialEntries: InitialEntry[]) {
  const router = createMemoryRouter(appRoutes, { initialEntries });
  const view = render(<RouterProvider router={router} />);
  return { router, ...view };
}
