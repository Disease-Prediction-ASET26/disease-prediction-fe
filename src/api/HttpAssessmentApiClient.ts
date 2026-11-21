import type { AssessmentRequest, AssessmentResponse, FollowUpRequest } from '../domain/assessment';
import { isAssessmentResponse } from '../domain/assessment';
import type { AssessmentDetail, AssessmentSummary } from '../domain/history';
import { isAssessmentDetail, isAssessmentSummary } from '../domain/history';
import type { AssessmentApiClient } from './AssessmentApiClient';
import {
  AssessmentNotFoundError,
  NetworkError,
  UnrecognizedSymptomsError,
  ValidationError,
} from './errors';
import { toProblemError } from './problem';

export const ASSESSMENTS_PATH = '/api/assessments';
export const FOLLOWUP_PATH = '/api/assessments/followup';

/** Base URL from `VITE_API_BASE_URL`; empty means same-origin (dev proxy or reverse proxy). */
export function resolveApiBaseUrl(
  raw: string | undefined = import.meta.env.VITE_API_BASE_URL,
): string {
  return (raw ?? '').trim().replace(/\/+$/, '');
}

/**
 * Adapter: `AssessmentApiClient` over `fetch` to the Java backend's assessment endpoints. In the
 * app `fetchFn` is the authorized fetch, which adds the session token.
 */
export class HttpAssessmentApiClient implements AssessmentApiClient {
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;

  constructor(
    baseUrl: string = resolveApiBaseUrl(),
    fetchFn: typeof fetch = (...args) => fetch(...args),
  ) {
    this.baseUrl = baseUrl;
    this.fetchFn = fetchFn;
  }

  submitAssessment(request: AssessmentRequest): Promise<AssessmentResponse> {
    return this.post(ASSESSMENTS_PATH, request);
  }

  submitFollowUp(request: FollowUpRequest): Promise<AssessmentResponse> {
    return this.post(FOLLOWUP_PATH, request);
  }

  async listAssessments(): Promise<AssessmentSummary[]> {
    const parsed = await this.get(ASSESSMENTS_PATH);
    if (!Array.isArray(parsed) || !parsed.every(isAssessmentSummary)) {
      throw new NetworkError('The assessment service sent an unexpected response.');
    }
    return parsed;
  }

  async getAssessment(assessmentId: string): Promise<AssessmentDetail> {
    const parsed = await this.get(`${ASSESSMENTS_PATH}/${encodeURIComponent(assessmentId)}`);
    if (!isAssessmentDetail(parsed)) {
      throw new NetworkError('The assessment service sent an unexpected response.');
    }
    return parsed;
  }

  /** GET a JSON resource from an assessment endpoint and map errors like {@link post}. */
  private async get(path: string): Promise<unknown> {
    let response: Response;
    try {
      response = await this.fetchFn(`${this.baseUrl}${path}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
    } catch {
      throw new NetworkError();
    }

    if (response.status === 404) {
      throw new AssessmentNotFoundError();
    }
    if (response.status === 401 || response.status === 403) {
      throw await toProblemError(response);
    }
    if (!response.ok) {
      throw new NetworkError(
        'The assessment service is unavailable right now. Please try again.',
        response.status,
      );
    }
    try {
      return await response.json();
    } catch {
      throw new NetworkError(
        'The assessment service sent an unreadable response.',
        response.status,
      );
    }
  }

  /** POST a JSON body to an assessment endpoint and map the response (or error) uniformly. */
  private async post(path: string, body: unknown): Promise<AssessmentResponse> {
    let response: Response;
    try {
      response = await this.fetchFn(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      });
    } catch {
      throw new NetworkError();
    }

    if (response.status === 400) {
      throw new ValidationError();
    }
    if (response.status === 422) {
      throw new UnrecognizedSymptomsError();
    }
    // MDD Iteration 6: 401 (session ended) and 403 (no profile, no consent, not a patient).
    if (response.status === 401 || response.status === 403) {
      throw await toProblemError(response);
    }
    if (!response.ok) {
      throw new NetworkError(
        'The assessment service is unavailable right now. Please try again.',
        response.status,
      );
    }

    let parsed: unknown;
    try {
      parsed = await response.json();
    } catch {
      throw new NetworkError(
        'The assessment service sent an unreadable response.',
        response.status,
      );
    }
    if (!isAssessmentResponse(parsed)) {
      throw new NetworkError(
        'The assessment service sent an unexpected response.',
        response.status,
      );
    }
    return parsed;
  }
}
