import { useProfile } from '../../application/ProfileContext';
import type { IconName } from '../../components/ui/Icon';
import { Icon } from '../../components/ui/Icon';
import { Badge, EmptyState, PageHeader } from '../../components/ui/Layout';
import type { Profile } from '../../domain/profile';
import { initialsOf } from '../navigation';

/**
 * Pages of the Pocket Doc design that have no backend API yet: appointments, the doctor portal and
 * the administrator console (roadmap Iteration 12). Each shows its place in the app and an honest
 * empty state instead of sample data, so nothing on screen can be mistaken for real records.
 */
interface UpcomingPageProps {
  eyebrow?: string;
  title: string;
  description: string;
  emptyTitle: string;
  emptyBody: string;
  icon: IconName;
}

function UpcomingPage({
  eyebrow,
  title,
  description,
  emptyTitle,
  emptyBody,
  icon,
}: UpcomingPageProps) {
  return (
    <main>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <section className="panel" aria-label={title}>
        <EmptyState icon={icon} title={emptyTitle} body={emptyBody} />
      </section>
    </main>
  );
}

const NOT_YET = 'This part of Pocket Doc is not available yet.';

export function AppointmentsRoute() {
  return (
    <UpcomingPage
      title="Appointments"
      description="Book and manage visits with a specialist."
      icon="calendar"
      emptyTitle="Booking is not available yet"
      emptyBody={`${NOT_YET} When it is, you will be able to book a specialist recommended by your assessment.`}
    />
  );
}

export function DoctorDashboard({ profile }: { profile: Profile }) {
  return (
    <main>
      <PageHeader
        eyebrow="Doctor workspace"
        title={`Welcome, ${profile.fullName}`}
        description="Review patient assessments sent to you and prepare for consultations."
      />
      <section className="panel" aria-label="Assessments to review">
        <EmptyState
          icon="file"
          title="No assessments to review"
          body={`${NOT_YET} Patients cannot send reports to doctors yet, so your inbox is empty.`}
        />
      </section>
    </main>
  );
}

export function DoctorAssessmentsRoute() {
  return (
    <UpcomingPage
      title="Assessment inbox"
      description="Reports assigned to you, sorted by urgency and received time."
      icon="file"
      emptyTitle="Your inbox is empty"
      emptyBody={`${NOT_YET} Reports will appear here once patients can send them to a doctor.`}
    />
  );
}

export function DoctorScheduleRoute() {
  return (
    <UpcomingPage
      title="Schedule"
      description="Review appointments and manage the slots patients can request."
      icon="calendar"
      emptyTitle="Scheduling is not available yet"
      emptyBody={`${NOT_YET} Appointment duration, visit format and slot rules still need to be agreed.`}
    />
  );
}

export function DoctorProfileRoute() {
  const { profile } = useProfile();
  if (!profile) return null;
  return (
    <main>
      <PageHeader
        title="Doctor profile"
        description="Professional information shown to patients and administrators."
      />
      <section className="profile-card" aria-label="Your profile">
        <div className="profile-hero">
          <span className="large-avatar" aria-hidden="true">
            {initialsOf(profile.fullName, profile.email)}
          </span>
          <div>
            <h2>{profile.fullName}</h2>
            <p>{profile.email}</p>
            <Badge tone="blue">
              <Icon name="doctor" size={13} /> Doctor
            </Badge>
          </div>
        </div>
        <p className="profile-note">
          <Icon name="info" size={16} /> Specialty, license number and verification are not stored
          yet. They will be added with the doctor portal.
        </p>
      </section>
    </main>
  );
}

export function AdminDashboard() {
  return (
    <main>
      <PageHeader
        eyebrow="Administration"
        title="System overview"
        description="Manage access, doctor verification and clinical AI governance."
      />
      <section className="panel" aria-label="System overview">
        <EmptyState
          icon="shield"
          title="The administrator console is not available yet"
          body={`${NOT_YET} Doctor verification, user management and the access audit will appear here.`}
        />
      </section>
    </main>
  );
}

export function AdminDoctorsRoute() {
  return (
    <UpcomingPage
      title="Doctors"
      description="Invite doctors and verify professional credentials before access is granted."
      icon="doctor"
      emptyTitle="Doctor verification is not available yet"
      emptyBody={`${NOT_YET} Invited doctors and the verification queue will appear here.`}
    />
  );
}

export function AdminUsersRoute() {
  return (
    <UpcomingPage
      title="Users"
      description="Manage account access and roles without exposing health information."
      icon="users"
      emptyTitle="User management is not available yet"
      emptyBody={`${NOT_YET} Accounts and their roles will appear here.`}
    />
  );
}

export function AdminModelRoute() {
  return (
    <UpcomingPage
      title="AI model"
      description="Review the active prediction model and its deployment status."
      icon="brain"
      emptyTitle="Model details are not available yet"
      emptyBody={`${NOT_YET} The prediction service does not expose its model version and status to the backend yet.`}
    />
  );
}

export function AdminAuditRoute() {
  return (
    <UpcomingPage
      title="Access audit"
      description="Pseudonymous access events, with no names or symptom details."
      icon="audit"
      emptyTitle="The access audit is not available yet"
      emptyBody={`${NOT_YET} Who may read the audit log still needs to be approved.`}
    />
  );
}
