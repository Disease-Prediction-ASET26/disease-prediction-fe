import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../../application/ProfileContext';
import { useAuth } from '../../auth/AuthContext';
import { PATHS } from '../paths';

/**
 * `/account` — the profile, consent (FR-G1), Hanko's `<hanko-profile>` for email addresses,
 * passkeys and password, and sign-out.
 */
export function AccountRoute() {
  const { client, logout } = useAuth();
  const { profile, recordConsent } = useProfile();
  const navigate = useNavigate();
  const [elementsFailed, setElementsFailed] = useState(false);
  const [consentBusy, setConsentBusy] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    client.ensureElements().catch(() => {
      if (active) setElementsFailed(true);
    });
    return () => {
      active = false;
    };
  }, [client]);

  if (!profile) return null;

  const changeConsent = async (granted: boolean) => {
    setConsentBusy(true);
    setConsentError(null);
    try {
      await recordConsent(granted);
    } catch (error) {
      setConsentError(error instanceof Error ? error.message : 'Consent could not be saved.');
    } finally {
      setConsentBusy(false);
    }
  };

  const signOut = async () => {
    // Leave the protected page first; otherwise its guard sends the user to /login.
    await navigate(PATHS.home);
    await logout();
  };

  return (
    <main className="account-page">
      <h1>Your account</h1>
      <section aria-labelledby="account-profile">
        <h2 id="account-profile">Profile</h2>
        <dl className="profile-details">
          <dt>Name</dt>
          <dd>{profile.fullName}</dd>
          <dt>Email</dt>
          <dd>{profile.email}</dd>
          {profile.dateOfBirth && (
            <>
              <dt>Date of birth</dt>
              <dd>{profile.dateOfBirth}</dd>
            </>
          )}
        </dl>
      </section>

      {profile.role === 'PATIENT' && (
        <section aria-labelledby="account-consent">
          <h2 id="account-consent">Consent</h2>
          {profile.consentGranted ? (
            <>
              <p>You consent to the processing of your health data to assess your symptoms.</p>
              <button
                type="button"
                disabled={consentBusy}
                onClick={() => void changeConsent(false)}
              >
                Withdraw consent
              </button>
            </>
          ) : (
            <>
              <p>
                You have withdrawn consent, so you cannot start an assessment. You can give it again
                at any time.
              </p>
              <button type="button" disabled={consentBusy} onClick={() => void changeConsent(true)}>
                Give consent
              </button>
            </>
          )}
          {consentError && (
            <div className="message message-error" role="alert">
              <p>{consentError}</p>
            </div>
          )}
        </section>
      )}

      <section aria-labelledby="account-security">
        <h2 id="account-security">Sign-in methods</h2>
        {elementsFailed ? (
          <p className="message message-error">Sign-in settings are unavailable right now.</p>
        ) : (
          <hanko-profile />
        )}
      </section>

      <button type="button" onClick={() => void signOut()}>
        Sign out
      </button>
    </main>
  );
}
