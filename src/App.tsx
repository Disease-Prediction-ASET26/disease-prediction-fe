import { RouterProvider } from 'react-router-dom';
import { AppProviders } from './AppProviders';
import type { AuthClient } from './auth/AuthClient';
import { HankoAuthClient } from './auth/HankoAuthClient';
import { createAppRouter } from './routing/appRouter';

const appRouter = createAppRouter();
let defaultAuthClient: AuthClient | null = null;

function getDefaultAuthClient(): AuthClient {
  defaultAuthClient ??= new HankoAuthClient();
  return defaultAuthClient;
}

export interface AppProps {
  /** Tests pass a fake; the app uses Hanko. */
  authClient?: AuthClient;
}

/** Iteration 4: the router decides which view is shown. Iteration 6: inside the session. */
export function App({ authClient }: AppProps) {
  return (
    <AppProviders authClient={authClient ?? getDefaultAuthClient()}>
      <RouterProvider router={appRouter} />
    </AppProviders>
  );
}
