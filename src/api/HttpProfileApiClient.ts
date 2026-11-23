import type { CreateProfileRequest, Profile } from '../domain/profile';
import { isProfile } from '../domain/profile';
import { NetworkError } from './errors';
import { resolveApiBaseUrl } from './HttpAssessmentApiClient';
import { readProblemCode, toProblemError } from './problem';
import type { ProfileApiClient } from './ProfileApiClient';

export const PROFILE_PATH = '/api/me';
export const CONSENTS_PATH = '/api/me/consents';

/** Adapter: `ProfileApiClient` over `fetch` (normally the authorized fetch). */
export class HttpProfileApiClient implements ProfileApiClient {
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;

  constructor(fetchFn: typeof fetch, baseUrl: string = resolveApiBaseUrl()) {
    this.fetchFn = fetchFn;
    this.baseUrl = baseUrl;
  }

  async getProfile(): Promise<Profile | null> {
    const response = await this.send(PROFILE_PATH, { method: 'GET' });
    if (response.status === 404) {
      const code = await readProblemCode(response.clone());
      if (code === 'profile-not-found') return null;
    }
    return this.readProfile(response);
  }

  async createProfile(request: CreateProfileRequest): Promise<Profile> {
    const response = await this.send(PROFILE_PATH, {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return this.readProfile(response);
  }

  async recordConsent(granted: boolean): Promise<Profile> {
    const response = await this.send(CONSENTS_PATH, {
      method: 'POST',
      body: JSON.stringify({ granted }),
    });
    return this.readProfile(response);
  }

  private async send(path: string, init: RequestInit): Promise<Response> {
    try {
      return await this.fetchFn(`${this.baseUrl}${path}`, {
        ...init,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      });
    } catch {
      throw new NetworkError('We could not reach the server. Please try again.');
    }
  }

  private async readProfile(response: Response): Promise<Profile> {
    if (response.status >= 400 && response.status < 500) {
      throw await toProblemError(response);
    }
    if (!response.ok) {
      throw new NetworkError(
        'The server is unavailable right now. Please try again.',
        response.status,
      );
    }
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new NetworkError('The server sent an unreadable response.', response.status);
    }
    if (!isProfile(body)) {
      throw new NetworkError('The server sent an unexpected response.', response.status);
    }
    return body;
  }
}
