import { Link } from 'react-router-dom';
import { useProfile } from '../../application/ProfileContext';
import { useAssessmentList } from '../../application/useStoredAssessments';
import { useAuth } from '../../auth/AuthContext';
import { EMERGENCY_NUMBER } from '../../components/EmergencyBanner';
import { ReportRows } from '../../components/ReportRows';
import { Icon } from '../../components/ui/Icon';
import { EmergencyNote, PageHeader } from '../../components/ui/Layout';
import { reportStatusLabel } from '../../domain/history';
import type { Profile } from '../../domain/profile';
import { PATHS } from '../paths';
import { AdminDashboard, DoctorDashboard } from './workspaces';

/**
 * `/` — the public landing page before sign-in, and the overview of the user's workspace after it
 * (patient, doctor or administrator, by the role in the profile).
 */
export function HomePage() {
  const { status } = useAuth();
  const { status: profileStatus, profile } = useProfile();

  if (status === 'authenticated' && profileStatus === 'ready' && profile) {
    if (profile.role === 'DOCTOR') return <DoctorDashboard profile={profile} />;
    if (profile.role === 'ADMIN') return <AdminDashboard />;
    return <PatientDashboard profile={profile} />;
  }
  return <Landing />;
}

function Landing() {
  return (
    <main className="narrow-page home-page">
      <PageHeader
        eyebrow="Pocket Doc"
        title="Check your symptoms"
        description="Describe how you feel and get the condition that most likely matches your symptoms, with an explanation and recommended precautions. It takes about two minutes."
      />
      <EmergencyNote>
        This is not a medical diagnosis. If you think you are having an emergency, call{' '}
        <a href={`tel:${EMERGENCY_NUMBER}`}>{EMERGENCY_NUMBER}</a>.
      </EmergencyNote>
      <Link className="button primary" to={PATHS.assessment}>
        Start an assessment
      </Link>
    </main>
  );
}

function PatientDashboard({ profile }: { profile: Profile }) {
  const { state } = useAssessmentList();
  const firstName = profile.fullName.trim().split(/\s+/)[0] || profile.fullName;
  const latest = state.status === 'success' ? state.data[0] : undefined;

  return (
    <main>
      <PageHeader
        eyebrow={`Hello, ${firstName}`}
        title="How are you feeling today?"
        description="Start a private symptom assessment or check your recent assessments."
      />
      <EmergencyNote>
        If you think you have a medical emergency, call{' '}
        <a href={`tel:${EMERGENCY_NUMBER}`}>{EMERGENCY_NUMBER}</a> now.
      </EmergencyNote>
      <Link className="assessment-hero" to={PATHS.assessment}>
        <span className="hero-icon">
          <Icon name="pulse" size={28} />
        </span>
        <span>
          <small>AI-guided symptom check</small>
          <strong>Start a new assessment</strong>
          <b>Describe what you feel in your own words or choose symptoms from the list.</b>
        </span>
        <i>
          <Icon name="chevron" />
        </i>
      </Link>

      <ul className="stat-grid" aria-label="Your status">
        <li className="stat">
          <span>
            <Icon name="file" />
          </span>
          <div>
            <small>Latest assessment</small>
            {state.status === 'loading' && <strong>Loading…</strong>}
            {state.status === 'error' && <strong>Unavailable</strong>}
            {state.status === 'success' &&
              (latest ? (
                <>
                  <strong>{latest.topDisease ?? 'No likely condition'}</strong>
                  <p>Report: {reportStatusLabel(latest.reportStatus)}</p>
                </>
              ) : (
                <>
                  <strong>None yet</strong>
                  <p>Your assessments will appear here</p>
                </>
              ))}
          </div>
        </li>
        <li className="stat">
          <span>
            <Icon name="shield" />
          </span>
          <div>
            <small>Health data consent</small>
            <strong>{profile.consentGranted ? 'Active' : 'Withdrawn'}</strong>
            <p>
              {profile.consentGranted
                ? 'You can withdraw it on your account page'
                : 'Give consent again to start an assessment'}
            </p>
          </div>
        </li>
        <li className="stat">
          <span>
            <Icon name="calendar" />
          </span>
          <div>
            <small>Appointments</small>
            <strong>Not available yet</strong>
            <p>Booking a specialist is coming in a later release</p>
          </div>
        </li>
      </ul>

      <section className="panel" aria-labelledby="recent-heading">
        <div className="panel-head">
          <div>
            <h2 id="recent-heading">Recent assessments</h2>
            <p>Your latest assessments and the status of their reports</p>
          </div>
          <Link className="text-button" to={PATHS.reports}>
            View all <Icon name="chevron" size={15} />
          </Link>
        </div>
        {state.status === 'loading' && (
          <p className="panel-message" role="status">
            Loading your assessments…
          </p>
        )}
        {state.status === 'error' && (
          <p className="panel-message" role="alert">
            {state.message}
          </p>
        )}
        {state.status === 'success' &&
          (state.data.length > 0 ? (
            <ReportRows rows={state.data.slice(0, 3)} />
          ) : (
            <p className="panel-message">You have not run an assessment yet.</p>
          ))}
      </section>
    </main>
  );
}
