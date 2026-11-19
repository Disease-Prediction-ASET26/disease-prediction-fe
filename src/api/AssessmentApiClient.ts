import type { AssessmentRequest, AssessmentResponse, FollowUpRequest } from '../domain/assessment';

/**
 * Port for submitting assessments — the frontend counterpart of the backend's `PredictionClient`
 * port. Views depend on this interface only, so the HTTP client and a test double are
 * interchangeable without view changes.
 *
 * Implementations reject with `ValidationError` (400), `UnrecognizedSymptomsError` (422),
 * `ApiProblemError` (401/403) or `NetworkError` (anything else).
 */
export interface AssessmentApiClient {
  submitAssessment(request: AssessmentRequest): Promise<AssessmentResponse>;

  /**
   * Continue an adaptive assessment: answer a follow-up question and receive an updated result
   * (which may carry another question). Same error contract as {@link submitAssessment}.
   */
  submitFollowUp(request: FollowUpRequest): Promise<AssessmentResponse>;
}
