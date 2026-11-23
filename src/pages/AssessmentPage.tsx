import { useId, useState, type FormEvent } from 'react';
import { Button } from '@radix-ui/themes';
import type { AssessmentInput } from '../application/useAssessment';
import { useAssessment } from '../application/useAssessment';
import { FollowUpQuestion } from '../components/FollowUpQuestion';
import { PredictionResultView } from '../components/PredictionResultView';
import { SymptomChecklist } from '../components/SymptomChecklist';
import { UrgencyBanner } from '../components/UrgencyBanner';
import { EMERGENCY_NUMBER } from '../components/EmergencyBanner';
import { EmergencyNote, PageHeader } from '../components/ui/Layout';
import type { AssessmentResponse, SymptomEntry } from '../domain/assessment';
import { hasAnySymptomSignal, urgencyOf } from '../domain/assessment';

export interface AssessmentPageProps {
  /**
   * Called after a successful submission. When provided, the page hands the response to its host
   * (e.g. a router that shows the result elsewhere) and does not render the result inline.
   */
  onAssessmentComplete?: (response: AssessmentResponse) => void;
}

/**
 * UC1 — patient triage. Owns the form state, composes the two input modes (FR-P1), and shows the
 * outcome: ranked predictions (FR-P2/P3) or, instead of them, the emergency alert (FR-P5). Contains no navigation,
 * so it can be mounted by a router unchanged.
 *
 * FR-P3 adaptive questioning: when a result needs a follow-up, the page keeps the loop inline —
 * it shows the yes/no question and re-predicts on each answer, and only hands the final result to
 * {@link AssessmentPageProps.onAssessmentComplete} once no follow-up remains.
 */
/** The two symptom-input formats (FR-P1). One is shown at a time; the patient can switch. */
type InputMode = 'freeText' | 'checklist';

export function AssessmentPage({ onAssessmentComplete }: AssessmentPageProps) {
  const id = useId();
  const [freeText, setFreeText] = useState('');
  const [symptomEntries, setSymptomEntries] = useState<SymptomEntry[]>([]);
  const [inputMode, setInputMode] = useState<InputMode>('freeText');
  const { status, data, error, submit, answerFollowUp } = useAssessment();

  /**
   * Switch input mode and clear the input being left behind, so only the visible mode can
   * contribute a symptom signal. No-op when the mode is unchanged.
   */
  const changeMode = (mode: InputMode) => {
    if (mode === inputMode) return;
    if (mode === 'freeText') setSymptomEntries([]);
    else setFreeText('');
    setInputMode(mode);
  };

  // Only the active mode's input is sent and counts toward the submit signal.
  const input: AssessmentInput =
    inputMode === 'freeText'
      ? { freeText, symptomEntries: [], patientId: null }
      : { freeText: '', symptomEntries, patientId: null };
  const canSubmit = hasAnySymptomSignal(input);
  const isLoading = status === 'loading';
  const hintId = `${id}-submit-hint`;
  const symptomsId = `${id}-symptoms`;

  const pendingFollowUp =
    data?.result?.needsFollowUp && data.result.followUp ? data.result.followUp : null;

  /**
   * Hand a response to the host only when it is final: no pending follow-up, or an EMERGENCY.
   * An emergency always ends the loop, even when the low-confidence prediction still offers a
   * follow-up question (FR-P5: the ambulance alert must not wait for more answers).
   */
  const completeIfFinal = (response: AssessmentResponse) => {
    const stillAsking =
      urgencyOf(response) !== 'EMERGENCY' &&
      response.result?.needsFollowUp &&
      response.result.followUp;
    if (!stillAsking && onAssessmentComplete) onAssessmentComplete(response);
  };

  const send = async () => {
    const response = await submit(input);
    if (response) completeIfFinal(response);
  };

  const answer = async (present: boolean) => {
    const response = await answerFollowUp(present);
    if (response) completeIfFinal(response);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || isLoading) return;
    void send();
  };

  const showInlineResult = status === 'success' && data !== null && !onAssessmentComplete;
  const urgency = data ? urgencyOf(data) : null;
  const isEmergency = urgency === 'EMERGENCY';
  // The follow-up question shows even in routed mode: the loop runs here before navigation.
  const showFollowUp = status === 'success' && pendingFollowUp !== null && !isEmergency;

  return (
    <main className="narrow-page assessment-page">
      <PageHeader title="Tell us what is happening" />
      <EmergencyNote>
        In an emergency, stop and call <a href={`tel:${EMERGENCY_NUMBER}`}>{EMERGENCY_NUMBER}</a>.
      </EmergencyNote>

      {showInlineResult && <UrgencyBanner urgency={urgency} redFlags={data.result?.redFlags} />}

      <form className="form-card" onSubmit={handleSubmit} noValidate aria-busy={isLoading}>
        <fieldset className="field input-mode">
          <legend>Input method</legend>
          <div className="segmented" role="radiogroup" aria-label="Symptom input format">
            <label className={inputMode === 'freeText' ? 'segment is-active' : 'segment'}>
              <input
                type="radio"
                name="input-mode"
                value="freeText"
                checked={inputMode === 'freeText'}
                disabled={isLoading}
                onChange={() => changeMode('freeText')}
              />
              In my own words
            </label>
            <label className={inputMode === 'checklist' ? 'segment is-active' : 'segment'}>
              <input
                type="radio"
                name="input-mode"
                value="checklist"
                checked={inputMode === 'checklist'}
                disabled={isLoading}
                onChange={() => changeMode('checklist')}
              />
              Choose from a list
            </label>
          </div>
        </fieldset>

        {inputMode === 'freeText' ? (
          <div className="field symptom-description">
            <label htmlFor={symptomsId}>Your symptoms</label>
            <textarea
              id={symptomsId}
              placeholder="For example, “I have had a dry cough and a headache since Monday.”"
              rows={5}
              value={freeText}
              disabled={isLoading}
              onChange={(event) => setFreeText(event.target.value)}
            />
          </div>
        ) : (
          <SymptomChecklist
            value={symptomEntries}
            onChange={setSymptomEntries}
            disabled={isLoading}
          />
        )}

        <div className="form-actions">
          <Button
            type="submit"
            disabled={!canSubmit || isLoading}
            aria-describedby={canSubmit ? undefined : hintId}
          >
            {isLoading ? 'Analysing…' : 'Get assessment'}
          </Button>
          {!canSubmit && (
            <p id={hintId} className="field-hint">
              {inputMode === 'freeText'
                ? 'Add symptoms to continue.'
                : 'Select at least one symptom from the list to continue.'}
            </p>
          )}
        </div>
      </form>

      {status === 'error' && (error?.kind === 'validation' || error?.kind === 'unrecognized') && (
        <div className="message message-warning" role="alert">
          <p>{error.message}</p>
        </div>
      )}

      {status === 'error' && error?.kind === 'problem' && (
        <div className="message message-warning" role="alert">
          <p>{error.message}</p>
        </div>
      )}
      {status === 'error' && error?.kind === 'network' && (
        <div className="message message-error" role="alert">
          <p>{error.message}</p>
          <button
            type="button"
            className="button secondary"
            onClick={() => void send()}
            disabled={!canSubmit}
          >
            Try again
          </button>
        </div>
      )}

      {isLoading && (
        <p className="message" role="status">
          Analysing your symptoms…
        </p>
      )}

      {/* FR-P3: below the confidence threshold, ask one yes/no question and re-predict. */}
      {showFollowUp && pendingFollowUp && (
        <FollowUpQuestion
          followUp={pendingFollowUp}
          onAnswer={(p) => void answer(p)}
          disabled={isLoading}
        />
      )}

      {/* FR-P5: an EMERGENCY halts prediction; only the ambulance (112) alert is shown. */}
      {showInlineResult && data.result && !isEmergency && (
        <PredictionResultView result={data.result} />
      )}
    </main>
  );
}
