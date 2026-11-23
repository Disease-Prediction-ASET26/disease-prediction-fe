import { Link } from 'react-router-dom';
import { Button } from '@radix-ui/themes';
import stethoscopeImage from '../../assets/stethoscope.svg';
import leafImage from '../../assets/ginkgo-leaf.svg';
import fernImage from '../../assets/fern-leaf.svg';
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
    <main className="home-page landing-page">
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-copy">
            <h1>Check your symptoms</h1>
            <p className="landing-lede">
              When something feels off, understanding your symptoms can be a helpful first step.
              Pocket Doc offers information about possible conditions and precautions.
            </p>
            <Button size="3" asChild>
              <Link to={PATHS.assessment}>
                Start an assessment <Icon name="chevron" size={20} />
              </Link>
            </Button>
          </div>
          <div className="landing-art" aria-hidden="true">
            <img className="landing-leaf landing-leaf-two" src={leafImage} alt="" />
            <img className="landing-leaf landing-leaf-three" src={leafImage} alt="" />
            <img className="landing-stethoscope" src={stethoscopeImage} alt="" />
          </div>
          <p className="landing-emergency">
            <Icon name="alert" size={20} />
            <span>
              This is not a medical diagnosis. In an emergency, call{' '}
              <a href={`tel:${EMERGENCY_NUMBER}`}>{EMERGENCY_NUMBER}</a>.
            </span>
          </p>
        </div>
        <div className="landing-border" aria-hidden="true">
          <span className="landing-border-ground" />
          <img className="landing-border-fern landing-border-fern-left" src={fernImage} alt="" />
          <img className="landing-border-fern landing-border-fern-right" src={fernImage} alt="" />
          <img className="landing-border-fern landing-border-fern-small" src={fernImage} alt="" />
        </div>
      </section>
      <section className="landing-about" aria-labelledby="about-assessment">
        <div>
          <h2 id="about-assessment">Understanding your assessment</h2>
        </div>
        <div className="landing-about-copy">
          <p>
            Describe what you are experiencing or select symptoms from a list. You may be asked
            follow-up questions.
          </p>
          <p>
            Your assessment may include a possible condition, an explanation and precautions. It is
            information, not a diagnosis, and does not replace professional medical advice.
          </p>
          <p>You can review saved assessments in My reports and manage your consent in Account.</p>
        </div>
      </section>
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
        title={`Hello, ${firstName}`}
        description="Start a symptom assessment or review a previous one."
      />
      <EmergencyNote>
        If you think you have a medical emergency, call{' '}
        <a href={`tel:${EMERGENCY_NUMBER}`}>{EMERGENCY_NUMBER}</a> now.
      </EmergencyNote>
      <Link className="assessment-hero" to={PATHS.assessment}>
        <span>
          <strong>Start a new assessment</strong>
          <span>Describe your symptoms or choose from a list.</span>
        </span>
        <Icon name="chevron" />
      </Link>

      <ul className="stat-grid" aria-label="Your status">
        <li className="stat">
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
          <div>
            <small>Appointments</small>
            <strong>Not available yet</strong>
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
