import { problem, storedAssessmentDetail, storedAssessments } from '../test/mocks/fixtures';
import { ApiProblemError, AssessmentNotFoundError, NetworkError } from './errors';
import { HttpAssessmentApiClient } from './HttpAssessmentApiClient';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('HttpAssessmentApiClient — stored assessments (backend MDD Iteration 7)', () => {
  it('GETs <base>/api/assessments and returns the summaries', async () => {
    const fetchFn = vi.fn(async () => jsonResponse(storedAssessments));
    const client = new HttpAssessmentApiClient('http://backend.test', fetchFn);

    await expect(client.listAssessments()).resolves.toEqual(storedAssessments);
    expect(fetchFn).toHaveBeenCalledWith('http://backend.test/api/assessments', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
  });

  it('rejects a list that does not match the contract', async () => {
    const client = new HttpAssessmentApiClient('', async () =>
      jsonResponse([{ id: 'x', status: 'DONE' }]),
    );

    await expect(client.listAssessments()).rejects.toBeInstanceOf(NetworkError);
  });

  it('GETs one assessment by id, URL-encoded', async () => {
    const fetchFn = vi.fn(async () => jsonResponse(storedAssessmentDetail));
    const client = new HttpAssessmentApiClient('', fetchFn);

    await expect(client.getAssessment(storedAssessmentDetail.id)).resolves.toEqual(
      storedAssessmentDetail,
    );
    await client.getAssessment('a/b').catch(() => undefined);
    expect(fetchFn).toHaveBeenLastCalledWith('/api/assessments/a%2Fb', expect.anything());
  });

  it('maps 404 to AssessmentNotFoundError', async () => {
    const client = new HttpAssessmentApiClient('', async () =>
      jsonResponse(problem(404, 'assessment-not-found'), 404),
    );

    await expect(client.getAssessment('missing')).rejects.toBeInstanceOf(AssessmentNotFoundError);
  });

  it('maps 403 to ApiProblemError with the problem code', async () => {
    const client = new HttpAssessmentApiClient('', async () =>
      jsonResponse(problem(403, 'email-not-verified'), 403),
    );

    await expect(client.listAssessments()).rejects.toMatchObject({
      constructor: ApiProblemError,
      code: 'email-not-verified',
    });
  });

  it('maps a 5xx or a network failure to a retryable NetworkError', async () => {
    const serverError = new HttpAssessmentApiClient(
      '',
      async () => new Response('', { status: 502 }),
    );
    const offline = new HttpAssessmentApiClient('', async () => {
      throw new TypeError('Failed to fetch');
    });

    await expect(serverError.listAssessments()).rejects.toBeInstanceOf(NetworkError);
    await expect(offline.getAssessment('x')).rejects.toBeInstanceOf(NetworkError);
  });
});
