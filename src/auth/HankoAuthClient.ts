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
  private hanko: Hanko | null = null;

  constructor(apiUrl: string = resolveHankoApiUrl()) {
    this.ready = import('@teamhanko/hanko-elements')
      .then(({ register }) => register(apiUrl, { enablePasskeys: true, cookieSameSite: 'strict' }))
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
    await hanko.logout();
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
