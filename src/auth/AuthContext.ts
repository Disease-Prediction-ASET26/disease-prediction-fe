import { createContext, useContext } from 'react';
import type { AuthClient } from './AuthClient';

export type AuthStatus = 'loading' | 'anonymous' | 'authenticated';

export interface AuthState {
  status: AuthStatus;
  client: AuthClient;
  /** Ends the session in Hanko and locally. */
  logout: () => Promise<void>;
  /** Called by the API layer when the backend rejects the token (401). */
  handleUnauthorized: () => void;
}

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth must be used inside <AuthProvider>');
  return auth;
}
