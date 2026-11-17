import { predictionResponse, problem } from '../test/mocks/fixtures';
import {
  ApiProblemError,
  NetworkError,
  UnrecognizedSymptomsError,
  ValidationError,
} from './errors';
import { HttpAssessmentApiClient, resolveApiBaseUrl } from './HttpAssessmentApiClient';

const request = { patientId: null, freeText: 'cough', symptomEntries: [] };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('resolveApiBaseUrl', () => {
  it.each([
    [undefined, ''],
    ['', ''],
    ['http://localhost:8080', 'http://localhost:8080'],
    ['http://localhost:8080///', 'http://localhost:8080'],
    ['  https://api.example.test/ ', 'https://api.example.test'],
  ])('%j -> %j', (raw, expected) => {
    expect(resolveApiBaseUrl(raw)).toBe(expected);
  });
});

describe('HttpAssessmentApiClient', () => {
  it('POSTs the request as JSON to <base>/api/assessments', async () => {
    const fetchFn = vi.fn(async () => jsonResponse(predictionResponse));
    const client = new HttpAssessmentApiClient('http://backend.test', fetchFn);

    await expect(client.submitAssessment(request)).resolves.toEqual(predictionResponse);

    expect(fetchFn).toHaveBeenCalledWith('http://backend.test/api/assessments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(request),
    });
  });

  it('maps 400 to ValidationError', async () => {
    const client = new HttpAssessmentApiClient('', async () => jsonResponse({}, 400));
    await expect(client.submitAssessment(request)).rejects.toBeInstanceOf(ValidationError);
  });

  it('maps 422 to UnrecognizedSymptomsError', async () => {
    const client = new HttpAssessmentApiClient('', async () => jsonResponse({}, 422));
    await expect(client.submitAssessment(request)).rejects.toBeInstanceOf(
      UnrecognizedSymptomsError,
    );
  });

  it('maps 5xx to a NetworkError carrying the status', async () => {
    const client = new HttpAssessmentApiClient('', async () => jsonResponse({}, 503));
    await expect(client.submitAssessment(request)).rejects.toMatchObject({
      name: 'NetworkError',
      status: 503,
    });
  });

  it('maps a fetch rejection to NetworkError', async () => {
    const client = new HttpAssessmentApiClient('', async () => {
      throw new TypeError('Failed to fetch');
    });
    await expect(client.submitAssessment(request)).rejects.toBeInstanceOf(NetworkError);
  });

  it('maps an unparseable body to NetworkError', async () => {
    const client = new HttpAssessmentApiClient(
      '',
      async () => new Response('<html>', { status: 200 }),
    );
    await expect(client.submitAssessment(request)).rejects.toBeInstanceOf(NetworkError);
  });

  it('maps a body that does not match the contract to NetworkError', async () => {
    const client = new HttpAssessmentApiClient('', async () => jsonResponse({ unexpected: true }));
    await expect(client.submitAssessment(request)).rejects.toBeInstanceOf(NetworkError);
  });

  it.each([
    [403, 'consent-required', /Consent to processing your health data is required/],
    [403, 'profile-required', /Complete your profile/],
    [403, 'forbidden', /only available to patient accounts/],
    [401, 'unauthorized', /session has ended/],
  ])(
    'maps %i %s to ApiProblemError with a patient-facing message',
    async (status, code, message) => {
      const client = new HttpAssessmentApiClient('', async () =>
        jsonResponse(problem(status, code), status),
      );
      const error = await client.submitAssessment(request).catch((caught: unknown) => caught);
      expect(error).toBeInstanceOf(ApiProblemError);
      expect(error).toMatchObject({ code, status });
      expect((error as Error).message).toMatch(message);
    },
  );

  describe('submitFollowUp', () => {
    const followUpRequest = {
      confirmedSymptoms: ['itching'],
      deniedSymptoms: [],
      answer: { symptom: 'nodal_skin_eruptions', present: true },
      roundsUsed: 0,
    };

    it('POSTs the follow-up request as JSON to <base>/api/assessments/followup', async () => {
      const fetchFn = vi.fn(async () => jsonResponse(predictionResponse));
      const client = new HttpAssessmentApiClient('http://backend.test', fetchFn);

      await expect(client.submitFollowUp(followUpRequest)).resolves.toEqual(predictionResponse);

      expect(fetchFn).toHaveBeenCalledWith('http://backend.test/api/assessments/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(followUpRequest),
      });
    });

    it('shares the error mapping (400 -> ValidationError)', async () => {
      const client = new HttpAssessmentApiClient('', async () => jsonResponse({}, 400));
      await expect(client.submitFollowUp(followUpRequest)).rejects.toBeInstanceOf(ValidationError);
    });

    it('shares the problem mapping (403 consent-required -> ApiProblemError)', async () => {
      const client = new HttpAssessmentApiClient('', async () =>
        jsonResponse(problem(403, 'consent-required'), 403),
      );
      await expect(client.submitFollowUp(followUpRequest)).rejects.toBeInstanceOf(ApiProblemError);
    });
  });
});
