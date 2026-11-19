import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  followUpAssessmentHandler,
  networkErrorHandler,
  receivedFollowUpRequests,
  receivedRequests,
  serverErrorHandler,
  unrecognizedSymptomsHandler,
  validationErrorHandler,
} from '../test/mocks/handlers';
import { server } from '../test/mocks/server';
import { renderWithSession } from '../test/renderRouter';
import { AssessmentPage } from './AssessmentPage';

/**
 * Drives the real page + hook + HTTP client against MSW-mocked `POST /api/assessments`, inside a
 * signed-in session (the client sends the Bearer token).
 */
describe('AssessmentPage (integration)', () => {
  const submitButton = () => screen.getByRole('button', { name: 'Get assessment' });
  const textbox = () => screen.getByRole('textbox', { name: 'Describe your symptoms' });

  it('keeps submit disabled until there is a symptom signal', async () => {
    renderWithSession(<AssessmentPage />);

    expect(submitButton()).toBeDisabled();
    expect(screen.getByText(/select at least one from the list to continue/)).toBeInTheDocument();

    await userEvent.type(textbox(), '   ');
    expect(submitButton()).toBeDisabled();

    await userEvent.type(textbox(), 'cough');
    expect(submitButton()).toBeEnabled();
    expect(receivedRequests).toHaveLength(0);
  });

  it('free text only: submits freeText and renders the ranked predictions', async () => {
    renderWithSession(<AssessmentPage />);

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
    renderWithSession(<AssessmentPage />);

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
    renderWithSession(<AssessmentPage />);

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
    renderWithSession(<AssessmentPage />);

    await userEvent.type(textbox(), 'cough');
    await userEvent.click(submitButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(/describe at least one symptom/i);
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
    expect(screen.queryByText('Common Cold')).not.toBeInTheDocument();
  });

  it('422 response: asks for symptoms the service can recognise', async () => {
    server.use(unrecognizedSymptomsHandler);
    renderWithSession(<AssessmentPage />);

    await userEvent.type(textbox(), 'I feel strange');
    await userEvent.click(submitButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /could not identify a supported symptom/i,
    );
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });

  it('network error: shows a retryable error, and retry succeeds', async () => {
    server.use(networkErrorHandler);
    renderWithSession(<AssessmentPage />);

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
    renderWithSession(<AssessmentPage />);

    await userEvent.type(textbox(), 'cough');
    await userEvent.click(submitButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(/unavailable/i);
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('hands the response to its host instead of rendering inline when onAssessmentComplete is set', async () => {
    const onAssessmentComplete = vi.fn();
    renderWithSession(<AssessmentPage onAssessmentComplete={onAssessmentComplete} />);

    await userEvent.type(textbox(), 'cough');
    await userEvent.click(submitButton());

    await vi.waitFor(() => expect(onAssessmentComplete).toHaveBeenCalledTimes(1));
    expect(onAssessmentComplete.mock.calls[0][0]).toMatchObject({ emergencyDetected: false });
    expect(screen.queryByText('Common Cold')).not.toBeInTheDocument();
  });

  it('low confidence: asks a follow-up, and a "yes" answer sharpens the prediction', async () => {
    server.use(followUpAssessmentHandler);
    renderWithSession(<AssessmentPage />);

    await userEvent.type(textbox(), 'itching');
    await userEvent.click(submitButton());

    // The yes/no question appears alongside the current low-confidence predictions.
    expect(await screen.findByText('Do you also have nodal skin eruptions?')).toBeInTheDocument();
    expect(screen.getByText('48%')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Yes' }));

    // The loop resolves: the question is gone and the confident result shows.
    expect(await screen.findByText('97%')).toBeInTheDocument();
    expect(screen.getByText('Fungal infection')).toBeInTheDocument();
    expect(screen.queryByText('Do you also have nodal skin eruptions?')).not.toBeInTheDocument();

    // The follow-up carried the confirmed symptom and the answer across the SOA boundary.
    expect(receivedFollowUpRequests).toEqual([
      {
        confirmedSymptoms: ['itching'],
        deniedSymptoms: [],
        answer: { symptom: 'nodal_skin_eruptions', present: true },
        roundsUsed: 0,
      },
    ]);
  });

  it('does not complete to the host until the follow-up loop resolves', async () => {
    server.use(followUpAssessmentHandler);
    const onAssessmentComplete = vi.fn();
    renderWithSession(<AssessmentPage onAssessmentComplete={onAssessmentComplete} />);

    await userEvent.type(textbox(), 'itching');
    await userEvent.click(submitButton());

    // A question is pending, so the host is not called yet.
    expect(await screen.findByText('Do you also have nodal skin eruptions?')).toBeInTheDocument();
    expect(onAssessmentComplete).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Yes' }));

    // Loop resolved: now the host receives the final, confident result.
    await vi.waitFor(() => expect(onAssessmentComplete).toHaveBeenCalledTimes(1));
    expect(onAssessmentComplete.mock.calls[0][0]).toMatchObject({
      result: { needsFollowUp: false },
    });
  });
});
