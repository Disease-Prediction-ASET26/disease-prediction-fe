import { Link, Navigate, useLocation } from 'react-router-dom';
import { PredictionResultView } from '../../components/PredictionResultView';
import { UrgencyBanner } from '../../components/UrgencyBanner';
import { urgencyOf } from '../../domain/assessment';
import { PATHS, readAssessmentState } from '../paths';

/**
 * `/assessment/result` — ranked predictions for the assessment carried in router state. Entered
 * without that state (deep link, bookmark), it redirects to the form; an emergency assessment
 * redirects to the emergency view, since FR-P5 halts prediction output. An URGENT assessment shows
 * the "see a doctor promptly" banner above the result.
 */
export function ResultRoute() {
  const location = useLocation();
  const assessment = readAssessmentState(location.state);

  if (!assessment) return <Navigate to={PATHS.assessment} replace />;
  const urgency = urgencyOf(assessment);
  if (urgency === 'EMERGENCY') {
    return <Navigate to={PATHS.emergency} state={location.state} replace />;
  }

  return (
    <main className="narrow-page result-page">
      <h1>Your assessment</h1>
      <UrgencyBanner urgency={urgency} redFlags={assessment.result?.redFlags} />
      {assessment.result ? (
        <PredictionResultView result={assessment.result} />
      ) : (
        <p>No prediction is available for this assessment.</p>
      )}
      <p className="page-actions">
        <Link className="button secondary" to={PATHS.assessment}>
          Start a new assessment
        </Link>{' '}
        <Link className="text-button" to={PATHS.reports}>
          See all my reports
        </Link>
      </p>
    </main>
  );
}
