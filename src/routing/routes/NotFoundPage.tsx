import { Link } from 'react-router-dom';
import { PATHS } from '../paths';

/** `*` — fallback for any unknown path. */
export function NotFoundPage() {
  return (
    <main className="not-found-page">
      <h1>Page not found</h1>
      <p>The page you are looking for does not exist.</p>
      <p>
        <Link to={PATHS.home}>Go to the home page</Link> or{' '}
        <Link to={PATHS.assessment}>start an assessment</Link>.
      </p>
    </main>
  );
}
