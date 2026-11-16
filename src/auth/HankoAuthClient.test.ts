import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HankoAuthClient } from './HankoAuthClient';

const sdk = vi.hoisted(() => ({
  token: 'session-token' as string | null,
  logout: vi.fn<() => Promise<void>>(),
  getSessionToken: vi.fn(() => sdk.token),
}));

vi.mock('@teamhanko/hanko-elements', () => ({
  register: vi.fn(async () => ({ hanko: sdk })),
}));

describe('HankoAuthClient logout', () => {
  beforeEach(() => {
    sdk.token = 'session-token';
    sdk.logout.mockReset();
  });

  afterEach(() => vi.unstubAllGlobals());

  it('retries revocation with the original token if the SDK cleared it on failure', async () => {
    sdk.logout.mockImplementation(async () => {
      sdk.token = null;
      throw new Error('Server error');
    });
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetch);
    const client = new HankoAuthClient('https://identity.example');

    await expect(client.logout()).rejects.toThrow('Server error');
    await expect(client.logout()).resolves.toBeUndefined();
    expect(fetch).toHaveBeenCalledWith('https://identity.example/logout', {
      method: 'POST',
      credentials: 'include',
      headers: { Authorization: 'Bearer session-token' },
    });
  });

  it('keeps the saved token when a retry fails', async () => {
    sdk.logout.mockImplementation(async () => {
      sdk.token = null;
      throw new Error('Server error');
    });
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetch);
    const client = new HankoAuthClient('https://identity.example');

    await expect(client.logout()).rejects.toThrow();
    await expect(client.logout()).rejects.toThrow();
    await expect(client.logout()).resolves.toBeUndefined();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('revokes the old session before signing out a newer session', async () => {
    sdk.logout.mockImplementationOnce(async () => {
      sdk.token = null;
      throw new Error('Server error');
    });
    sdk.logout.mockResolvedValueOnce();
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetch);
    const client = new HankoAuthClient('https://identity.example');

    await expect(client.logout()).rejects.toThrow();
    sdk.token = 'new-session-token';
    await expect(client.logout()).resolves.toBeUndefined();
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer session-token');
    expect(sdk.logout).toHaveBeenCalledTimes(2);
  });
});
