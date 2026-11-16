import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AuthClient } from './AuthClient';
import type { AuthState, AuthStatus } from './AuthContext';
import { AuthContext } from './AuthContext';

export interface AuthProviderProps {
  client: AuthClient;
  /** Tests start in a known state; the app starts in `loading` and asks Hanko. */
  initialStatus?: AuthStatus;
  children: ReactNode;
}

/**
 * Session state for the whole app (MDD Iteration 6). Asks the identity provider once on start,
 * then follows its events: login, expiry, logout and account deletion.
 */
export function AuthProvider({ client, initialStatus = 'loading', children }: AuthProviderProps) {
  const [status, setStatus] = useState<AuthStatus>(initialStatus);
  const [logoutError, setLogoutError] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);

  useEffect(() => {
    let active = true;
    client
      .hasSession()
      .then((valid) => {
        if (active) setStatus(valid ? 'authenticated' : 'anonymous');
      })
      .catch(() => {
        if (active) setStatus('anonymous');
      });
    const stopCreated = client.onSessionCreated(() => setStatus('authenticated'));
    const stopEnded = client.onSessionEnded(() => setStatus('anonymous'));
    return () => {
      active = false;
      stopCreated();
      stopEnded();
    };
  }, [client]);

  const logout = useCallback(async () => {
    setLogoutError(false);
    setLogoutPending(true);
    try {
      await client.logout();
      setStatus('anonymous');
      return true;
    } catch {
      // The SDK may have cleared its local token, but revocation was not confirmed.
      setLogoutError(true);
      return false;
    } finally {
      setLogoutPending(false);
    }
  }, [client]);

  const handleUnauthorized = useCallback(() => {
    setStatus('anonymous');
    void client.logout().catch(() => undefined);
  }, [client]);

  const value = useMemo<AuthState>(
    () => ({ status, client, logout, logoutError, logoutPending, handleUnauthorized }),
    [status, client, logout, logoutError, logoutPending, handleUnauthorized],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
