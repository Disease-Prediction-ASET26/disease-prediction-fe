import { createAuthorizedFetch } from './authorizedFetch';

describe('createAuthorizedFetch', () => {
  const ok = () => Promise.resolve(new Response('{}', { status: 200 }));

  it('adds the session token as a Bearer header and keeps other headers', async () => {
    const fetchFn = vi.fn<typeof fetch>(ok);
    const authorizedFetch = createAuthorizedFetch(() => 'token-1', vi.fn(), fetchFn);

    await authorizedFetch('/api/me', { headers: { Accept: 'application/json' } });

    const headers = new Headers(fetchFn.mock.calls[0][1]?.headers);
    expect(headers.get('Authorization')).toBe('Bearer token-1');
    expect(headers.get('Accept')).toBe('application/json');
  });

  it('sends no Authorization header without a session', async () => {
    const fetchFn = vi.fn<typeof fetch>(ok);
    await createAuthorizedFetch(() => null, vi.fn(), fetchFn)('/api/me');

    expect(new Headers(fetchFn.mock.calls[0][1]?.headers).has('Authorization')).toBe(false);
  });

  it('reports a 401 and still returns the response', async () => {
    const onUnauthorized = vi.fn();
    const fetchFn = vi.fn<typeof fetch>(() => Promise.resolve(new Response('{}', { status: 401 })));

    const response = await createAuthorizedFetch(() => 't', onUnauthorized, fetchFn)('/api/me');

    expect(response.status).toBe(401);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it.each([200, 403, 404, 500])('does not report a %i as an ended session', async (status) => {
    const onUnauthorized = vi.fn();
    const fetchFn = vi.fn<typeof fetch>(() => Promise.resolve(new Response('{}', { status })));

    await createAuthorizedFetch(() => 't', onUnauthorized, fetchFn)('/api/me');

    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});
