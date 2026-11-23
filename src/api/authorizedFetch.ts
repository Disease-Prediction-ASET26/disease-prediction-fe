/** Returns the current session token. May be async so the caller can await SDK hydration. */
export type TokenGetter = () => string | null | Promise<string | null>;

/**
 * Wraps `fetch` so every backend call carries the Hanko session token as `Authorization: Bearer`
 * (MDD Iteration 6). A 401 means the backend no longer accepts the session, so `onUnauthorized`
 * ends it locally and the route guards send the user to `/login`. The response is still returned
 * so the caller can finish its own error handling.
 *
 * `getToken` may be asynchronous: right after login or a page refresh the Hanko SDK can report an
 * authenticated session a moment before `getSessionToken()` can return the token synchronously.
 * Awaiting it here closes that race, so a protected request is never sent without the header only
 * because the token had not hydrated yet (which the backend would reject with a 401 and the UI
 * would show as a misleading "server unavailable").
 */
export function createAuthorizedFetch(
  getToken: TokenGetter,
  onUnauthorized: () => void,
  fetchFn: typeof fetch = (...args) => fetch(...args),
): typeof fetch {
  return async (input, init) => {
    const headers = new Headers(init?.headers);
    const token = await getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const response = await fetchFn(input, { ...init, headers });
    if (response.status === 401) onUnauthorized();
    return response;
  };
}
