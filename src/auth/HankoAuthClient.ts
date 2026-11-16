import type { Hanko } from '@teamhanko/hanko-elements';
import type { AuthClient } from './AuthClient';
import { resolveHankoApiUrl } from './hankoConfig';

/**
 * Adapter: `AuthClient` over Hanko Elements. `register()` defines the `<hanko-*>` custom elements
 * and returns the Hanko SDK instance they use, so the app and the elements share one session.
 *
 * The SDK keeps the session token (returned by Hanko in `X-Auth-Token`) in a cookie on the app's
 * own origin. The backend reads only the `Authorization` header, never that cookie. The package
 * is loaded on demand, which keeps it out of the main bundle.
 */
export class HankoAuthClient implements AuthClient {
  private readonly ready: Promise<Hanko>;
  private readonly apiUrl: string;
  private hanko: Hanko | null = null;
  private pendingLogoutToken: string | null = null;

  constructor(apiUrl: string = resolveHankoApiUrl()) {
    this.apiUrl = apiUrl.replace(/\/$/, '');
    this.ready = import('@teamhanko/hanko-elements')
      .then(({ register }) =>
        register(apiUrl, {
          enablePasskeys: true,
          hidePasskeyButtonOnLogin: true,
          cookieSameSite: 'strict',
        }),
      )
      .then(({ hanko }) => {
        this.hanko = hanko;
        return hanko;
      });
    // Failures surface through the methods below; avoid an unhandled rejection here.
    this.ready.catch(() => undefined);
  }

  getSessionToken(): string | null {
    const token = this.hanko?.getSessionToken();
    return token ? token : null;
  }

  async hasSession(): Promise<boolean> {
    const hanko = await this.ready;
    if (!hanko.getSessionToken()) return false;
    const check = await hanko.validateSession();
    return check.is_valid;
  }

  async logout(): Promise<void> {
    const hanko = await this.ready;
    const token = hanko.getSessionToken();
    // Hanko SDK 3.1 removes its local token even if /logout returns an error response.
    // Retry with the saved token so a later 401 cannot be caused by sending no token.
    if (this.pendingLogoutToken && token !== this.pendingLogoutToken) {
      const response = await fetch(`${this.apiUrl}/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { Authorization: `Bearer ${this.pendingLogoutToken}` },
      });
      if (!response.ok && response.status !== 401) throw new Error('Sign-out failed');
      this.pendingLogoutToken = null;
      if (!token) return;
    }
    try {
      await hanko.logout();
      this.pendingLogoutToken = null;
    } catch (error) {
      this.pendingLogoutToken = token || null;
      throw error;
    }
  }

  onSessionCreated(callback: () => void): () => void {
    return this.subscribe((hanko) => hanko.onSessionCreated(() => callback()));
  }

  onSessionEnded(callback: () => void): () => void {
    return this.subscribe((hanko) => {
      const cleanups = [
        hanko.onSessionExpired(() => callback()),
        hanko.onUserLoggedOut(() => callback()),
        hanko.onUserDeleted(() => callback()),
      ];
      return () => cleanups.forEach((cleanup) => cleanup());
    });
  }

  async ensureElements(): Promise<void> {
    await this.ready;
  }

  private subscribe(attach: (hanko: Hanko) => () => void): () => void {
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    this.ready
      .then((hanko) => {
        if (!cancelled) cleanup = attach(hanko);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }
}
