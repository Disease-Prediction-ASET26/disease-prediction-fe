import { Link, Navigate, useLocation } from 'react-router-dom';
import { EmergencyBanner } from '../../components/EmergencyBanner';
import { PATHS, readAssessmentState } from '../paths';

/**
 * `/assessment/emergency` — FR-P5 / UC2. A red flag halts prediction: only the 112 alert is shown,
 * with no route to the predictions. Without router state it redirects to the form, like the result
 * route.
 */
export function EmergencyRoute() {
  const location = useLocation();
  const assessment = readAssessmentState(location.state);

  if (!assessment) return <Navigate to={PATHS.assessment} replace />;

  return (
    <main className="emergency-page">
      <h1>Get help now</h1>
      <EmergencyBanner visible />
      <p>
        <Link to={PATHS.assessment}>Start a new assessment</Link>
      </p>
    </main>
  );
}
