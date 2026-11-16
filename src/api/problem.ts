import { ApiProblemError } from './errors';

/**
 * Patient-facing messages for the backend's problem codes (`application/problem+json`, field
 * `code`). Unknown codes fall back to a generic message; the backend's own text is not shown.
 */
const MESSAGES: Record<string, string> = {
  'profile-required': 'Complete your profile before starting an assessment.',
  'consent-required':
    'Consent to processing your health data is required. You can give it on your account page.',
  forbidden: 'This feature is only available to patient accounts.',
  'profile-exists': 'Your profile already exists.',
  'email-not-verified': 'Your account has no verified email address. Sign in again with email.',
  'account-quarantined': 'Your account needs review. Please contact support.',
  'invalid-profile': 'Please check the details you entered.',
  'identity-unavailable': 'Sign-in could not be confirmed right now. Please try again shortly.',
  unauthorized: 'Your session has ended. Please sign in again.',
};

const FALLBACK = 'Something went wrong. Please try again.';

/** Reads the `code` of a problem response, or `null` if the body is not a problem. */
export async function readProblemCode(response: Response): Promise<string | null> {
  try {
    const body: unknown = await response.json();
    if (typeof body === 'object' && body !== null && 'code' in body) {
      const code = (body as { code: unknown }).code;
      return typeof code === 'string' ? code : null;
    }
  } catch {
    // Not JSON.
  }
  return null;
}

export async function toProblemError(response: Response): Promise<ApiProblemError> {
  const code = (await readProblemCode(response)) ?? 'unknown';
  return new ApiProblemError(code, response.status, MESSAGES[code] ?? FALLBACK);
}
