import { http, HttpResponse } from 'msw';
import type { AssessmentRequest, FollowUpRequest } from '../../domain/assessment';
import type { CreateProfileRequest, Profile } from '../../domain/profile';
import { TEST_TOKEN } from '../FakeAuthClient';
import {
  emergencyResponse,
  urgentResponse,
  followUpResolvedResponse,
  followUpResponse,
  patientProfile,
  predictionResponse,
  problem,
} from './fixtures';

export const ASSESSMENTS_URL = '*/api/assessments';
export const FOLLOWUP_URL = '*/api/assessments/followup';
export const PROFILE_URL = '*/api/me';
export const CONSENTS_URL = '*/api/me/consents';

/** Records the bodies the app sent, so tests can assert on the wire contract. */
export const receivedRequests: AssessmentRequest[] = [];
/** Follow-up request bodies the app sent, for asserting the carried symptom sets. */
export const receivedFollowUpRequests: FollowUpRequest[] = [];
/** Profile requests the app sent (method, path, body). */
export const receivedProfileRequests: { method: string; path: string; body: unknown }[] = [];

/** The profile the fake backend returns; `null` = first login (404). Reset after each test. */
export const backend: { profile: Profile | null } = { profile: { ...patientProfile } };

/** Like the backend since Iteration 6: no valid Bearer token → 401 problem. */
function unauthorized(request: Request) {
  if (request.headers.get('Authorization') === `Bearer ${TEST_TOKEN}`) return null;
  return HttpResponse.json(problem(401, 'unauthorized'), {
    status: 401,
    headers: { 'WWW-Authenticate': 'Bearer' },
  });
}

/**
 * Default: behaves like the backend — 400 on no symptom signal, EMERGENCY urgency on "chest pain",
 * URGENT on "high fever".
 */
export const handlers = [
  http.get(PROFILE_URL, ({ request }) => {
    const denied = unauthorized(request);
    if (denied) return denied;
    receivedProfileRequests.push({ method: 'GET', path: '/api/me', body: null });
    return backend.profile
      ? HttpResponse.json(backend.profile)
      : HttpResponse.json(problem(404, 'profile-not-found'), { status: 404 });
  }),
  http.post(PROFILE_URL, async ({ request }) => {
    const denied = unauthorized(request);
    if (denied) return denied;
    const body = (await request.json()) as CreateProfileRequest;
    receivedProfileRequests.push({ method: 'POST', path: '/api/me', body });
    if (backend.profile) {
      return HttpResponse.json(problem(409, 'profile-exists'), { status: 409 });
    }
    backend.profile = {
      ...patientProfile,
      fullName: body.fullName,
      dateOfBirth: body.dateOfBirth ?? null,
      consentGranted: body.consentGranted,
    };
    return HttpResponse.json(backend.profile, { status: 201 });
  }),
  http.post(CONSENTS_URL, async ({ request }) => {
    const denied = unauthorized(request);
    if (denied) return denied;
    const body = (await request.json()) as { granted: boolean };
    receivedProfileRequests.push({ method: 'POST', path: '/api/me/consents', body });
    if (!backend.profile) {
      return HttpResponse.json(problem(403, 'profile-required'), { status: 403 });
    }
    backend.profile = { ...backend.profile, consentGranted: body.granted };
    return HttpResponse.json(backend.profile, { status: 201 });
  }),
  http.post(FOLLOWUP_URL, async ({ request }) => {
    const denied = unauthorized(request);
    if (denied) return denied;
    if (!backend.profile) {
      return HttpResponse.json(problem(403, 'profile-required'), { status: 403 });
    }
    if (!backend.profile.consentGranted) {
      return HttpResponse.json(problem(403, 'consent-required'), { status: 403 });
    }
    const body = (await request.json()) as FollowUpRequest;
    receivedFollowUpRequests.push(body);
    if (!Array.isArray(body.confirmedSymptoms) || body.confirmedSymptoms.length === 0) {
      return HttpResponse.json({ status: 400 }, { status: 400 });
    }
    // A "yes" to the offered symptom resolves the loop; otherwise keep asking.
    const confirmedTheSymptom = body.answer?.present === true;
    return HttpResponse.json(confirmedTheSymptom ? followUpResolvedResponse : followUpResponse);
  }),
  http.post(ASSESSMENTS_URL, async ({ request }) => {
    const denied = unauthorized(request);
    if (denied) return denied;
    if (!backend.profile) {
      return HttpResponse.json(problem(403, 'profile-required'), { status: 403 });
    }
    if (!backend.profile.consentGranted) {
      return HttpResponse.json(problem(403, 'consent-required'), { status: 403 });
    }
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
    if (mentionsChestPain) return HttpResponse.json(emergencyResponse);
    const mentionsHighFever =
      body.freeText.toLowerCase().includes('high fever') ||
      body.symptomEntries.some((entry) => entry.rawText === 'high_fever');
    return HttpResponse.json(mentionsHighFever ? urgentResponse : predictionResponse);
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

export const consentRequiredHandler = http.post(ASSESSMENTS_URL, () =>
  HttpResponse.json(problem(403, 'consent-required'), { status: 403 }),
);
export const sessionEndedHandler = http.post(ASSESSMENTS_URL, () =>
  HttpResponse.json(problem(401, 'unauthorized'), { status: 401 }),
);
export const profileServerErrorHandler = http.get(PROFILE_URL, () =>
  HttpResponse.json({ status: 503 }, { status: 503 }),
);

/** Makes the initial assessment return a low-confidence result that offers a follow-up (FR-P3). */
export const followUpAssessmentHandler = http.post(ASSESSMENTS_URL, async ({ request }) => {
  const body = (await request.json()) as AssessmentRequest;
  receivedRequests.push(body);
  return HttpResponse.json(followUpResponse);
});
