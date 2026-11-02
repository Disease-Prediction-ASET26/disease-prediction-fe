import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  networkErrorHandler,
  receivedRequests,
  serverErrorHandler,
  validationErrorHandler,
} from '../test/mocks/handlers';
import { server } from '../test/mocks/server';
import { AssessmentPage } from './AssessmentPage';

/** Drives the real page + hook + HTTP client against MSW-mocked `POST /api/assessments`. */
describe('AssessmentPage (integration)', () => {
  const submitButton = () => screen.getByRole('button', { name: 'Get assessment' });
  const textbox = () => screen.getByRole('textbox', { name: 'Describe your symptoms' });

  it('keeps submit disabled until there is a symptom signal', async () => {
    render(<AssessmentPage />);

    expect(submitButton()).toBeDisabled();
    expect(screen.getByText(/select at least one from the list to continue/)).toBeInTheDocument();

    await userEvent.type(textbox(), '   ');
    expect(submitButton()).toBeDisabled();

    await userEvent.type(textbox(), 'cough');
    expect(submitButton()).toBeEnabled();
    expect(receivedRequests).toHaveLength(0);
  });

  it('free text only: submits freeText and renders the ranked predictions', async () => {
    render(<AssessmentPage />);

    await userEvent.type(textbox(), 'I have a cough and a headache');
    await userEvent.click(submitButton());

    expect(await screen.findByRole('heading', { name: 'Possible conditions' })).toBeInTheDocument();
    expect(screen.getByText('Common Cold')).toBeInTheDocument();
    expect(screen.getByText('82%')).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent('This is not a medical diagnosis');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(receivedRequests).toEqual([
      { patientId: null, freeText: 'I have a cough and a headache', symptomEntries: [] },
    ]);
  });

  it('checklist only: submits mapped symptom entries and renders the predictions', async () => {
    render(<AssessmentPage />);

    await userEvent.click(screen.getByRole('checkbox', { name: 'Cough' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Headache' }));
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Severity of Headache' }),
      'SEVERE',
    );
    await userEvent.click(submitButton());

    expect(await screen.findByText('Common Cold')).toBeVisible();
    expect(receivedRequests).toEqual([
      {
        patientId: null,
        freeText: '',
        symptomEntries: [
          { rawText: 'cough', severity: 'MODERATE', durationDays: 0, isMapped: true },
          { rawText: 'headache', severity: 'SEVERE', durationDays: 0, isMapped: true },
        ],
      },
    ]);
  });

  it('emergency response: shows the 112 alert and halts the predictions', async () => {
    render(<AssessmentPage />);

    await userEvent.click(screen.getByRole('checkbox', { name: 'Chest pain' }));
    await userEvent.click(submitButton());

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('112');
    // FR-P5: prediction output is halted, not just collapsed.
    expect(screen.queryByText('Common Cold')).not.toBeInTheDocument();
    expect(screen.queryByText(/assessment details/i)).not.toBeInTheDocument();
  });

  it('400 response: shows a validation message', async () => {
    server.use(validationErrorHandler);
    render(<AssessmentPage />);

    await userEvent.type(textbox(), 'cough');
    await userEvent.click(submitButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(/describe at least one symptom/i);
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
    expect(screen.queryByText('Common Cold')).not.toBeInTheDocument();
  });

  it('network error: shows a retryable error, and retry succeeds', async () => {
    server.use(networkErrorHandler);
    render(<AssessmentPage />);

    await userEvent.type(textbox(), 'cough');
    await userEvent.click(submitButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not reach/i);

    server.resetHandlers();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Common Cold')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('server error: shows a retryable error', async () => {
    server.use(serverErrorHandler);
    render(<AssessmentPage />);

    await userEvent.type(textbox(), 'cough');
    await userEvent.click(submitButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(/unavailable/i);
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('hands the response to its host instead of rendering inline when onAssessmentComplete is set', async () => {
    const onAssessmentComplete = vi.fn();
    render(<AssessmentPage onAssessmentComplete={onAssessmentComplete} />);

    await userEvent.type(textbox(), 'cough');
    await userEvent.click(submitButton());

    await vi.waitFor(() => expect(onAssessmentComplete).toHaveBeenCalledTimes(1));
    expect(onAssessmentComplete.mock.calls[0][0]).toMatchObject({ emergencyDetected: false });
    expect(screen.queryByText('Common Cold')).not.toBeInTheDocument();
  });
});
