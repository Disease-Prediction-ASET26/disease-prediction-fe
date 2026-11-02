import { useNavigate } from 'react-router-dom';
import type { AssessmentResponse } from '../../domain/assessment';
import { AssessmentPage } from '../../pages/AssessmentPage';
import type { AssessmentLocationState } from '../paths';
import { PATHS } from '../paths';

/**
 * `/assessment` — renders the Iteration 3 page unchanged and turns a successful submission into
 * navigation: emergency → `/assessment/emergency`, otherwise → `/assessment/result`. Validation
 * and network errors stay on this route (the page shows them).
 */
export function AssessmentRoute() {
  const navigate = useNavigate();

  const handleComplete = (response: AssessmentResponse) => {
    const state: AssessmentLocationState = { assessment: response };
    navigate(response.emergencyDetected ? PATHS.emergency : PATHS.result, { state });
  };

  return <AssessmentPage onAssessmentComplete={handleComplete} />;
}
