import type { AssessmentResponse } from '../domain/assessment';
import { isAssessmentResponse } from '../domain/assessment';

/** The route model (MDD Iteration 4). Every navigable view has one path here. */
export const PATHS = {
  home: '/',
  assessment: '/assessment',
  result: '/assessment/result',
  emergency: '/assessment/emergency',
} as const;

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
