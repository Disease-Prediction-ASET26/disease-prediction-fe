/**
 * Port for the identity provider (MDD Iteration 6). Views and API clients depend on this
 * interface only; `HankoAuthClient` is the real adapter and tests use a fake.
 */
export interface AuthClient {
  /** The current session token (JWT) to send as `Authorization: Bearer`, or `null`. */
  getSessionToken(): string | null;
  /** Whether there is an active session (checked with the identity provider). */
  hasSession(): Promise<boolean>;
  logout(): Promise<void>;
  /** Called after a login or registration completes. Returns an unsubscribe function. */
  onSessionCreated(callback: () => void): () => void;
  /** Called when the session expires, the user logs out, or the account is deleted. */
  onSessionEnded(callback: () => void): () => void;
  /** Resolves once the `<hanko-auth>` and `<hanko-profile>` elements are registered. */
  ensureElements(): Promise<void>;
}
