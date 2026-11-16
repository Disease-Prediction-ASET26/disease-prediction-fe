import type { FormEvent } from 'react';
import { useId, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useProfile } from '../../application/ProfileContext';
import { LoadingView } from '../guards/LoadingView';
import { readRedirectTarget } from '../paths';

/** Yesterday as `YYYY-MM-DD` (local time): the latest allowed date of birth. */
function latestBirthDate(today: Date = new Date()): string {
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  const month = String(yesterday.getMonth() + 1).padStart(2, '0');
  const day = String(yesterday.getDate()).padStart(2, '0');
  return `${yesterday.getFullYear()}-${month}-${day}`;
}

/**
 * `/onboarding` — first login (MDD Iteration 6). Hanko only knows the email; this form creates the
 * patient profile and records consent (FR-G1, UC1 step 1) with `POST /api/me`.
 */
export function OnboardingRoute() {
  const { status, profile, errorMessage, reload, createProfile } = useProfile();
  const location = useLocation();
  const id = useId();
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (status === 'ready' && profile) {
    return <Navigate to={readRedirectTarget(location.state)} replace />;
  }
  if (status === 'none' || status === 'loading') return <LoadingView />;
  if (status === 'error') {
    return (
      <main>
        <h1>Your profile could not be loaded</h1>
        <div className="message message-error" role="alert">
          <p>{errorMessage}</p>
          <button type="button" onClick={reload}>
            Try again
          </button>
        </div>
      </main>
    );
  }

  const canSubmit = fullName.trim().length > 0 && consent && !submitting;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createProfile({
        fullName: fullName.trim(),
        dateOfBirth: dateOfBirth === '' ? null : dateOfBirth,
        consentGranted: true,
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Your profile could not be saved.');
      setSubmitting(false);
    }
  };

  return (
    <main className="onboarding-page">
      <h1>Complete your profile</h1>
      <p className="lede">
        One step before your first assessment. Your name and date of birth are stored encrypted.
      </p>
      <form onSubmit={(event) => void handleSubmit(event)} noValidate aria-busy={submitting}>
        <div className="field">
          <label htmlFor={`${id}-name`}>Full name</label>
          <input
            id={`${id}-name`}
            type="text"
            autoComplete="name"
            maxLength={255}
            required
            value={fullName}
            disabled={submitting}
            onChange={(event) => setFullName(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor={`${id}-dob`}>Date of birth (optional)</label>
          <input
            id={`${id}-dob`}
            type="date"
            autoComplete="bday"
            max={latestBirthDate()}
            value={dateOfBirth}
            disabled={submitting}
            onChange={(event) => setDateOfBirth(event.target.value)}
          />
        </div>
        <div className="field consent-field">
          <input
            id={`${id}-consent`}
            type="checkbox"
            checked={consent}
            disabled={submitting}
            aria-describedby={`${id}-consent-hint`}
            onChange={(event) => setConsent(event.target.checked)}
          />
          <label htmlFor={`${id}-consent`}>
            I consent to the processing of my health data to assess my symptoms.
          </label>
          <p id={`${id}-consent-hint`} className="field-hint">
            Required to use the symptom checker. You can withdraw consent at any time on your
            account page.
          </p>
        </div>
        <div className="form-actions">
          <button type="submit" disabled={!canSubmit}>
            {submitting ? 'Saving…' : 'Save and continue'}
          </button>
        </div>
      </form>
      {submitError && (
        <div className="message message-error" role="alert">
          <p>{submitError}</p>
        </div>
      )}
    </main>
  );
}
