import { createContext, useContext } from 'react';
import type { AuthClient } from './AuthClient';

export type AuthStatus = 'loading' | 'anonymous' | 'authenticated';

export interface AuthState {
  status: AuthStatus;
  client: AuthClient;
  /** Returns true only when Hanko confirms the session has ended. */
  logout: () => Promise<boolean>;
  logoutError: boolean;
  logoutPending: boolean;
  /** Called by the API layer when the backend rejects the token (401). */
  handleUnauthorized: () => void;
}

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth must be used inside <AuthProvider>');
  return auth;
}
