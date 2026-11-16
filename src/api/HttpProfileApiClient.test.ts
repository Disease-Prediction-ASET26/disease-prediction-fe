import { patientProfile, problem } from '../test/mocks/fixtures';
import { ApiProblemError, NetworkError } from './errors';
import { HttpProfileApiClient } from './HttpProfileApiClient';

function respond(status: number, body: unknown) {
  return vi.fn<typeof fetch>(() =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  );
}

describe('HttpProfileApiClient', () => {
  it('GET /api/me returns the profile', async () => {
    const fetchFn = respond(200, patientProfile);
    const client = new HttpProfileApiClient(fetchFn, 'http://backend.test');

    await expect(client.getProfile()).resolves.toEqual(patientProfile);
    expect(fetchFn.mock.calls[0][0]).toBe('http://backend.test/api/me');
  });

  it('a 404 profile-not-found means first login (null)', async () => {
    const client = new HttpProfileApiClient(respond(404, problem(404, 'profile-not-found')), '');
    await expect(client.getProfile()).resolves.toBeNull();
  });

  it('another 404 is an error, not a first login', async () => {
    const client = new HttpProfileApiClient(respond(404, { error: 'Not Found' }), '');
    await expect(client.getProfile()).rejects.toBeInstanceOf(ApiProblemError);
  });

  it('POST /api/me sends the onboarding data', async () => {
    const fetchFn = respond(201, patientProfile);
    const client = new HttpProfileApiClient(fetchFn, '');

    await client.createProfile({
      fullName: 'Test Patient',
      dateOfBirth: '1990-01-01',
      consentGranted: true,
    });

    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe('/api/me');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual({
      fullName: 'Test Patient',
      dateOfBirth: '1990-01-01',
      consentGranted: true,
    });
  });

  it('POST /api/me/consents sends the decision', async () => {
    const fetchFn = respond(201, { ...patientProfile, consentGranted: false });
    const updated = await new HttpProfileApiClient(fetchFn, '').recordConsent(false);

    expect(updated.consentGranted).toBe(false);
    expect(fetchFn.mock.calls[0][0]).toBe('/api/me/consents');
    expect(JSON.parse(String(fetchFn.mock.calls[0][1]?.body))).toEqual({ granted: false });
  });

  it('maps problem codes to patient-facing messages', async () => {
    const client = new HttpProfileApiClient(respond(409, problem(409, 'profile-exists')), '');
    const error = await client
      .createProfile({ fullName: 'A', consentGranted: true })
      .catch((e) => e);

    expect(error).toBeInstanceOf(ApiProblemError);
    expect(error).toMatchObject({ code: 'profile-exists', status: 409 });
    expect(error.message).toBe('Your profile already exists.');
  });

  it('5xx and unexpected bodies are network errors', async () => {
    await expect(
      new HttpProfileApiClient(respond(503, {}), '').getProfile(),
    ).rejects.toBeInstanceOf(NetworkError);
    await expect(
      new HttpProfileApiClient(respond(200, { id: 1 }), '').getProfile(),
    ).rejects.toBeInstanceOf(NetworkError);
  });

  it('a failed request is a network error', async () => {
    const fetchFn = vi.fn<typeof fetch>(() => Promise.reject(new TypeError('offline')));
    await expect(new HttpProfileApiClient(fetchFn, '').getProfile()).rejects.toBeInstanceOf(
      NetworkError,
    );
  });
});
