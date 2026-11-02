import type { AssessmentRequest, AssessmentResponse } from '../domain/assessment';

/**
 * Port for submitting assessments — the frontend counterpart of the backend's `PredictionClient`
 * port. Views depend on this interface only, so the HTTP client and a test double are
 * interchangeable without view changes.
 *
 * Implementations reject with `ValidationError` (400) or `NetworkError` (anything else).
 */
export interface AssessmentApiClient {
  submitAssessment(request: AssessmentRequest): Promise<AssessmentResponse>;
}
