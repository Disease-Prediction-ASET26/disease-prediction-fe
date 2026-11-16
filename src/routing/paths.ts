import type { AssessmentResponse } from '../domain/assessment';
import { isAssessmentResponse } from '../domain/assessment';

/** The route model (MDD Iteration 4). Every navigable view has one path here. */
export const PATHS = {
  home: '/',
  assessment: '/assessment',
  result: '/assessment/result',
  emergency: '/assessment/emergency',
  // MDD Iteration 6
  login: '/login',
  onboarding: '/onboarding',
  account: '/account',
} as const;

/** `location.state` set by the guards, so login and onboarding can return to the original page. */
export interface RedirectLocationState {
  from: string;
}

/** The page to return to after login or onboarding; never an auth page, never another origin. */
export function readRedirectTarget(state: unknown, fallback: string = PATHS.assessment): string {
  if (typeof state !== 'object' || state === null) return fallback;
  const from = (state as Partial<RedirectLocationState>).from;
  if (typeof from !== 'string' || !from.startsWith('/') || from.startsWith('//')) return fallback;
  if (from === PATHS.login || from === PATHS.onboarding) return fallback;
  return from;
}

/**
 * Router `location.state` carried from the form to the result/emergency routes. The response
 * travels with the history entry — never in a module-global — so a deep link without state is
 * detectable and redirected back to the form.
 */
export interface AssessmentLocationState {
  assessment: AssessmentResponse;
}

export function readAssessmentState(state: unknown): AssessmentResponse | null {
  if (typeof state !== 'object' || state === null) return null;
  const assessment = (state as Partial<AssessmentLocationState>).assessment;
  return isAssessmentResponse(assessment) ? assessment : null;
}
