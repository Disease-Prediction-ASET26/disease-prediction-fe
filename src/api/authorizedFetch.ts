/**
 * Wraps `fetch` so every backend call carries the Hanko session token as `Authorization: Bearer`
 * (MDD Iteration 6). A 401 means the backend no longer accepts the session, so `onUnauthorized`
 * ends it locally and the route guards send the user to `/login`. The response is still returned
 * so the caller can finish its own error handling.
 */
export function createAuthorizedFetch(
  getToken: () => string | null,
  onUnauthorized: () => void,
  fetchFn: typeof fetch = (...args) => fetch(...args),
): typeof fetch {
  return async (input, init) => {
    const headers = new Headers(init?.headers);
    const token = getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const response = await fetchFn(input, { ...init, headers });
    if (response.status === 401) onUnauthorized();
    return response;
  };
}
