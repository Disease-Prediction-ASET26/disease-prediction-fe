import { Link, Navigate, useLocation } from 'react-router-dom';
import { UrgencyBanner } from '../../components/UrgencyBanner';
import { PATHS, readAssessmentState } from '../paths';

/**
 * `/assessment/emergency` — FR-P5 / UC2. Urgency EMERGENCY halts prediction: only the ambulance
 * (112) alert and the red flags behind it are shown,
 * with no route to the predictions. Without router state it redirects to the form, like the result
 * route.
 */
export function EmergencyRoute() {
  const location = useLocation();
  const assessment = readAssessmentState(location.state);

  if (!assessment) return <Navigate to={PATHS.assessment} replace />;

  return (
    <main className="narrow-page emergency-page">
      <h1>Get help now</h1>
      <UrgencyBanner urgency="EMERGENCY" redFlags={assessment.result?.redFlags} />
      <p className="page-actions">
        <Link className="button secondary" to={PATHS.assessment}>
          Start a new assessment
        </Link>
      </p>
    </main>
  );
}
