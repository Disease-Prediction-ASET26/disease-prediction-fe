import { useEffect, useState } from 'react';
import { useProfile } from '../../application/ProfileContext';
import { useAuth } from '../../auth/AuthContext';
import { Icon } from '../../components/ui/Icon';
import { PageHeader } from '../../components/ui/Layout';

/**
 * `/account` — the profile, consent (FR-G1) and Hanko's `<hanko-profile>` for email addresses,
 * passkeys and password, laid out as the Pocket Doc settings page. Sign-out lives in the sidebar.
 */
export function AccountRoute() {
  const { client } = useAuth();
  const { profile, recordConsent } = useProfile();
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

  return (
    <main className="account-page">
      <PageHeader
        title="Your account"
        description="Your personal details, your consent and how you sign in."
      />
      <div className="settings-content">
        <section className="settings-section" aria-labelledby="account-profile">
          <h2 id="account-profile">Profile</h2>
          <p>Only the information needed for your account.</p>
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
          <section className="settings-section" aria-labelledby="account-consent">
            <h2 id="account-consent">Consent</h2>
            <p>Allow Pocket Doc to process your health data to assess your symptoms.</p>
            <div className={profile.consentGranted ? 'consent-state active' : 'consent-state'}>
              <Icon name={profile.consentGranted ? 'check' : 'alert'} />
              {profile.consentGranted ? (
                <p>You consent to the processing of your health data to assess your symptoms.</p>
              ) : (
                <p>
                  You have withdrawn consent, so you cannot start an assessment. You can give it
                  again at any time.
                </p>
              )}
            </div>
            {profile.consentGranted ? (
              <button
                type="button"
                className="button secondary"
                disabled={consentBusy}
                onClick={() => void changeConsent(false)}
              >
                Withdraw consent
              </button>
            ) : (
              <button
                type="button"
                className="button primary"
                disabled={consentBusy}
                onClick={() => void changeConsent(true)}
              >
                Give consent
              </button>
            )}
            {consentError && (
              <div className="message message-error" role="alert">
                <p>{consentError}</p>
              </div>
            )}
          </section>
        )}

        <section className="settings-section" aria-labelledby="account-security">
          <h2 id="account-security">Sign-in methods</h2>
          <p>Your email addresses, passkeys and password.</p>
          {elementsFailed ? (
            <p className="message message-error">Sign-in settings are unavailable right now.</p>
          ) : (
            <hanko-profile />
          )}
        </section>

        <section className="settings-section danger-zone" aria-labelledby="account-delete">
          <h2 id="account-delete">Delete account</h2>
          <p>
            Deleting your account and your data from the app is not available yet. It is planned
            together with the right to be forgotten.
          </p>
        </section>
      </div>
    </main>
  );
}
