import { Link, Navigate, useLocation } from 'react-router-dom';
import { PredictionResultView } from '../../components/PredictionResultView';
import { PATHS, readAssessmentState } from '../paths';

/**
 * `/assessment/result` — ranked predictions for the assessment carried in router state. Entered
 * without that state (deep link, bookmark), it redirects to the form; an emergency assessment
 * redirects to the emergency view, since FR-P5 halts prediction output.
 */
export function ResultRoute() {
  const location = useLocation();
  const assessment = readAssessmentState(location.state);

  if (!assessment) return <Navigate to={PATHS.assessment} replace />;
  if (assessment.emergencyDetected) {
    return <Navigate to={PATHS.emergency} state={location.state} replace />;
  }

  return (
    <main className="result-page">
      <h1>Your assessment</h1>
      {assessment.result ? (
        <PredictionResultView result={assessment.result} />
      ) : (
        <p>No prediction is available for this assessment.</p>
      )}
      <p>
        <Link to={PATHS.assessment}>Start a new assessment</Link>
      </p>
    </main>
  );
}
