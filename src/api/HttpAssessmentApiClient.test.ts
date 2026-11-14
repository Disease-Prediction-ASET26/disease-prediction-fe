import { predictionResponse } from '../test/mocks/fixtures';
import { NetworkError, UnrecognizedSymptomsError, ValidationError } from './errors';
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
    await expect(client.submitAssessment(request)).rejects.toBeInstanceOf(UnrecognizedSymptomsError);
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
});
