import { Link, Outlet } from 'react-router-dom';
import { useProfile } from '../../application/ProfileContext';
import { PATHS } from '../paths';

/**
 * Pathless layout route for the assessment views (UC1 step 1): only patients with an active
 * consent. The backend refuses the request anyway; this explains why before the user types.
 */
export function RequirePatientConsent() {
  const { profile } = useProfile();

  if (profile && profile.role !== 'PATIENT') {
    return (
      <main className="narrow-page">
        <h1>Assessments are for patients</h1>
        <p>Your account is not a patient account, so it cannot start an assessment.</p>
      </main>
    );
  }
  if (profile && !profile.consentGranted) {
    return (
      <main className="narrow-page">
        <h1>Consent needed</h1>
        <p>
          You have withdrawn your consent to processing your health data, so you cannot start an
          assessment.
        </p>
        <Link className="button primary" to={PATHS.account}>
          Review consent on your account page
        </Link>
      </main>
    );
  }
  return <Outlet />;
}
