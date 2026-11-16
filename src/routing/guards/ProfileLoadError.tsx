import { useEffect, useState } from 'react';
import { useProfile } from '../../application/ProfileContext';
import { useAuth } from '../../auth/AuthContext';

/** Allows users with an unverified identity to reach Hanko without loading protected data. */
export function ProfileLoadError() {
  const { errorCode, errorMessage, reload } = useProfile();
  const { client } = useAuth();
  const [elementsFailed, setElementsFailed] = useState(false);

  useEffect(() => {
    if (errorCode !== 'email-not-verified') return;
    let active = true;
    client.ensureElements().catch(() => {
      if (active) setElementsFailed(true);
    });
    return () => {
      active = false;
    };
  }, [client, errorCode]);

  if (errorCode === 'email-not-verified') {
    return (
      <main>
        <h1>Verify your email</h1>
        <p>Verify your primary email address below. Then sign out and sign in again.</p>
        {elementsFailed ? (
          <p className="message message-error" role="alert">
            Sign-in settings are unavailable right now. Please try again later.
          </p>
        ) : (
          <hanko-profile />
        )}
      </main>
    );
  }

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
