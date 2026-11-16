/** TypeScript mirror of the backend contract `openapi/profile-api.yaml` (MDD Iteration 6). */

export const ROLES = ['PATIENT', 'DOCTOR', 'ADMIN'] as const;
export type Role = (typeof ROLES)[number];

export interface Profile {
  id: string;
  /** From the Hanko session token, not typed by the user. */
  email: string;
  fullName: string;
  role: Role;
  /** ISO date (`YYYY-MM-DD`); patients only, optional. */
  dateOfBirth?: string | null;
  consentGranted: boolean;
}

/** First-login onboarding. The backend refuses it without consent. */
export interface CreateProfileRequest {
  fullName: string;
  dateOfBirth?: string | null;
  consentGranted: boolean;
}

export function isProfile(value: unknown): value is Profile {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.email === 'string' &&
    typeof candidate.fullName === 'string' &&
    typeof candidate.role === 'string' &&
    (ROLES as readonly string[]).includes(candidate.role) &&
    typeof candidate.consentGranted === 'boolean' &&
    (candidate.dateOfBirth === undefined ||
      candidate.dateOfBirth === null ||
      typeof candidate.dateOfBirth === 'string')
  );
}
