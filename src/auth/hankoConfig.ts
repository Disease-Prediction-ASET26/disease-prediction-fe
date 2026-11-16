/** Local Hanko from the backend's `compose.yaml`. */
export const LOCAL_HANKO_API_URL = 'http://localhost:8100';

/**
 * Hanko public API URL from `VITE_HANKO_API_URL` (embedded at build time). Empty means the local
 * Hanko. The Docker images set the dev and production URLs.
 */
export function resolveHankoApiUrl(
  raw: string | undefined = import.meta.env.VITE_HANKO_API_URL,
): string {
  const trimmed = (raw ?? '').trim().replace(/\/+$/, '');
  return trimmed === '' ? LOCAL_HANKO_API_URL : trimmed;
}
