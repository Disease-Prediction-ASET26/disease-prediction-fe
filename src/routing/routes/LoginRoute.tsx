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
    <main className="narrow-page auth-page" aria-labelledby="sign-in-title">
      <div className="auth-intro">
        <h1 id="sign-in-title">Sign in</h1>
        <p className="lede">
          Sign in or create an account to check your symptoms. Your assessments are linked to your
          account.
        </p>
      </div>
      <section className="auth-panel" aria-label="Sign-in options">
        {elementsFailed ? (
          <div className="message message-error" role="alert">
            <p>Sign-in is unavailable right now. Please try again later.</p>
          </div>
        ) : (
          <hanko-auth />
        )}
      </section>
    </main>
  );
}
