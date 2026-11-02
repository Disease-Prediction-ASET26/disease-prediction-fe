import { Link } from 'react-router-dom';
import { EMERGENCY_NUMBER } from '../../components/EmergencyBanner';
import { PATHS } from '../paths';

/** Landing view: what the app does, the emergency caveat, and the call to action. */
export function HomePage() {
  return (
    <main className="home-page">
      <h1>Check your symptoms</h1>
      <p className="lede">
        Describe how you feel and get a list of conditions that may match your symptoms, with an
        explanation for each. It takes about two minutes.
      </p>
      <p>
        This is not a medical diagnosis. If you think you are having an emergency, call{' '}
        <a href={`tel:${EMERGENCY_NUMBER}`}>{EMERGENCY_NUMBER}</a>.
      </p>
      <Link className="button-link" to={PATHS.assessment}>
        Start an assessment
      </Link>
    </main>
  );
}
