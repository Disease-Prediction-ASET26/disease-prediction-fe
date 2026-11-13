import { useState, type FormEvent } from 'react';
import type { AssessmentInput } from '../application/useAssessment';
import { useAssessment } from '../application/useAssessment';
import { EmergencyBanner } from '../components/EmergencyBanner';
import { PredictionResultView } from '../components/PredictionResultView';
import { SymptomChecklist } from '../components/SymptomChecklist';
import { SymptomFreeTextInput } from '../components/SymptomFreeTextInput';
import type { AssessmentResponse, SymptomEntry } from '../domain/assessment';
import { hasAnySymptomSignal } from '../domain/assessment';

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
 */
export function AssessmentPage({ onAssessmentComplete }: AssessmentPageProps) {
  const [freeText, setFreeText] = useState('');
  const [symptomEntries, setSymptomEntries] = useState<SymptomEntry[]>([]);
  const { status, data, error, submit } = useAssessment();

  const input: AssessmentInput = { freeText, symptomEntries, patientId: null };
  const canSubmit = hasAnySymptomSignal({ freeText, symptomEntries });
  const isLoading = status === 'loading';
  const hintId = 'assessment-submit-hint';

  const send = async () => {
    const response = await submit(input);
    if (response && onAssessmentComplete) onAssessmentComplete(response);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || isLoading) return;
    void send();
  };

  const showInlineResult = status === 'success' && data !== null && !onAssessmentComplete;

  return (
    <main className="assessment-page">
      <h1>Symptom assessment</h1>
      <p className="lede">
        Tell us how you feel. You can describe your symptoms in your own words, tick them from the
        list, or both.
      </p>

      {showInlineResult && <EmergencyBanner visible={data.emergencyDetected} />}

      <form onSubmit={handleSubmit} noValidate aria-busy={isLoading}>
        <SymptomFreeTextInput value={freeText} onChange={setFreeText} disabled={isLoading} />
        <SymptomChecklist
          value={symptomEntries}
          onChange={setSymptomEntries}
          disabled={isLoading}
        />

        <div className="form-actions">
          <button
            type="submit"
            disabled={!canSubmit || isLoading}
            aria-describedby={canSubmit ? undefined : hintId}
          >
            {isLoading ? 'Analysing…' : 'Get assessment'}
          </button>
          {!canSubmit && (
            <p id={hintId} className="field-hint">
              Describe your symptoms or select at least one from the list to continue.
            </p>
          )}
        </div>
      </form>

      {status === 'error' &&
        (error?.kind === 'validation' || error?.kind === 'unrecognized') && (
        <div className="message message-warning" role="alert">
          <p>{error.message}</p>
        </div>
        )}

      {status === 'error' && error?.kind === 'network' && (
        <div className="message message-error" role="alert">
          <p>{error.message}</p>
          <button type="button" onClick={() => void send()} disabled={!canSubmit}>
            Try again
          </button>
        </div>
      )}

      {isLoading && (
        <p className="message" role="status">
          Analysing your symptoms…
        </p>
      )}

      {/* FR-P5: a red flag halts prediction; only the 112 alert is shown. */}
      {showInlineResult && data.result && !data.emergencyDetected && (
        <PredictionResultView result={data.result} />
      )}
    </main>
  );
}
