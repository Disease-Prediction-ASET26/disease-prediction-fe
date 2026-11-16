import type { AuthClient } from '../auth/AuthClient';

export const TEST_TOKEN = 'test-session-token';

/** In-memory `AuthClient` for tests: no Hanko, events fired by hand. */
export class FakeAuthClient implements AuthClient {
  token: string | null;
  logoutCalls = 0;
  elementsFail = false;
  logoutFails = false;
  logoutEndsLocallyBeforeFailure = false;
  private readonly created = new Set<() => void>();
  private readonly ended = new Set<() => void>();

  constructor(signedIn = true) {
    this.token = signedIn ? TEST_TOKEN : null;
  }

  getSessionToken(): string | null {
    return this.token;
  }

  hasSession(): Promise<boolean> {
    return Promise.resolve(this.token !== null);
  }

  logout(): Promise<void> {
    this.logoutCalls += 1;
    if (this.logoutFails) {
      if (this.logoutEndsLocallyBeforeFailure) this.endSession();
      return Promise.reject(new Error('Hanko unavailable'));
    }
    this.endSession();
    return Promise.resolve();
  }

  onSessionCreated(callback: () => void): () => void {
    this.created.add(callback);
    return () => this.created.delete(callback);
  }

  onSessionEnded(callback: () => void): () => void {
    this.ended.add(callback);
    return () => this.ended.delete(callback);
  }

  ensureElements(): Promise<void> {
    return this.elementsFail ? Promise.reject(new Error('Hanko unavailable')) : Promise.resolve();
  }

  /** What Hanko Elements does after a successful login or registration. */
  completeLogin(token: string = TEST_TOKEN): void {
    this.token = token;
    this.created.forEach((callback) => callback());
  }

  /** Session expiry, logout in another tab, or account deletion. */
  endSession(): void {
    this.token = null;
    this.ended.forEach((callback) => callback());
  }
}
