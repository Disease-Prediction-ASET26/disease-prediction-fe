import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { LoadingView } from '../guards/LoadingView';
import { readRedirectTarget } from '../paths';

/**
 * `/login` — Hanko's `<hanko-auth>` handles sign-in and registration (email passcode, passkey,
 * Google). Once a session exists, return to the page the guard came from.
 */
export function LoginRoute() {
  const { status, client } = useAuth();
  const location = useLocation();
  const [elementsFailed, setElementsFailed] = useState(false);

  useEffect(() => {
    let active = true;
    client.ensureElements().catch(() => {
      if (active) setElementsFailed(true);
    });
    return () => {
      active = false;
    };
  }, [client]);

  if (status === 'authenticated') {
    return <Navigate to={readRedirectTarget(location.state)} replace />;
  }
  if (status === 'loading') return <LoadingView />;

  return (
    <main className="auth-page">
      <h1>Sign in</h1>
      <p className="lede">
        Sign in or create an account to check your symptoms. Your assessments are linked to your
        account.
      </p>
      {elementsFailed ? (
        <div className="message message-error" role="alert">
          <p>Sign-in is unavailable right now. Please try again later.</p>
        </div>
      ) : (
        <>
          <p>
            To register with email, select <strong>Create account</strong> at the bottom of the
            form.
          </p>
          <p>
            If you created your account with email, continue to sign in with email. Connecting
            Google to an existing email account is not available yet.
          </p>
          <hanko-auth />
        </>
      )}
    </main>
  );
}
