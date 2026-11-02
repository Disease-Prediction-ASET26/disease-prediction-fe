import type { AssessmentRequest, AssessmentResponse } from '../domain/assessment';
import { isAssessmentResponse } from '../domain/assessment';
import type { AssessmentApiClient } from './AssessmentApiClient';
import { NetworkError, ValidationError } from './errors';

export const ASSESSMENTS_PATH = '/api/assessments';

/** Base URL from `VITE_API_BASE_URL`; empty means same-origin (dev proxy or reverse proxy). */
export function resolveApiBaseUrl(
  raw: string | undefined = import.meta.env.VITE_API_BASE_URL,
): string {
  return (raw ?? '').trim().replace(/\/+$/, '');
}

/** Adapter: `AssessmentApiClient` over `fetch` to the Java backend's `POST /api/assessments`. */
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

  async submitAssessment(request: AssessmentRequest): Promise<AssessmentResponse> {
    let response: Response;
    try {
      response = await this.fetchFn(`${this.baseUrl}${ASSESSMENTS_PATH}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(request),
      });
    } catch {
      throw new NetworkError();
    }

    if (response.status === 400) {
      throw new ValidationError();
    }
    if (!response.ok) {
      throw new NetworkError(
        'The assessment service is unavailable right now. Please try again.',
        response.status,
      );
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new NetworkError(
        'The assessment service sent an unreadable response.',
        response.status,
      );
    }
    if (!isAssessmentResponse(body)) {
      throw new NetworkError(
        'The assessment service sent an unexpected response.',
        response.status,
      );
    }
    return body;
  }
}
