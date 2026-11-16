import type { CreateProfileRequest, Profile } from '../domain/profile';

/**
 * Port for the signed-in user's profile and consent (`/api/me`). Implementations reject with
 * `ApiProblemError` (4xx with a problem code) or `NetworkError` (network, 5xx, bad response).
 */
export interface ProfileApiClient {
  /** The profile, or `null` on the first login (404 `profile-not-found`). */
  getProfile(): Promise<Profile | null>;
  createProfile(request: CreateProfileRequest): Promise<Profile>;
  /** Grants (`true`) or withdraws (`false`) consent; returns the updated profile. */
  recordConsent(granted: boolean): Promise<Profile>;
}
