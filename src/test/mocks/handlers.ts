import { http, HttpResponse } from 'msw';
import type { AssessmentRequest } from '../../domain/assessment';
import { emergencyResponse, predictionResponse } from './fixtures';

export const ASSESSMENTS_URL = '*/api/assessments';

/** Records the bodies the app sent, so tests can assert on the wire contract. */
export const receivedRequests: AssessmentRequest[] = [];

/** Default: behaves like the backend — 400 on no symptom signal, emergency on "chest pain". */
export const handlers = [
  http.post(ASSESSMENTS_URL, async ({ request }) => {
    const body = (await request.json()) as AssessmentRequest;
    receivedRequests.push(body);

    const hasText = typeof body.freeText === 'string' && body.freeText.trim().length > 0;
    const hasEntries = Array.isArray(body.symptomEntries) && body.symptomEntries.length > 0;
    if (!hasText && !hasEntries) {
      return HttpResponse.json(
        {
          status: 400,
          error: 'Bad Request',
          message: 'Assessment must include free text or at least one symptom entry.',
        },
        { status: 400 },
      );
    }

    const mentionsChestPain =
      body.freeText.toLowerCase().includes('chest pain') ||
      body.symptomEntries.some((entry) => entry.rawText === 'chest_pain');
    return HttpResponse.json(mentionsChestPain ? emergencyResponse : predictionResponse);
  }),
];

export const validationErrorHandler = http.post(ASSESSMENTS_URL, () =>
  HttpResponse.json({ status: 400 }, { status: 400 }),
);

export const networkErrorHandler = http.post(ASSESSMENTS_URL, () => HttpResponse.error());

export const serverErrorHandler = http.post(ASSESSMENTS_URL, () =>
  HttpResponse.json({ status: 503 }, { status: 503 }),
);

export const unrecognizedSymptomsHandler = http.post(ASSESSMENTS_URL, () =>
  HttpResponse.json({ status: 422 }, { status: 422 }),
);
