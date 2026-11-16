import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FakeAuthClient } from '../test/FakeAuthClient';
import { useAuth } from './AuthContext';
import { AuthProvider } from './AuthProvider';
import { LOCAL_HANKO_API_URL, resolveHankoApiUrl } from './hankoConfig';

function Status() {
  const { status, logout } = useAuth();
  return (
    <>
      <p>status: {status}</p>
      <button type="button" onClick={() => void logout()}>
        Log out
      </button>
    </>
  );
}

describe('AuthProvider', () => {
  it('starts loading, then asks the identity provider', async () => {
    render(
      <AuthProvider client={new FakeAuthClient(true)}>
        <Status />
      </AuthProvider>,
    );
    expect(screen.getByText('status: loading')).toBeInTheDocument();
    expect(await screen.findByText('status: authenticated')).toBeInTheDocument();
  });

  it('is anonymous without a session', async () => {
    render(
      <AuthProvider client={new FakeAuthClient(false)}>
        <Status />
      </AuthProvider>,
    );
    expect(await screen.findByText('status: anonymous')).toBeInTheDocument();
  });

  it('follows login and session-end events', async () => {
    const auth = new FakeAuthClient(false);
    render(
      <AuthProvider client={auth}>
        <Status />
      </AuthProvider>,
    );
    await screen.findByText('status: anonymous');

    act(() => auth.completeLogin());
    expect(screen.getByText('status: authenticated')).toBeInTheDocument();

    act(() => auth.endSession());
    expect(screen.getByText('status: anonymous')).toBeInTheDocument();
  });

  it('logout ends the session in Hanko', async () => {
    const auth = new FakeAuthClient(true);
    render(
      <AuthProvider client={auth}>
        <Status />
      </AuthProvider>,
    );
    await screen.findByText('status: authenticated');

    await userEvent.click(screen.getByRole('button', { name: 'Log out' }));

    expect(auth.logoutCalls).toBe(1);
    expect(screen.getByText('status: anonymous')).toBeInTheDocument();
  });

  it('a failing session check counts as signed out', async () => {
    const auth = new FakeAuthClient(true);
    auth.hasSession = () => Promise.reject(new Error('Hanko down'));
    render(
      <AuthProvider client={auth}>
        <Status />
      </AuthProvider>,
    );
    expect(await screen.findByText('status: anonymous')).toBeInTheDocument();
  });
});

describe('resolveHankoApiUrl', () => {
  it.each([
    [undefined, LOCAL_HANKO_API_URL],
    ['', LOCAL_HANKO_API_URL],
    ['  https://identity-dev.pocket-doc.app/ ', 'https://identity-dev.pocket-doc.app'],
  ])('%j → %s', (raw, expected) => {
    expect(resolveHankoApiUrl(raw)).toBe(expected);
  });
});
