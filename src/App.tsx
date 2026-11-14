import { RouterProvider } from 'react-router-dom';
import { createAppRouter } from './routing/appRouter';

const appRouter = createAppRouter();

/** Iteration 4: the router decides which view is shown. */
export function App() {
  return <RouterProvider router={appRouter} />;
}
