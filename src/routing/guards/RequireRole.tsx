import { Link, Outlet } from 'react-router-dom';
import { PageHeader } from '../../components/ui/Layout';
import { useProfile } from '../../application/ProfileContext';
import type { Role } from '../../domain/profile';
import { ROLE_LABELS } from '../navigation';
import { PATHS } from '../paths';

/**
 * Pathless layout route inside `RequireProfile`: children belong to one workspace (patient, doctor
 * or administrator). This only shapes the UI; the backend checks the role on every request.
 */
export function RequireRole({ roles }: { roles: readonly Role[] }) {
  const { profile } = useProfile();

  if (profile && !roles.includes(profile.role)) {
    return (
      <main className="narrow-page">
        <PageHeader
          title="This page is not part of your workspace"
          description={`You are signed in as ${ROLE_LABELS[profile.role].toLowerCase()}, so this page is not available to you.`}
        />
        <Link className="button primary" to={PATHS.home}>
          Go to your overview
        </Link>
      </main>
    );
  }
  return <Outlet />;
}
