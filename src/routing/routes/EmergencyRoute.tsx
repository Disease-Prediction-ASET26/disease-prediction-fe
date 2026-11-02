import { Link, Navigate, useLocation } from 'react-router-dom';
import { EmergencyBanner } from '../../components/EmergencyBanner';
import { PATHS, readAssessmentState } from '../paths';

/**
 * `/assessment/emergency` — FR-P5 / UC2. The 112 alert replaces the normal result; the
 * predictions stay reachable behind a secondary link. Without router state it redirects to the
 * form, like the result route.
 */
export function EmergencyRoute() {
  const location = useLocation();
  const assessment = readAssessmentState(location.state);

  if (!assessment) return <Navigate to={PATHS.assessment} replace />;

  return (
    <main className="emergency-page">
      <h1>Get help now</h1>
      <EmergencyBanner visible />
      {assessment.result && (
        <p className="deemphasised">
          <Link to={PATHS.result} state={location.state}>
            View the assessment details (not a substitute for emergency care)
          </Link>
        </p>
      )}
    </main>
  );
}
