import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { FakeAuthClient } from '../test/FakeAuthClient';
import { patientProfile, problem } from '../test/mocks/fixtures';
import {
  backend,
  profileServerErrorHandler,
  PROFILE_URL,
  receivedProfileRequests,
  receivedRequests,
  sessionEndedHandler,
} from '../test/mocks/handlers';
import { server } from '../test/mocks/server';
import { renderApp } from '../test/renderRouter';
import { PATHS, readRedirectTarget } from './paths';

/**
 * MDD Iteration 6, Step 5: login, first-login onboarding, consent and session end, through the
 * real route table, providers and HTTP clients. Hanko is faked; the backend is MSW and answers
 * 401 to any request without the Bearer token.
 */
describe('authentication flow (integration)', () => {
  const hankoAuth = () => document.querySelector('hanko-auth');
  const textbox = () => screen.findByRole('textbox', { name: 'Describe your symptoms' });

  it('the home page stays public', async () => {
    renderApp({ entries: [PATHS.home], auth: new FakeAuthClient(false) });

    expect(screen.getByRole('heading', { name: 'Check your symptoms' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('explains how a new user can register with email', async () => {
    renderApp({ entries: [PATHS.login], auth: new FakeAuthClient(false) });

    await screen.findByRole('heading', { name: 'Sign in' });
    expect(screen.getByText(/to register with email, select/i)).toBeInTheDocument();
    expect(screen.getByText('Create account', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByText(/connecting google to an existing email account/i)).toBeInTheDocument();
    expect(hankoAuth()).not.toBeNull();
  });

  it('a signed-out visit to /assessment goes to /login and comes back after login', async () => {
    const auth = new FakeAuthClient(false);
    const { router } = renderApp({ entries: [PATHS.assessment], auth });

    await screen.findByRole('heading', { name: 'Sign in' });
    expect(router.state.location.pathname).toBe(PATHS.login);
    expect(hankoAuth()).not.toBeNull();

    act(() => auth.completeLogin());

    expect(await textbox()).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(PATHS.assessment);
  });

  it('first login: onboarding creates the profile with consent, then the assessment works', async () => {
    backend.profile = null;
    const auth = new FakeAuthClient(false);
    const { router } = renderApp({ entries: [PATHS.assessment], auth });
    await screen.findByRole('heading', { name: 'Sign in' });

    act(() => auth.completeLogin());

    await screen.findByRole('heading', { name: 'Complete your profile' });
    expect(router.state.location.pathname).toBe(PATHS.onboarding);
    const save = screen.getByRole('button', { name: 'Save and continue' });
    expect(save).toBeDisabled();

    await userEvent.type(screen.getByLabelText('Full name'), '  Ana Pop ');
    expect(save).toBeDisabled(); // consent is required
    await userEvent.click(screen.getByRole('checkbox', { name: /I consent/ }));
    await userEvent.click(save);

    expect(await textbox()).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(PATHS.assessment);
    expect(receivedProfileRequests.find((r) => r.method === 'POST')?.body).toEqual({
      fullName: 'Ana Pop',
      dateOfBirth: null,
      consentGranted: true,
    });

    await userEvent.type(await textbox(), 'I have a cough');
    await userEvent.click(screen.getByRole('button', { name: 'Get assessment' }));
    expect(
      await screen.findByRole('heading', { name: 'Most likely condition' }),
    ).toBeInTheDocument();
    expect(receivedRequests).toHaveLength(1);
  });

  it('a signed-in user without a profile cannot skip onboarding', async () => {
    backend.profile = null;
    const { router } = renderApp({ entries: [PATHS.account] });

    await screen.findByRole('heading', { name: 'Complete your profile' });
    expect(router.state.location.pathname).toBe(PATHS.onboarding);
  });

  it('/onboarding with a finished profile goes to the assessment', async () => {
    const { router } = renderApp({ entries: [PATHS.onboarding] });

    expect(await textbox()).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(PATHS.assessment);
  });

  it('withdrawing consent blocks assessments until it is given again', async () => {
    const { router } = renderApp({ entries: [PATHS.account] });
    await userEvent.click(await screen.findByRole('button', { name: 'Withdraw consent' }));
    expect(await screen.findByRole('button', { name: 'Give consent' })).toBeInTheDocument();

    await act(() => router.navigate(PATHS.assessment));
    expect(screen.getByRole('heading', { name: 'Consent needed' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: /Review consent/ }));
    await userEvent.click(await screen.findByRole('button', { name: 'Give consent' }));
    await screen.findByRole('button', { name: 'Withdraw consent' });

    await act(() => router.navigate(PATHS.assessment));
    expect(await textbox()).toBeInTheDocument();
    expect(receivedProfileRequests.filter((r) => r.path === '/api/me/consents')).toHaveLength(2);
  });

  it('a session that ends (expiry, logout elsewhere) sends the user to /login', async () => {
    const auth = new FakeAuthClient(true);
    const { router } = renderApp({ entries: [PATHS.assessment], auth });
    await textbox();

    act(() => auth.endSession());

    await screen.findByRole('heading', { name: 'Sign in' });
    expect(router.state.location.pathname).toBe(PATHS.login);
  });

  it('a 401 from the backend signs the user out', async () => {
    server.use(sessionEndedHandler);
    const auth = new FakeAuthClient(true);
    const { router } = renderApp({ entries: [PATHS.assessment], auth });
    await userEvent.type(await textbox(), 'cough');

    await userEvent.click(screen.getByRole('button', { name: 'Get assessment' }));

    await screen.findByRole('heading', { name: 'Sign in' });
    expect(router.state.location.pathname).toBe(PATHS.login);
    expect(auth.logoutCalls).toBe(1);
  });

  it('sign out in the header ends the session and goes home', async () => {
    const auth = new FakeAuthClient(true);
    const { router } = renderApp({ entries: [PATHS.assessment], auth });
    await textbox();

    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }));

    await waitFor(() => expect(router.state.location.pathname).toBe(PATHS.home));
    expect(auth.logoutCalls).toBe(1);
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Account' })).not.toBeInTheDocument();
  });

  it.each([false, true])(
    'reports unconfirmed sign-out and allows retry (local token cleared: %s)',
    async (clearedLocally) => {
      const auth = new FakeAuthClient(true);
      auth.logoutFails = true;
      auth.logoutEndsLocallyBeforeFailure = clearedLocally;
      const { router } = renderApp({ entries: [PATHS.assessment], auth });
      await textbox();

      await userEvent.click(screen.getByRole('button', { name: 'Sign out' }));
      expect(await screen.findByRole('alert')).toHaveTextContent('could not confirm sign-out');
      expect(auth.logoutCalls).toBe(1);

      auth.logoutFails = false;
      await userEvent.click(screen.getByRole('button', { name: 'Try signing out again' }));
      await waitFor(() => expect(router.state.location.pathname).toBe(PATHS.home));
      expect(screen.queryByText(/could not confirm sign-out/)).not.toBeInTheDocument();
      expect(auth.logoutCalls).toBe(2);
    },
  );

  it('lets an existing user verify their email without loading the protected profile', async () => {
    server.use(
      http.get(PROFILE_URL, () =>
        HttpResponse.json(problem(403, 'email-not-verified'), { status: 403 }),
      ),
    );
    renderApp({ entries: [PATHS.account] });

    expect(await screen.findByRole('heading', { name: 'Verify your email' })).toBeInTheDocument();
    expect(document.querySelector('hanko-profile')).not.toBeNull();
    expect(screen.getByText(/sign out and sign in again/i)).toBeInTheDocument();
    expect(screen.queryByText(patientProfile.fullName)).not.toBeInTheDocument();
  });

  it('asks quarantined users to contact support instead of verifying their email', async () => {
    server.use(
      http.get(PROFILE_URL, () =>
        HttpResponse.json(problem(403, 'account-quarantined'), { status: 403 }),
      ),
    );
    renderApp({ entries: [PATHS.account] });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Your account needs review. Please contact support.',
    );
    expect(screen.queryByRole('heading', { name: 'Verify your email' })).not.toBeInTheDocument();
    expect(document.querySelector('hanko-profile')).toBeNull();
  });

  it('offers email verification when onboarding is rejected', async () => {
    backend.profile = null;
    server.use(
      http.post(PROFILE_URL, () =>
        HttpResponse.json(problem(400, 'email-not-verified'), { status: 400 }),
      ),
    );
    renderApp({ entries: [PATHS.onboarding] });
    await screen.findByRole('heading', { name: 'Complete your profile' });
    await userEvent.type(screen.getByLabelText('Full name'), 'Ana Pop');
    await userEvent.click(screen.getByRole('checkbox', { name: /I consent/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Save and continue' }));

    expect(await screen.findByRole('heading', { name: 'Verify your email' })).toBeInTheDocument();
    expect(document.querySelector('hanko-profile')).not.toBeNull();
  });

  it('the account page shows the profile and Hanko profile element', async () => {
    renderApp({ entries: [PATHS.account] });

    await screen.findByRole('heading', { name: 'Your account' });
    expect(screen.getByText(patientProfile.email)).toBeInTheDocument();
    expect(screen.getByText(patientProfile.fullName)).toBeInTheDocument();
    expect(document.querySelector('hanko-profile')).not.toBeNull();
  });

  it('a profile that cannot be loaded can be retried', async () => {
    server.use(profileServerErrorHandler);
    renderApp({ entries: [PATHS.assessment] });

    await screen.findByRole('heading', { name: 'Your profile could not be loaded' });
    server.resetHandlers();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await textbox()).toBeInTheDocument();
  });

  it('doctors are told assessments are for patients', async () => {
    backend.profile = { ...patientProfile, role: 'DOCTOR', consentGranted: false };
    renderApp({ entries: [PATHS.assessment] });

    expect(
      await screen.findByRole('heading', { name: 'Assessments are for patients' }),
    ).toBeInTheDocument();
  });

  it('shows a message when Hanko cannot be loaded', async () => {
    const auth = new FakeAuthClient(false);
    auth.elementsFail = true;
    renderApp({ entries: [PATHS.login], auth });

    expect(await screen.findByRole('alert')).toHaveTextContent('Sign-in is unavailable');
    expect(hankoAuth()).toBeNull();
  });
});

describe('readRedirectTarget', () => {
  it.each([
    [{ from: '/account' }, '/account'],
    [{ from: '/assessment?x=1' }, '/assessment?x=1'],
    [undefined, PATHS.assessment],
    [{ from: 'https://evil.example' }, PATHS.assessment],
    [{ from: '//evil.example' }, PATHS.assessment],
    [{ from: PATHS.login }, PATHS.assessment],
    [{ from: PATHS.onboarding }, PATHS.assessment],
  ])('%j → %s', (state, expected) => {
    expect(readRedirectTarget(state)).toBe(expected);
  });
});
