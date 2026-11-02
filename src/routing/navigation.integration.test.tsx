import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { receivedRequests, validationErrorHandler } from '../test/mocks/handlers';
import { server } from '../test/mocks/server';
import { renderAppAt } from '../test/renderRouter';
import { PATHS } from './paths';

/** Full route table + real page/hook/HTTP client, with `POST /api/assessments` mocked by MSW. */
describe('navigation flow (integration)', () => {
  const textbox = () => screen.getByRole('textbox', { name: 'Describe your symptoms' });
  const submit = () => userEvent.click(screen.getByRole('button', { name: 'Get assessment' }));

  it('home → assessment via the call to action', async () => {
    const { router } = renderAppAt(PATHS.home);

    await userEvent.click(screen.getByRole('link', { name: 'Start an assessment' }));

    expect(router.state.location.pathname).toBe(PATHS.assessment);
    expect(textbox()).toBeInTheDocument();
  });

  it('a valid submit navigates to /assessment/result and renders the predictions', async () => {
    const { router } = renderAppAt(PATHS.assessment);

    await userEvent.type(textbox(), 'I have a cough');
    await submit();

    expect(await screen.findByRole('heading', { name: 'Possible conditions' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(PATHS.result);
    expect(screen.getByText('Common Cold')).toBeInTheDocument();
    expect(screen.getByText('82%')).toBeInTheDocument();
    expect(receivedRequests).toHaveLength(1);
  });

  it('moves focus to the new view heading after navigating', async () => {
    renderAppAt(PATHS.assessment);

    await userEvent.type(textbox(), 'I have a cough');
    await submit();

    const heading = await screen.findByRole('heading', { level: 1, name: 'Your assessment' });
    expect(heading).toHaveFocus();
  });

  it('an emergency response navigates to /assessment/emergency and shows the 112 banner', async () => {
    const { router } = renderAppAt(PATHS.assessment);

    await userEvent.type(textbox(), 'sudden chest pain');
    await submit();

    expect(await screen.findByRole('alert')).toHaveTextContent('112');
    expect(router.state.location.pathname).toBe(PATHS.emergency);
    // FR-P5: prediction is halted, with no link through to it.
    expect(screen.queryByText('Common Cold')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /assessment details/i })).not.toBeInTheDocument();
  });

  it('a 400 keeps the user on /assessment with a validation message', async () => {
    server.use(validationErrorHandler);
    const { router } = renderAppAt(PATHS.assessment);

    await userEvent.type(textbox(), 'cough');
    await submit();

    expect(await screen.findByRole('alert')).toHaveTextContent(/describe at least one symptom/i);
    expect(router.state.location.pathname).toBe(PATHS.assessment);
  });

  it('browser back from the result returns to the form', async () => {
    const { router } = renderAppAt(PATHS.home, PATHS.assessment);

    await userEvent.type(textbox(), 'cough');
    await submit();
    await screen.findByRole('heading', { name: 'Possible conditions' });

    await act(() => router.navigate(-1));

    expect(router.state.location.pathname).toBe(PATHS.assessment);
    expect(textbox()).toBeInTheDocument();

    await act(() => router.navigate(1));
    expect(router.state.location.pathname).toBe(PATHS.result);
    expect(screen.getByText('Common Cold')).toBeInTheDocument();
  });

  it('the main navigation starts a new assessment from the result view', async () => {
    const { router } = renderAppAt(PATHS.assessment);
    await userEvent.type(textbox(), 'cough');
    await submit();
    await screen.findByRole('heading', { name: 'Possible conditions' });

    await userEvent.click(screen.getByRole('link', { name: 'New assessment' }));

    expect(router.state.location.pathname).toBe(PATHS.assessment);
    expect(textbox()).toHaveValue('');
  });
});
