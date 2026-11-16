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
    try {
      await client.logout();
    } catch {
      // The local session ends even if Hanko cannot be reached.
    }
    setStatus('anonymous');
  }, [client]);

  const handleUnauthorized = useCallback(() => {
    void logout();
  }, [logout]);

  const value = useMemo<AuthState>(
    () => ({ status, client, logout, handleUnauthorized }),
    [status, client, logout, handleUnauthorized],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
